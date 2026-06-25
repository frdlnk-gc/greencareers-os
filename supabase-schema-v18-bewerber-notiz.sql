-- =========================================================
-- GreenCareers OS · Schema v18 — Betrieb-private Bewerber-Notizen
--   (Vorstellungsgespräche + interne Kommentare) je Zuordnung
-- Einmal komplett in den Supabase SQL Editor einfügen + "Run". Idempotent.
--
-- WARUM:
--  Vorstellungsgespräche ("wie lief das Gespräch, was hat der Bewerber gesagt")
--  und interne Team-Kommentare sind BETRIEBSPRIVAT. Sie dürfen NICHT in das
--  geteilte bewerber.extra, weil derselbe Bewerber per Mehrfach-Zuordnung bei
--  mehreren Betrieben liegt und sonst Betrieb B die Gesprächsnotizen von
--  Betrieb A sähe. Richtiger Ort: die Zuordnungs-Zeile (bewerber_zuordnung) –
--  je Betrieb genau eine. Für Legacy-/Website-Bewerbungen (apply_to_job, nur
--  bewerber.customer_id, keine Zuordnung) zusätzlich ein Feld auf bewerber.
--
--  Struktur des jsonb:  { "interviews": [...], "comments": [...] }
--
--  Voraussetzung: Schema v8 (bewerber_zuordnung) + v14 (my_bewerber) sind gelaufen.
-- =========================================================

-- ---------- 1) SPALTEN ----------
alter table public.bewerber_zuordnung add column if not exists notiz jsonb not null default '{}'::jsonb;
alter table public.bewerber           add column if not exists notiz jsonb not null default '{}'::jsonb;

-- ---------- 2) LESEN: my_bewerber() um notiz erweitern ----------
-- notiz kommt PRO Zuordnung; bei Legacy-Bewerbungen aus bewerber.notiz.
create or replace function public.my_bewerber()
returns table(
  id                uuid,
  name              text,
  email             text,
  telefon           text,
  quelle            text,
  status            text,
  stellenanzeige_id uuid,
  extra             jsonb,
  notiz             jsonb,
  created_at        timestamptz
)
language sql
security definer
set search_path = public
as $$
  with me as (select public.app_customer_id() as cid)
  -- (A) Über die Join-Tabelle: Status + Stelle + Notiz kommen PRO Zuordnung
  select b.id, b.name, b.email, b.telefon, b.quelle,
         z.status, z.stellenanzeige_id, b.extra,
         coalesce(z.notiz, '{}'::jsonb) as notiz, b.created_at
  from public.bewerber_zuordnung z
  join public.bewerber b on b.id = z.bewerber_id
  where z.customer_id = (select cid from me)
  union
  -- (B) Legacy / Website-Bewerbung (apply_to_job): nur bewerber.customer_id
  select b.id, b.name, b.email, b.telefon, b.quelle,
         b.status, b.stellenanzeige_id, b.extra,
         coalesce(b.notiz, '{}'::jsonb) as notiz, b.created_at
  from public.bewerber b
  where b.customer_id = (select cid from me)
    and not exists (
      select 1 from public.bewerber_zuordnung z2
      where z2.bewerber_id = b.id and z2.customer_id = (select cid from me)
    );
$$;

revoke all on function public.my_bewerber() from public;
grant execute on function public.my_bewerber() to authenticated;

-- ---------- 3) SCHREIBEN: Notiz der eigenen Zuordnung ----------
create or replace function public.set_my_bewerber_notiz(p_bewerber_id uuid, p_notiz jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_cid uuid := public.app_customer_id();
begin
  if v_cid is null then raise exception 'Kein Betrieb verknüpft.'; end if;
  -- Zuordnungs-Zeile dieses Betriebs aktualisieren (Mehrfach-/Bulk)
  update public.bewerber_zuordnung
     set notiz = coalesce(p_notiz, '{}'::jsonb)
   where bewerber_id = p_bewerber_id and customer_id = v_cid;
  -- Legacy: gehört der Bewerber DIREKT diesem Betrieb, dort ebenfalls
  update public.bewerber
     set notiz = coalesce(p_notiz, '{}'::jsonb)
   where id = p_bewerber_id and customer_id = v_cid;
end;
$$;

revoke all on function public.set_my_bewerber_notiz(uuid, jsonb) from public;
grant execute on function public.set_my_bewerber_notiz(uuid, jsonb) to authenticated;
