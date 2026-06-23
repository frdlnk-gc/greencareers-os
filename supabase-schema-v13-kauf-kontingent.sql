-- =========================================================
-- GreenCareers OS · Schema v13 — Kauf -> Kontingent automatisch (nach Stripe-Zahlung)
-- Einmal komplett in den Supabase SQL Editor einfügen + "Run". Idempotent.
--
-- WARUM / Problem:
--  Wenn ein Kunde über das GreyCareers-Portal ein Stellen-Paket bucht und bezahlt,
--  muss seine customers-Zeile die Kontingent-Felder bekommen (produkt, kauftyp,
--  zahlungsart, betrag, laufzeit, stellen_kontingent, kontingent_frei, kontingent_bis).
--  Bisher passierte das NICHT automatisch -> jede Buchung musste manuell per SQL
--  freigeschaltet werden.
--
--  Diese RPC bündelt die GESAMTE Kontingent-Logik an EINER Stelle, damit die
--  Edge Function (dynamic-responder, Stripe-Webhook) nach erfolgreicher Zahlung
--  nur EINEN Aufruf machen muss – ohne die Frei-/Laufzeit-Regeln selbst zu kennen.
--
--  REGELN (identisch zur Client-Logik in jobContingent()):
--   * kontingent_frei:
--       - Kreditkarte / PayPal / Lastschrift / Überweisung -> sofort TRUE (bezahlt)
--       - Kauf auf Rechnung                                 -> FALSE (Gate bis GC bestätigt)
--   * kontingent_bis (Laufzeit-Ende ab jetzt):
--       - Einmalkauf -> +3 Monate
--       - Abo, laufzeit '12' -> +12 Monate; sonst -> +6 Monate
--   * stellen_kontingent = gekaufte Menge (p_stellen). NULL/0 -> 1 (Mindestmenge).
--
--  SICHERHEIT: SECURITY DEFINER, NUR für service_role ausführbar (die Edge
--  Function nutzt den Service-Role-Key). Kein Zugriff für anon/authenticated,
--  damit niemand sich selbst ein Kontingent freischalten kann.
-- =========================================================

create or replace function public.apply_purchase_contingent(
  p_customer_id uuid,
  p_produkt     text,                 -- 'smart' | 'premium' | 'excellence'
  p_kauftyp     text,                 -- 'einmalzahlung' | 'abo'
  p_zahlungsart text,                 -- 'karte'|'paypal'|'lastschrift'|'ueberweisung'|'rechnung'
  p_betrag      numeric default null,
  p_laufzeit    text    default null, -- '6' | '12' (nur Abo)
  p_stellen     integer default 1     -- gekaufte Menge gleichzeitig live
)
returns public.customers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_kauftyp text := case when p_kauftyp = 'abo' then 'abo' else 'einmalzahlung' end;
  v_zahl    text := lower(coalesce(p_zahlungsart,''));
  v_frei    boolean;
  v_bis     timestamptz;
  v_stellen integer := greatest(coalesce(p_stellen,1), 1);
  v_row     public.customers;
begin
  if p_customer_id is null then
    raise exception 'customer_id fehlt.';
  end if;

  -- Freischaltung: alles außer Rechnung ist sofort bezahlt -> frei.
  v_frei := (v_zahl <> 'rechnung');

  -- Laufzeit-Ende ab jetzt.
  if v_kauftyp = 'abo' then
    v_bis := now() + (case when p_laufzeit = '12' then interval '12 months' else interval '6 months' end);
  else
    v_bis := now() + interval '3 months';
  end if;

  update public.customers c
     set produkt            = coalesce(nullif(p_produkt,''), c.produkt),
         kauftyp            = v_kauftyp,
         zahlungsart        = nullif(v_zahl,''),
         betrag             = coalesce(p_betrag, c.betrag),
         laufzeit           = case when v_kauftyp = 'abo' then coalesce(p_laufzeit, c.laufzeit) else c.laufzeit end,
         stellen_kontingent = v_stellen,
         kontingent_frei    = v_frei,
         kontingent_bis     = v_bis
   where c.id = p_customer_id
   returning c.* into v_row;

  if not found then
    raise exception 'Kein Betrieb mit id % gefunden.', p_customer_id;
  end if;

  return v_row;
end;
$$;

-- NUR der Service-Role (Edge Function) darf das aufrufen. Niemand sonst.
revoke all on function public.apply_purchase_contingent(uuid, text, text, text, numeric, text, integer) from public;
revoke all on function public.apply_purchase_contingent(uuid, text, text, text, numeric, text, integer) from anon, authenticated;
grant execute on function public.apply_purchase_contingent(uuid, text, text, text, numeric, text, integer) to service_role;

-- =========================================================
-- EDGE-FUNCTION-PATCH (dynamic-responder) — nach erfolgreicher Stripe-Zahlung einfügen:
--
--   In der Stelle, wo der Stripe-Webhook 'checkout.session.completed' (bzw.
--   'invoice.paid' für Abos) verarbeitet wird, NACH dem Verbuchen der Zahlung:
--
--     // supabase = createClient(SUPABASE_URL, SB_SERVICE_ROLE_KEY)
--     const md = session.metadata || {};              // beim Checkout mitgegeben
--     const { error } = await supabase.rpc('apply_purchase_contingent', {
--       p_customer_id: md.customer_id,                 // UUID des Betriebs
--       p_produkt:     md.produkt,                     // 'smart'|'premium'|'excellence'
--       p_kauftyp:     md.kauftyp,                     // 'einmalzahlung'|'abo'
--       p_zahlungsart: md.zahlungsart,                 // 'karte'|'paypal'|'lastschrift'|'rechnung'…
--       p_betrag:      Number(session.amount_total || 0) / 100,
--       p_laufzeit:    md.laufzeit || null,            // '6'|'12' bei Abo
--       p_stellen:     Number(md.stellen || 1),        // gekaufte Menge
--     });
--     if (error) console.error('apply_purchase_contingent', error);
--
--   WICHTIG: Beim Erstellen der Stripe-Checkout-Session diese Felder als
--   `metadata` mitgeben (customer_id, produkt, kauftyp, zahlungsart, laufzeit,
--   stellen), damit der Webhook sie hier auslesen kann.
--
--   Bei Kauf auf Rechnung gibt es keinen sofortigen Stripe-Zahlungseingang ->
--   apply_purchase_contingent setzt kontingent_frei=false (Gate). Den Kunden
--   später per Qonto-Abgleich freischalten:
--     update public.customers set kontingent_frei = true where id = '<UUID>';
-- =========================================================
