-- =========================================================
-- GreenCareers OS · Schema v10 — Stellenformular vollständig ans Portal angebunden
-- Einmal komplett in den Supabase SQL Editor einfügen + "Run". Idempotent.
--
-- WARUM / Problem:
--  Das OS-Stellenformular erfasst jetzt alle Felder, die die Portal-Detailseite
--  zeigt (Vertragsart, Eintritt, Benefits, Ansprechpartner + Foto, Kontakt-
--  E-Mail/-Telefon, Stellen-Bilder). ZWEI DB-Sachen blockierten das aber:
--
--   1) status-CHECK: erlaubte nur ('aktiv','pausiert','geschlossen'). Der Client
--      schreibt beim Veröffentlichen 'wartet_freigabe' -> Constraint-Verletzung.
--      -> Veröffentlichen schlug für JEDEN Kunden fehl.
--
--   2) public_jobs-View (die das Portal liest) gab kontakt_email + kontakt_telefon
--      NICHT aus. Die Portal-Detailseite rendert diese Felder im Ansprechpartner-
--      Block, bekam sie aber nie -> Kontakt blieb leer, egal was im OS steht.
--
--  Die Spalten selbst existieren bereits (Schema v5). Hier wird NUR die Constraint
--  und die View korrigiert. Stammtabellen bleiben RLS-geschützt.
-- =========================================================

-- ---------- 1) STATUS-CONSTRAINT: alle Client-Status-Werte erlauben ----------
-- Client schreibt: 'pausiert' (Entwurf), 'wartet_freigabe' (Veröffentlichen),
-- 'aktiv' (live), 'freigegeben' (GC-Freigabe). 'entwurf'/'geschlossen' reserviert.
alter table public.stellenanzeigen drop constraint if exists stellenanzeigen_status_check;
alter table public.stellenanzeigen
  add constraint stellenanzeigen_status_check
  check (status in ('entwurf','wartet_freigabe','freigegeben','aktiv','pausiert','geschlossen'));

-- ---------- 2) public_jobs-View: Kontakt-Felder ergänzen ----------
-- security_invoker=false -> View läuft mit Owner-Rechten, umgeht RLS der
-- Stammtabellen, gibt aber NUR die hier gelisteten Spalten preis.
drop view if exists public.public_jobs;
create view public.public_jobs
with (security_invoker = false) as
select
  s.id,
  s.slug,
  s.titel,
  s.branche,
  coalesce(nullif(btrim(s.ort),''), c.ort)        as ort,
  s.beschreibung,
  s.beschaeftigungsart,
  s.vertragsart,
  s.gehalt,
  s.eintritt,
  s.aufgaben,
  s.profil,
  s.benefits,
  s.benefits_list,
  s.stellen_bilder,
  s.ansprechpartner,
  s.ansprechpartner_rolle,
  s.ansprechpartner_foto,
  s.kontakt_email,                                 -- NEU: war bisher nicht in der View
  s.kontakt_telefon,                               -- NEU: war bisher nicht in der View
  coalesce(s.published_at, s.created_at)           as published_at,
  c.id                                             as firma_id,
  c.name                                           as firma,
  c.logo_url                                        as firma_logo,
  c.website                                         as firma_website,
  c.karriere_url                                    as firma_karriere_url,
  c.ort                                             as firma_ort,
  c.theme                                           as firma_theme,
  c.ueber_uns                                       as firma_ueber_uns,
  c.mitarbeiter_anzahl                              as firma_mitarbeiter,
  c.gruendungsjahr                                  as firma_gruendung,
  c.titelbild                                       as firma_titelbild,
  c.unternehmensbilder                              as firma_bilder,
  c.social                                          as firma_social
from public.stellenanzeigen s
join public.customers c on c.id = s.customer_id
where s.status = 'aktiv';

grant select on public.public_jobs to anon, authenticated;
