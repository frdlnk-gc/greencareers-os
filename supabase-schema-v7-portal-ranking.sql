-- =========================================================
-- GreenCareers OS · Schema v7 — Portal-Ranking: Produkt-Tier + PLZ in public_jobs
-- Einmal komplett in den Supabase SQL Editor einfuegen + "Run". Idempotent.
--
-- Was das macht / WARUM:
--  Das Stellenportal (strassen-tiefbau.green-careers.de) braucht zwei Infos,
--  die die public_jobs-View bisher NICHT preisgibt:
--   1) firma_produkt  -> Tier (smart/premium/excellence). Nur PREMIUM + EXCELLENCE
--      duerfen im oberen "Favoriten"-Banner laufen, Smart NICHT.
--   2) firma_plz      -> fuer die Entfernungs-Sortierung (Bewerber gibt PLZ ein,
--      naehere Stellen ranken weiter oben).
--  Die View wird komplett neu gebaut (drop+create) inkl. aller v5-Spalten plus
--  den zwei neuen. Stammtabellen bleiben RLS-geschuetzt, anon liest nur die View.
-- =========================================================

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
  coalesce(s.published_at, s.created_at)           as published_at,
  c.id                                             as firma_id,
  c.name                                           as firma,
  c.logo_url                                        as firma_logo,
  c.website                                         as firma_website,
  c.karriere_url                                    as firma_karriere_url,
  c.ort                                             as firma_ort,
  c.plz                                             as firma_plz,        -- NEU: fuer PLZ-/Entfernungs-Sortierung
  c.produkt                                         as firma_produkt,    -- NEU: smart|premium|excellence (Banner-Tier)
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
