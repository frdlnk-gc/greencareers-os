-- =========================================================
-- GreenCareers OS · Schema v20 — Newsletter & Lead-Automation (Lemlist)
-- Einmal komplett in den Supabase SQL Editor einfuegen + "Run". Idempotent.
--
-- WAS DAS MACHT (fuer das GC Tracking Dashboard, Bereich "Marketing"):
--  Legt das Datenfundament fuer den GreenCareers-Newsletter-Versand ueber
--  Lemlist an. Drei getrennte Zielgruppen ("Audiences") mit je EIGENEN
--  Kampagnen, weil jede andere Interessen/Inhalte hat:
--    - b2b_neukunde       (potenzielle B2B-Kunden / Betriebe, noch kein Kauf)
--    - b2b_bestandskunde  (zahlende Betriebe, produkt gesetzt)
--    - bewerber           (Stellensuchende aus dem Netzwerk)
--
--  Segmentierung zusaetzlich nach theme (galabau|tiefbau|landwirtschaft) und
--  optional branche (Sub-Branche). Bei Bewerbern ist die Branche BEWUSST
--  optional: Recruiting-Themen ("attraktiver Arbeitgeber", "besserer Job")
--  funktionieren oft branchenuebergreifend. -> branche nullable.
--
--  Opt-in: SINGLE-OPT-IN. Leads laufen sofort aktiv rein (status='active').
--  JEDE Mail muss unten einen Abmeldelink tragen ("Keine weiteren E-Mails");
--  dafuer traegt jeder Abonnent einen eindeutigen unsubscribe_token. Der
--  Einwilligungstext + Zeitpunkt + Quelle werden trotzdem protokolliert
--  (Nachweisbarkeit), auch bei Single-Opt-in.
--
--  Lemlist-Modell: KAMPAGNEN MAPPEN + LEADS EINSCHLEUSEN. Du legst je
--  Zielgruppe/Branche eine Kampagne in Lemlist an; ein Leadmagnet
--  (newsletter_leadmagnets) bildet Landingpage -> Lemlist-Kampagne ab. Neue
--  Leads werden automatisch der richtigen Kampagne zugeordnet und per
--  Edge-Function (newsletter-lemlist) eingeschleust.
--
-- TABELLEN
--  1) newsletter_leadmagnets  — Mapping Landingpage/Leadmagnet -> Kampagne
--  2) newsletter_subscribers  — Abonnenten/Leads (die eigentliche Liste)
--  3) newsletter_campaigns    — interne Kampagnen-/Content-Entwuerfe (KI + Freigabe)
--  4) newsletter_events       — Log (eingeschleust/abgemeldet/gebounced) fuers Tracking
--
-- SICHERHEIT
--  RLS auf allen 4 Tabellen. Direkter Zugriff NUR fuer gc_admin (is_gc_admin()).
--  Oeffentlich (anon) laeuft ausschliesslich ueber SECURITY-DEFINER-RPCs:
--    - newsletter_subscribe(...)         (LP traegt Lead ein)
--    - newsletter_unsubscribe(token)     (Abmeldelink)
--    - newsletter_leadmagnet_public(slug)(LP liest Titel + Einwilligungstext)
--
-- Voraussetzung: public.is_gc_admin() existiert bereits (Schema v9/v16).
-- =========================================================

