-- =========================================================
-- GreenCareers OS · Schema v5 — Oeffentliches Stellenportal (VOLL)
-- (strassen-tiefbau.green-careers.de)
-- Einmal komplett in den Supabase SQL Editor einfuegen + "Run". Idempotent.
--
-- ERSETZT v4 vollstaendig — v4 NICHT separat ausfuehren. v5 enthaelt alles aus v4
-- plus die Firmenprofil-/Stellen-Felder fuer die echte GreenCareers-Detailseite
-- (Ueber uns, Unternehmensbilder, Stellenbilder, Ansprechpartner m. Foto, Benefits-Liste).
--
-- Was das macht:
--  1) Erweitert customers       um Firmenprofil-Felder (Ueber uns, Bilder, Kennzahlen, Social)
--  2) Erweitert stellenanzeigen um Portal-Felder (Beschaeftigung, Gehalt, Bilder, Ansprechpartner ...)
--  3) Legt eine OEFFENTLICHE View public_jobs an (nur veroeffentlichte Stellen, nur
--     unbedenkliche Felder) -> anon darf lesen, Stammtabellen bleiben RLS-geschuetzt
--  4) Legt apply_to_job() an -> anonyme Besucher koennen sich NUR auf aktive Stellen bewerben
-- =========================================================

-- ---------- 1) CUSTOMERS: Firmenprofil-Felder (fuer "Ueber uns") ----------
alter table public.customers add column if not exists karriere_url        text;
alter table public.customers add column if not exists ueber_uns           text;     -- Beschreibungstext der Firma
alter table public.customers add column if not exists mitarbeiter_anzahl   text;     -- Freitext, z.B. "190"
alter table public.customers add column if not exists gruendungsjahr       text;     -- Freitext, z.B. "1960"
alter table public.customers add column if not exists titelbild            text;     -- Hero-/Titelbild-URL
alter table public.customers add column if not exists unternehmensbilder   jsonb not null default '[]';  -- Array von Bild-URLs
alter table public.customers add column if not exists social               jsonb not null default '{}';  -- {instagram,facebook,linkedin,...}

-- ---------- 2) STELLENANZEIGEN: Portal-Felder ----------
alter table public.stellenanzeigen add column if not exists slug                 text;
alter table public.stellenanzeigen add column if not exists beschaeftigungsart   text;   -- Vollzeit / Teilzeit / Minijob / Ausbildung
alter table public.stellenanzeigen add column if not exists vertragsart          text;   -- Unbefristet / Befristet / ...
alter table public.stellenanzeigen add column if not exists gehalt               text;   -- Freitext, z.B. "45.000 - 55.000 EUR / Jahr"
alter table public.stellenanzeigen add column if not exists eintritt             text;   -- z.B. "ab sofort"
alter table public.stellenanzeigen add column if not exists aufgaben             text;   -- Deine Aufgaben
alter table public.stellenanzeigen add column if not exists profil               text;   -- Dein Profil / Anforderungen
alter table public.stellenanzeigen add column if not exists benefits             text;   -- Wir bieten (Freitext-Fallback)
alter table public.stellenanzeigen add column if not exists benefits_list        jsonb not null default '[]';  -- Array von Benefit-Strings (Katalog)
alter table public.stellenanzeigen add column if not exists stellen_bilder       jsonb not null default '[]';  -- Array von Bild-URLs (Job-Galerie)
alter table public.stellenanzeigen add column if not exists ansprechpartner      text;
alter table public.stellenanzeigen add column if not exists ansprechpartner_rolle text;  -- z.B. "Personalleiterin"
alter table public.stellenanzeigen add column if not exists ansprechpartner_foto text;   -- Foto-URL
alter table public.stellenanzeigen add column if not exists kontakt_email        text;
alter table public.stellenanzeigen add column if not exists kontakt_telefon      text;
alter table public.stellenanzeigen add column if not exists published_at         timestamptz;
alter table public.stellenanzeigen add column if not exists extra                jsonb not null default '{}';

-- Slug eindeutig (fuer schoene Portal-URLs ?job=slug)
do $$
begin
  if not exists (select 1 from pg_constraint where conname='stellen_slug_uniq') then
    -- erst Backfill, damit der Unique-Index nicht an NULL-Dubletten scheitert
    update public.stellenanzeigen
       set slug = lower(regexp_replace(coalesce(titel,'stelle'),'[^a-zA-Z0-9]+','-','g'))
                  ||'-'|| substr(replace(id::text,'-',''),1,6)
     where slug is null or btrim(slug)='';
    alter table public.stellenanzeigen
      add constraint stellen_slug_uniq unique (slug);
  end if;
end $$;

-- published_at fuellen, wo aktiv aber noch leer
update public.stellenanzeigen
   set published_at = coalesce(published_at, created_at, now())
 where status = 'aktiv' and published_at is null;

-- ---------- 3) OEFFENTLICHE VIEW: nur veroeffentlichte Stellen ----------
-- security_invoker=false => die View laeuft mit Owner-Rechten und umgeht die
-- RLS der Stammtabellen, gibt aber NUR die hier gelisteten Spalten preis.
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

-- ---------- 4) OEFFENTLICHE BEWERBUNG (sicher, nur aktive Stellen) ----------
create or replace function public.apply_to_job(
  p_slug      text,
  p_name      text,
  p_email     text default null,
  p_telefon   text default null,
  p_nachricht text default null,
  p_extra     jsonb default '{}'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job record;
begin
  select id, customer_id, status, titel
    into v_job
    from public.stellenanzeigen
   where slug = p_slug;

  if not found or v_job.status <> 'aktiv' then
    raise exception 'Diese Stelle ist nicht (mehr) verfuegbar.';
  end if;
  if coalesce(btrim(p_name),'') = '' then
    raise exception 'Bitte gib deinen Namen an.';
  end if;
  if coalesce(btrim(p_email),'') = '' and coalesce(btrim(p_telefon),'') = '' then
    raise exception 'Bitte gib E-Mail oder Telefon an.';
  end if;

  insert into public.bewerber
    (customer_id, stellenanzeige_id, name, email, telefon, quelle, status, extra)
  values
    (v_job.customer_id, v_job.id, btrim(p_name), nullif(btrim(p_email),''),
     nullif(btrim(p_telefon),''), 'website', 'neu',
     coalesce(p_extra,'{}'::jsonb)
       || jsonb_build_object('nachricht', p_nachricht, 'stelle', v_job.titel));
end;
$$;

revoke all on function public.apply_to_job(text,text,text,text,text,jsonb) from public;
grant execute on function public.apply_to_job(text,text,text,text,text,jsonb) to anon, authenticated;
