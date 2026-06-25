-- =========================================================
-- GreenCareers OS · Schema v14 — OS liest Bewerber join-bewusst (Mehrfach-/Bulk-Zuordnung)
-- Einmal komplett in den Supabase SQL Editor einfügen + "Run". Idempotent.
--
-- WARUM:
--  Das OS las Bewerber bisher nur aus der Tabelle `bewerber` (1:1 customer_id).
--  Im Admin-Backend einem Betrieb per Mehrfach-/Bulk-Zuordnung zugewiesene
--  Bewerber stehen aber in der Join-Tabelle `bewerber_zuordnung` und tauchten
--  daher im OS NICHT auf. Diese RPCs schließen die Lücke:
--   * my_bewerber()             -> alle dem eingeloggten Betrieb zugeordneten
--                                  Bewerber (Join + Legacy), Status + Stelle PRO
--                                  Zuordnung.
--   * set_my_bewerber_status()  -> Status der EIGENEN Zuordnung setzen.
--   * set_my_bewerber_job()     -> Stelle der EIGENEN Zuordnung setzen.
--
--  Voraussetzung: Schema v8 (Tabelle bewerber_zuordnung) ist gelaufen.
-- =========================================================

-- ---------- 1) LESEN: alle Bewerber des eingeloggten Betriebs ----------
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
  created_at        timestamptz
)
language sql
security definer
set search_path = public
as $$
  with me as (select public.app_customer_id() as cid)
  -- (A) Über die Join-Tabelle: Status + Stelle kommen PRO Zuordnung
  select b.id, b.name, b.email, b.telefon, b.quelle,
         z.status, z.stellenanzeige_id, b.extra, b.created_at
  from public.bewerber_zuordnung z
  join public.bewerber b on b.id = z.bewerber_id
  where z.customer_id = (select cid from me)
  union
  -- (B) Legacy / Website-Bewerbung (apply_to_job): nur bewerber.customer_id, keine Zuordnung
  select b.id, b.name, b.email, b.telefon, b.quelle,
         b.status, b.stellenanzeige_id, b.extra, b.created_at
  from public.bewerber b
  where b.customer_id = (select cid from me)
    and not exists (
      select 1 from public.bewerber_zuordnung z2
      where z2.bewerber_id = b.id and z2.customer_id = (select cid from me)
    );
$$;

revoke all on function public.my_bewerber() from public;
grant execute on function public.my_bewerber() to authenticated;

-- ---------- 2) SCHREIBEN: Status der eigenen Zuordnung ----------
create or replace function public.set_my_bewerber_status(p_bewerber_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_cid uuid := public.app_customer_id();
begin
  if v_cid is null then raise exception 'Kein Betrieb verknüpft.'; end if;
  -- Zuordnungs-Zeile dieses Betriebs (Mehrfach-/Bulk) aktualisieren
  update public.bewerber_zuordnung
     set status = coalesce(p_status, status)
   where bewerber_id = p_bewerber_id and customer_id = v_cid;
  -- Legacy: gehört der Bewerber DIREKT diesem Betrieb, dort ebenfalls
  update public.bewerber
     set status = coalesce(p_status, status)
   where id = p_bewerber_id and customer_id = v_cid;
end;
$$;

revoke all on function public.set_my_bewerber_status(uuid, text) from public;
grant execute on function public.set_my_bewerber_status(uuid, text) to authenticated;

-- ---------- 3) SCHREIBEN: Stelle der eigenen Zuordnung ----------
create or replace function public.set_my_bewerber_job(p_bewerber_id uuid, p_job_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_cid uuid := public.app_customer_id();
begin
  if v_cid is null then raise exception 'Kein Betrieb verknüpft.'; end if;
  update public.bewerber_zuordnung
     set stellenanzeige_id = p_job_id
   where bewerber_id = p_bewerber_id and customer_id = v_cid;
  update public.bewerber
     set stellenanzeige_id = p_job_id
   where id = p_bewerber_id and customer_id = v_cid;
end;
$$;

revoke all on function public.set_my_bewerber_job(uuid, uuid) from public;
grant execute on function public.set_my_bewerber_job(uuid, uuid) to authenticated;