-- ---------- 0) Helfer: updated_at-Trigger ----------
create or replace function public.nl_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- =========================================================
-- 1) LEADMAGNETS — die "automatische Schnittstelle" LP -> Lemlist
-- =========================================================
create table if not exists public.newsletter_leadmagnets (
  id                   uuid primary key default gen_random_uuid(),
  slug                 text not null unique,            -- von der Landingpage referenziert
  title                text not null,
  audience             text not null default 'b2b_neukunde'
                         check (audience in ('b2b_neukunde','b2b_bestandskunde','bewerber')),
  theme                text,                            -- galabau|tiefbau|landwirtschaft (optional)
  branche              text,                            -- Sub-Branche (optional)
  landingpage_url      text,
  lemlist_campaign_id  text,                            -- Ziel-Kampagne in Lemlist
  consent_text         text,                            -- Einwilligungstext, den die LP anzeigt
  double_optin         boolean not null default false,  -- Standard: Single-Opt-in
  active               boolean not null default true,
  meta                 jsonb not null default '{}',
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
drop trigger if exists nl_lm_touch on public.newsletter_leadmagnets;
create trigger nl_lm_touch before update on public.newsletter_leadmagnets
  for each row execute function public.nl_touch_updated_at();

-- =========================================================
-- 2) SUBSCRIBERS — die Abonnenten-/Lead-Liste
-- =========================================================
create table if not exists public.newsletter_subscribers (
  id                 uuid primary key default gen_random_uuid(),
  email              text not null,
  name               text,
  audience           text not null default 'b2b_neukunde'
                       check (audience in ('b2b_neukunde','b2b_bestandskunde','bewerber')),
  theme              text,                              -- galabau|tiefbau|landwirtschaft
  branche            text,                              -- Sub-Branche (optional)
  quelle             text,                              -- 'landingpage' | 'import' | 'customers' | 'bewerber' | ...
  leadmagnet         text,                              -- slug aus newsletter_leadmagnets
  landingpage        text,                              -- konkrete LP-URL
  status             text not null default 'active'
                       check (status in ('active','unsubscribed','bounced','complained')),
  -- Nachweis der Einwilligung (auch bei Single-Opt-in dokumentieren)
  consent_text       text,
  consent_at         timestamptz,
  consent_ip         text,
  consent_source     text,
  -- Abmeldung (Single-Opt-in braucht sauberen Opt-out)
  unsubscribe_token  uuid not null default gen_random_uuid() unique,
  unsubscribed_at    timestamptz,
  -- Lemlist-Verknuepfung
  lemlist_campaign_id text,
  lemlist_lead_id     text,
  lemlist_status      text,                             -- z.B. 'enrolled' | 'error' | 'unsubscribed'
  lemlist_synced_at   timestamptz,
  -- Optionale Herkunfts-Verknuepfung
  customer_id        uuid,                              -- wenn aus public.customers gespiegelt
  bewerber_id        uuid,                              -- wenn aus public.bewerber gespiegelt
  meta               jsonb not null default '{}',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
-- Ein und dieselbe E-Mail darf pro Zielgruppe nur EINMAL existieren
-- (dieselbe Person kann aber z.B. Bewerber UND B2B sein).
create unique index if not exists nl_sub_email_audience_uniq
  on public.newsletter_subscribers (lower(email), audience);
create index if not exists nl_sub_audience_theme on public.newsletter_subscribers (audience, theme);
create index if not exists nl_sub_status         on public.newsletter_subscribers (status);
drop trigger if exists nl_sub_touch on public.newsletter_subscribers;
create trigger nl_sub_touch before update on public.newsletter_subscribers
  for each row execute function public.nl_touch_updated_at();

-- =========================================================
-- 3) CAMPAIGNS — interne Content-Entwuerfe (KI-Generierung + Freigabe)
--    (Der eigentliche Versand laeuft in Lemlist; hier liegt der von dir
--     freizugebende Inhalt je Zielgruppe/Segment.)
-- =========================================================
create table if not exists public.newsletter_campaigns (
  id                  uuid primary key default gen_random_uuid(),
  title               text not null,
  audience            text not null default 'b2b_neukunde'
                        check (audience in ('b2b_neukunde','b2b_bestandskunde','bewerber')),
  theme               text,
  branche             text,
  subject             text,
  preheader           text,
  body_html           text,
  body_text           text,
  status              text not null default 'entwurf'
                        check (status in ('entwurf','freigegeben','gesendet')),
  lemlist_campaign_id text,                             -- Ziel-Kampagne in Lemlist
  generated_by_ai     boolean not null default false,
  ai_prompt           text,
  ai_meta             jsonb not null default '{}',
  created_by          uuid,
  approved_by         uuid,
  approved_at         timestamptz,
  sent_at             timestamptz,
  meta                jsonb not null default '{}',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists nl_camp_audience on public.newsletter_campaigns (audience, status);
drop trigger if exists nl_camp_touch on public.newsletter_campaigns;
create trigger nl_camp_touch before update on public.newsletter_campaigns
  for each row execute function public.nl_touch_updated_at();

-- =========================================================
-- 4) EVENTS — Log fuers Tracking-Dashboard
-- =========================================================
create table if not exists public.newsletter_events (
  id             uuid primary key default gen_random_uuid(),
  subscriber_id  uuid references public.newsletter_subscribers(id) on delete set null,
  campaign_id    uuid references public.newsletter_campaigns(id) on delete set null,
  type           text not null,                         -- 'subscribed'|'enrolled'|'unsubscribed'|'bounced'|'complained'|'sync_error'
  lemlist_ref    text,
  detail         text,
  meta           jsonb not null default '{}',
  created_at     timestamptz not null default now()
);
create index if not exists nl_events_sub  on public.newsletter_events (subscriber_id);
create index if not exists nl_events_type on public.newsletter_events (type, created_at);

