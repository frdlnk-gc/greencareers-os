-- =========================================================
-- GreenCareers OS · Schema v11 — Stellen-Kontingent (Self-Service-Veröffentlichung)
-- Einmal komplett in den Supabase SQL Editor einfügen + "Run". Idempotent.
--
-- WARUM / Kontext:
--  Das OS stellt das Veröffentlichen von Stellen auf SELF-SERVICE um: „Veröffentlichen"
--  schaltet eine Stelle sofort live (status 'aktiv'), OHNE manuelle GC-Freigabe. Damit
--  das nicht unbegrenzt geht, prüft der Client ein KONTINGENT pro Betrieb:
--   - produkt-Tier (smart/premium/excellence) -> Stelle läuft auf diesem Tier
--   - stellen_kontingent = wie viele Stellen gleichzeitig live sein dürfen
--   - kontingent_frei = ist das Kontingent freigeschaltet?
--       * Kreditkarte / PayPal / Lastschrift  -> automatisch bezahlt -> sofort frei
--       * Kauf auf Rechnung (nur Einmalkauf)   -> erst frei, wenn GC den Zahlungseingang
--                                                 manuell bestätigt (kontingent_frei = true)
--   - kontingent_bis = Laufzeit-Ende (Einmalkauf = 3 Monate, Abo = 6/12 Monate)
--
--  Die Spalten produkt / kauftyp / zahlungsart / laufzeit existieren bereits (Schema v6).
--  Hier kommen NUR die drei Kontingent-Spalten dazu.
--
--  WICHTIG (kein Lockout): kontingent_frei bekommt Default TRUE und stellen_kontingent
--  bleibt NULL (= unbegrenzt) für alle BESTANDS-Firmen. So werden die 8 echten Tiefbau-
--  Portal-Firmen mit ihren bereits live geschalteten Stellen NICHT blockiert. Der Client
--  ist zusätzlich fail-open: ohne Kontingent-Daten wird nie blockiert.
-- =========================================================

-- ---------- Kontingent-Spalten ----------
alter table public.customers add column if not exists stellen_kontingent integer;            -- max. gleichzeitig live; NULL = unbegrenzt
alter table public.customers add column if not exists kontingent_frei    boolean not null default true;  -- freigeschaltet?
alter table public.customers add column if not exists kontingent_bis     timestamptz;          -- Laufzeit-Ende (informativ)

comment on column public.customers.stellen_kontingent is 'Max. gleichzeitig veröffentlichte (status=aktiv) Stellen. NULL = unbegrenzt.';
comment on column public.customers.kontingent_frei    is 'Kontingent freigeschaltet? Karte/PayPal/Lastschrift sofort true; Rechnung erst nach manueller Zahlungs-Bestätigung.';
comment on column public.customers.kontingent_bis     is 'Ende der Laufzeit. Einmalkauf = +3 Monate, Abo = +6/12 Monate ab Freischaltung.';

-- ---------- Backfill: Bestands-Firmen NICHT sperren ----------
-- (Nur defensiv – Default true greift bereits. Macht alte NULLs explizit frei.)
update public.customers set kontingent_frei = true where kontingent_frei is null;

-- =========================================================
-- ANLEITUNG FÜR DEN ZAHLUNGS-ABGLEICH (manuell oder per Qonto-Job):
--
--  Kontingent eines Kunden freischalten (z. B. nach Rechnungs-Eingang), Premium, 1 Stelle,
--  Einmalkauf mit 3 Monaten Laufzeit:
--
--    update public.customers
--       set produkt = 'premium',
--           kauftyp = 'einmalzahlung',
--           zahlungsart = 'rechnung',
--           stellen_kontingent = 1,
--           kontingent_frei = true,
--           kontingent_bis = now() + interval '3 months'
--     where id = '<CUSTOMER_UUID>';
--
--  Abo (Smart, 12 Monate, Lastschrift) – ist automatisch bezahlt, sofort frei:
--
--    update public.customers
--       set produkt = 'smart', kauftyp = 'abo', zahlungsart = 'lastschrift',
--           laufzeit = '12', stellen_kontingent = 1, kontingent_frei = true,
--           kontingent_bis = now() + interval '12 months'
--     where id = '<CUSTOMER_UUID>';
-- =========================================================
