-- =========================================================
-- GreenCareers OS · Schema v15 — Kontingent-DURCHSETZUNG auf DB-Ebene (fail-closed)
-- Einmal komplett in den Supabase SQL Editor einfügen + "Run". Idempotent.
--
-- WARUM (das eigentliche Problem):
--  Die Veröffentlichungs-Sperre lief BISHER NUR im Browser (JavaScript). Wer die
--  Konsole öffnet, könnte stellenanzeigen.status='aktiv' direkt schreiben und so
--  OHNE Zahlung eine Stelle live schalten. Das darf NIE passieren.
--  Zusätzlich war der Default falsch: customers.kontingent_frei stand auf
--  DEFAULT TRUE -> ein frisch registrierter, NICHT zahlender Betrieb war
--  „freigeschaltet" ab Sekunde null.
--
-- WAS DIESE MIGRATION TUT:
--  1) Trigger `enforce_stelle_kontingent` auf public.stellenanzeigen:
--     Verhindert den Übergang NACH status='aktiv' (INSERT direkt aktiv ODER
--     UPDATE von !=aktiv -> aktiv), wenn der Betrieb nicht berechtigt ist:
--       - kontingent_frei = true  (Zahlung eingegangen / Abo)
--       - UND nicht abgelaufen    (Einmalkauf: kontingent_bis >= jetzt; Abo läuft weiter)
--       - UND Kontingent frei      (stellen_kontingent NULL = unbegrenzt, sonst aktive < Limit)
--     -> Server-seitige Wahrheit. Die Konsole kann das NICHT umgehen.
--  2) Default kippen: kontingent_frei DEFAULT FALSE (neue Betriebe = gesperrt,
--     bis Zahlung da ist).
--  3) Sicheres Backfill: bestehende zahlende / bereits live geschaltete Betriebe
--     BLEIBEN frei; nur nicht-zahlende ohne Live-Stelle werden auf false gesetzt.
--
--  Voraussetzung: Schema v11 (Kontingent-Spalten) + v13 (apply_purchase_contingent).
-- =========================================================

-- ---------- 0) Spalte absichern (falls v11 nicht lief, Default direkt richtig) ----------
alter table public.customers
  add column if not exists kontingent_frei boolean not null default false;

-- ---------- 1) Trigger-Funktion: berechtigt der Betrieb diese Stelle zu schalten? ----------
create or replace function public.enforce_stelle_kontingent()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  c            public.customers%rowtype;
  v_used       int;
  v_kauftyp    text;
  v_unbegrenzt boolean;
begin
  -- Nur prüfen, wenn die Zeile NEU auf 'aktiv' geht.
  -- INSERT direkt aktiv  ODER  UPDATE von etwas anderem -> 'aktiv'.
  if new.status is distinct from 'aktiv' then
    return new;                                  -- pausiert/entwurf/etc. immer erlaubt
  end if;
  if tg_op = 'UPDATE' and old.status = 'aktiv' then
    return new;                                  -- war schon aktiv (z. B. nur slug/Titel-Update)
  end if;

  -- Betrieb laden.
  select * into c from public.customers where id = new.customer_id;
  if not found then
    raise exception 'Kein Betrieb zur Stelle gefunden – Veröffentlichung abgelehnt.';
  end if;

  -- (a) Freischaltung zwingend.
  if coalesce(c.kontingent_frei, false) is not true then
    raise exception 'KONTINGENT_GESPERRT: Zahlung noch nicht eingegangen – Stelle kann nicht veröffentlicht werden.';
  end if;

  -- (b) Ablauf nur beim Einmalkauf erzwingen (Abo verlängert sich automatisch).
  v_kauftyp := case when c.kauftyp = 'abo' then 'abo'
                    when c.kauftyp ~* 'einmal' then 'einmal' else '' end;
  if v_kauftyp <> 'abo'
     and c.kontingent_bis is not null
     and c.kontingent_bis < now() then
    raise exception 'KONTINGENT_ABGELAUFEN: Laufzeit deines Kontingents ist vorbei – bitte verlängern.';
  end if;

  -- (c) Stückzahl: NULL = unbegrenzt; sonst aktive (ohne diese Zeile) < Limit.
  v_unbegrenzt := c.stellen_kontingent is null;
  if not v_unbegrenzt then
    select count(*) into v_used
      from public.stellenanzeigen s
     where s.customer_id = new.customer_id
       and s.status = 'aktiv'
       and s.id <> new.id;
    if v_used >= c.stellen_kontingent then
      raise exception 'KONTINGENT_AUSGESCHOEPFT: % von % Stellen bereits aktiv.', v_used, c.stellen_kontingent;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_stelle_kontingent on public.stellenanzeigen;
create trigger trg_enforce_stelle_kontingent
  before insert or update on public.stellenanzeigen
  for each row execute function public.enforce_stelle_kontingent();

-- ---------- 2) Default kippen: neue Betriebe sind gesperrt, bis Zahlung da ist ----------
alter table public.customers
  alter column kontingent_frei set default false;

-- ---------- 3) Sicheres Backfill ----------
-- a) Wer schon eine LIVE-Stelle hat ODER ein Produkt gebucht hat ODER ein Abo
--    fährt ODER bereits ein Kontingent-Enddatum in der Zukunft hat -> BLEIBT frei.
update public.customers c
   set kontingent_frei = true
 where coalesce(c.kontingent_frei, false) is true
    or exists (select 1 from public.stellenanzeigen s
                where s.customer_id = c.id and s.status = 'aktiv')
    or nullif(c.produkt, '') is not null
    or c.kauftyp = 'abo'
    or (c.kontingent_bis is not null and c.kontingent_bis >= now());

-- b) Alle anderen (keine Zahlung, kein Produkt, keine Live-Stelle) -> gesperrt.
update public.customers c
   set kontingent_frei = false
 where coalesce(c.kontingent_frei, false) is true
   and nullif(c.produkt, '') is null
   and (c.kauftyp is null or c.kauftyp = '')
   and (c.kontingent_bis is null or c.kontingent_bis < now())
   and not exists (select 1 from public.stellenanzeigen s
                    where s.customer_id = c.id and s.status = 'aktiv');

-- ---------- 4) FIX C: Doppelte Bestellungen pro Stripe-Session technisch unmöglich ----------
-- Der Stripe-Webhook kann dasselbe Event mehrfach senden. Bisher schützte nur ein
-- SELECT-dann-INSERT (Race möglich). Dieser UNIQUE-Index macht Doppel-Bestellungen
-- auf DB-Ebene unmöglich (NULL-Sessions, z. B. Rechnungskäufe, bleiben erlaubt).
create unique index if not exists bestellungen_stripe_session_uniq
  on public.bestellungen (stripe_session_id)
  where stripe_session_id is not null;