-- =========================================================
-- 5) RLS — nur gc_admin darf direkt; Public nur ueber Definer-RPCs
-- =========================================================
alter table public.newsletter_leadmagnets  enable row level security;
alter table public.newsletter_subscribers  enable row level security;
alter table public.newsletter_campaigns    enable row level security;
alter table public.newsletter_events       enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'newsletter_leadmagnets','newsletter_subscribers','newsletter_campaigns','newsletter_events'
  ] loop
    execute format('drop policy if exists %I on public.%I', t||'_admin_all', t);
    execute format(
      'create policy %I on public.%I for all using (public.is_gc_admin()) with check (public.is_gc_admin())',
      t||'_admin_all', t
    );
  end loop;
end $$;

-- =========================================================
-- 6) PUBLIC RPC: Lead eintragen (Single-Opt-in)
--    Von der Landingpage (anon) aufgerufen. Legt/aktualisiert den Abonnenten
--    aktiv an, protokolliert die Einwilligung und ordnet ihn – ueber den
--    Leadmagneten – der richtigen Lemlist-Kampagne zu. Das tatsaechliche
--    Einschleusen in Lemlist macht die Edge-Function newsletter-lemlist
--    (Batch, mit Service-Key) – hier wird nur sauber "eingesammelt".
-- =========================================================
create or replace function public.newsletter_subscribe(
  p_email        text,
  p_leadmagnet   text default null,
  p_name         text default null,
  p_audience     text default null,
  p_theme        text default null,
  p_branche      text default null,
  p_consent_text text default null,
  p_landingpage  text default null,
  p_meta         jsonb default '{}'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email   text := lower(btrim(coalesce(p_email,'')));
  v_lm      record;
  v_aud     text;
  v_theme   text;
  v_branche text;
  v_camp    text;
  v_consent text;
  v_row     public.newsletter_subscribers;
begin
  if v_email = '' or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Bitte eine gueltige E-Mail-Adresse angeben.';
  end if;

  -- Leadmagnet aufloesen (falls angegeben): liefert Standard-Zielgruppe,
  -- Theme/Branche, Kampagne und Einwilligungstext.
  if coalesce(btrim(p_leadmagnet),'') <> '' then
    select * into v_lm from public.newsletter_leadmagnets
      where slug = btrim(p_leadmagnet) and active limit 1;
  end if;

  v_aud     := coalesce(nullif(btrim(p_audience),''), v_lm.audience, 'b2b_neukunde');
  if v_aud not in ('b2b_neukunde','b2b_bestandskunde','bewerber') then
    v_aud := 'b2b_neukunde';
  end if;
  v_theme   := coalesce(nullif(btrim(p_theme),''),   v_lm.theme);
  v_branche := coalesce(nullif(btrim(p_branche),''), v_lm.branche);
  v_camp    := v_lm.lemlist_campaign_id;
  v_consent := coalesce(nullif(btrim(p_consent_text),''), v_lm.consent_text);

  insert into public.newsletter_subscribers as s
    (email, name, audience, theme, branche, quelle, leadmagnet, landingpage,
     status, consent_text, consent_at, consent_source, lemlist_campaign_id, meta)
  values
    (v_email, nullif(btrim(p_name),''), v_aud, v_theme, v_branche, 'landingpage',
     nullif(btrim(p_leadmagnet),''), nullif(btrim(p_landingpage),''),
     'active', v_consent, now(), 'landingpage', v_camp, coalesce(p_meta,'{}'::jsonb))
  on conflict (lower(email), audience) do update set
     name        = coalesce(excluded.name, s.name),
     theme       = coalesce(excluded.theme, s.theme),
     branche     = coalesce(excluded.branche, s.branche),
     leadmagnet  = coalesce(excluded.leadmagnet, s.leadmagnet),
     landingpage = coalesce(excluded.landingpage, s.landingpage),
     -- Re-Aktivierung bei erneutem Eintrag – ABER niemals nach Spam-Beschwerde.
     status      = case when s.status = 'complained' then s.status else 'active' end,
     unsubscribed_at = case when s.status = 'complained' then s.unsubscribed_at else null end,
     consent_text   = coalesce(excluded.consent_text, s.consent_text),
     consent_at     = now(),
     consent_source = 'landingpage',
     lemlist_campaign_id = coalesce(s.lemlist_campaign_id, excluded.lemlist_campaign_id),
     updated_at  = now()
  returning * into v_row;

  insert into public.newsletter_events (subscriber_id, type, detail, meta)
  values (v_row.id, 'subscribed', v_row.leadmagnet, jsonb_build_object('audience', v_aud));

  return jsonb_build_object(
    'ok', true,
    'status', v_row.status,
    'audience', v_row.audience,
    'unsubscribe_token', v_row.unsubscribe_token,
    'lemlist_campaign_id', v_row.lemlist_campaign_id
  );
end;
$$;
revoke all on function public.newsletter_subscribe(text,text,text,text,text,text,text,text,jsonb) from public;
grant execute on function public.newsletter_subscribe(text,text,text,text,text,text,text,text,jsonb) to anon, authenticated;

-- =========================================================
-- 7) PUBLIC RPC: Abmelden (Abmeldelink in jeder Mail)
-- =========================================================
create or replace function public.newsletter_unsubscribe(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_row public.newsletter_subscribers;
begin
  update public.newsletter_subscribers
     set status = 'unsubscribed', unsubscribed_at = now(), updated_at = now()
   where unsubscribe_token = p_token
   returning * into v_row;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  insert into public.newsletter_events (subscriber_id, type, meta)
  values (v_row.id, 'unsubscribed', jsonb_build_object('audience', v_row.audience));

  return jsonb_build_object('ok', true, 'email', v_row.email);
end;
$$;
revoke all on function public.newsletter_unsubscribe(uuid) from public;
grant execute on function public.newsletter_unsubscribe(uuid) to anon, authenticated;

-- =========================================================
-- 8) PUBLIC RPC: Leadmagnet-Infos fuer die Landingpage (Titel + Consent-Text)
--    Gibt NUR unbedenkliche Felder aktiver Leadmagneten preis.
-- =========================================================
create or replace function public.newsletter_leadmagnet_public(p_slug text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select jsonb_build_object(
        'ok', true,
        'slug', slug,
        'title', title,
        'audience', audience,
        'theme', theme,
        'branche', branche,
        'consent_text', consent_text,
        'double_optin', double_optin
      )
      from public.newsletter_leadmagnets
      where slug = p_slug and active
      limit 1),
    jsonb_build_object('ok', false)
  );
$$;
revoke all on function public.newsletter_leadmagnet_public(text) from public;
grant execute on function public.newsletter_leadmagnet_public(text) to anon, authenticated;

-- =========================================================
-- 9) GC-ADMIN RPC: Kennzahlen fuers Tracking-Dashboard
-- =========================================================
create or replace function public.admin_newsletter_stats()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select case when not public.is_gc_admin() then jsonb_build_object('ok', false, 'error', 'forbidden')
    else jsonb_build_object(
      'ok', true,
      'total',        (select count(*) from public.newsletter_subscribers),
      'active',       (select count(*) from public.newsletter_subscribers where status='active'),
      'unsubscribed', (select count(*) from public.newsletter_subscribers where status='unsubscribed'),
      'by_audience',  (select coalesce(jsonb_object_agg(audience, c), '{}'::jsonb)
                         from (select audience, count(*) c from public.newsletter_subscribers
                                where status='active' group by audience) a),
      'pending_sync', (select count(*) from public.newsletter_subscribers
                         where status='active' and lemlist_synced_at is null
                           and lemlist_campaign_id is not null)
    ) end;
$$;
revoke all on function public.admin_newsletter_stats() from public;
grant execute on function public.admin_newsletter_stats() to authenticated;

-- =========================================================
-- 10) GC-ADMIN RPC: Abonnenten filtern (fuer Listen im Cockpit)
-- =========================================================
create or replace function public.admin_newsletter_subscribers(
  p_audience text default null,
  p_theme    text default null,
  p_branche  text default null,
  p_status   text default 'active',
  p_search   text default null,
  p_limit    int  default 500
)
returns setof public.newsletter_subscribers
language sql
stable
security definer
set search_path = public
as $$
  select * from public.newsletter_subscribers s
  where public.is_gc_admin()
    and (p_audience is null or s.audience = p_audience)
    and (p_theme    is null or s.theme    = p_theme)
    and (p_branche  is null or s.branche  = p_branche)
    and (p_status   is null or s.status   = p_status)
    and (p_search   is null or s.email ilike '%'||p_search||'%' or s.name ilike '%'||p_search||'%')
  order by s.created_at desc
  limit greatest(1, least(coalesce(p_limit,500), 5000));
$$;
revoke all on function public.admin_newsletter_subscribers(text,text,text,text,text,int) from public;
grant execute on function public.admin_newsletter_subscribers(text,text,text,text,text,int) to authenticated;

-- =========================================================
-- 11) GC-ADMIN RPC: Synchronisationsstatus nachziehen
--     Wird von der Edge-Function newsletter-lemlist nach dem Einschleusen
--     aufgerufen (dort mit Service-Key; hier zusaetzlich fuer manuelle Fixes).
-- =========================================================
create or replace function public.admin_newsletter_mark_synced(
  p_ids           uuid[],
  p_lemlist_status text default 'enrolled'
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare v_n int;
begin
  if not public.is_gc_admin() then
    raise exception 'forbidden';
  end if;
  update public.newsletter_subscribers
     set lemlist_status = p_lemlist_status, lemlist_synced_at = now(), updated_at = now()
   where id = any(p_ids);
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;
revoke all on function public.admin_newsletter_mark_synced(uuid[],text) from public;
grant execute on function public.admin_newsletter_mark_synced(uuid[],text) to authenticated;

-- =========================================================
-- FERTIG. Naechste Schritte:
--   - Edge Functions deployen: newsletter-lemlist, newsletter-ki
--   - Leadmagneten anlegen (Cockpit oder direkt):
--       insert into public.newsletter_leadmagnets (slug,title,audience,theme,lemlist_campaign_id,consent_text)
--       values ('galabau-fachkraefte-guide','Fachkraefte-Guide GaLaBau','b2b_neukunde','galabau','cam_xxx',
--               'Ja, schickt mir den Guide und relevante GreenCareers-News per E-Mail. Abmeldung jederzeit.');
--   - Landingpages auf public.newsletter_subscribe(...) zeigen lassen (siehe newsletter-lp-embed.html)
-- =========================================================
