-- =========================================================
-- GreenCareers OS · Schema v17 — Operativer Betrieb persistent
--   Kolonnen · Kunden · Plantafel · Zeiterfassung
-- Einmal komplett in den Supabase SQL Editor einfügen + "Run". Idempotent.
--
-- WARUM:
--  Die vier operativen Kern-Datensätze lagen bisher NUR im Browser (RAM, kein
--  localStorage): Kolonnen, Kundenstamm, Plantafel-Belegung und die Stempeluhr.
--  Für ein echtes Produkt müssen sie pro Betrieb server-seitig liegen, damit sie
--  über Geräte/Logins hinweg gleich sind und nicht beim Neuladen verschwinden.
--
--  Demo-frei: es werden KEINE Beispieldaten angelegt. Frische Betriebe starten leer
--  (der „Bauhof" bleibt clientseitig als fester Standort-Anker, ohne DB-Zeile).
--
--  Modell-Entscheidungen (bewusst):
--   * Plantafel speichert ABSOLUTE Daten (Spalte `datum`), nicht die relativen
--     Tages-Slots (neu/di/mi…), die sich täglich verschieben würden.
--   * Zeiterfassung denormalisiert die Baustellen-Info (site_id/-customer/-label)
--     direkt auf den Eintrag — es gibt (noch) keine eigene Baustellen-Tabelle/UI;
--     der „Bauhof" ist der konstante Anker s0.
--
--  Voraussetzung: Schema v9 (mitarbeiter + app_is_manager/app_customer_id/
--  is_gc_admin/ma_touch_updated_at) und v16 (app_owns_mitarbeiter).
-- =========================================================

-- ---------- 0) (Sicherheitsnetz) Helfer aus v16, falls v16 noch nicht lief ----------
create or replace function public.app_owns_mitarbeiter(p_ma uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.mitarbeiter m where m.id = p_ma and m.profile_id = auth.uid())
$$;

-- =========================================================
-- 1) KOLONNEN (Trupps)
-- =========================================================
create table if not exists public.kolonnen (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  label       text not null,
  color       text,
  sort        int  not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_kol_customer on public.kolonnen(customer_id);

drop trigger if exists trg_kol_touch on public.kolonnen;
create trigger trg_kol_touch before update on public.kolonnen
  for each row execute function public.ma_touch_updated_at();

alter table public.kolonnen enable row level security;

-- SELECT: jeder im Betrieb (Mitarbeiter sehen ihre Kolonnen-Namen).
drop policy if exists kol_select on public.kolonnen;
create policy kol_select on public.kolonnen for select using (
  public.is_gc_admin() or customer_id = public.app_customer_id()
);
-- INSERT/UPDATE/DELETE: nur Manager (Owner/Büro) des eigenen Betriebs.
drop policy if exists kol_insert on public.kolonnen;
create policy kol_insert on public.kolonnen for insert with check (
  public.is_gc_admin() or (public.app_is_manager() and customer_id = public.app_customer_id())
);
drop policy if exists kol_update on public.kolonnen;
create policy kol_update on public.kolonnen for update using (
  public.is_gc_admin() or (public.app_is_manager() and customer_id = public.app_customer_id())
) with check (
  public.is_gc_admin() or (public.app_is_manager() and customer_id = public.app_customer_id())
);
drop policy if exists kol_delete on public.kolonnen;
create policy kol_delete on public.kolonnen for delete using (
  public.is_gc_admin() or (public.app_is_manager() and customer_id = public.app_customer_id())
);

-- =========================================================
-- 2) KUNDEN (Kundenstamm des Betriebs)
--   ACHTUNG Namensraum: public.customers = die BETRIEBE (GC-Kunden).
--   Diese Tabelle public.kunden = die Endkunden EINES Betriebs.
-- =========================================================
create table if not exists public.kunden (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  name        text not null,
  contact     text,
  ctype       text,                 -- 'firma' | 'privat'
  city        text,
  addr        text,
  phone       text,
  email       text,
  ust_id      text,
  tax_no      text,
  note        text,
  extra       jsonb not null default '{}',   -- history[], status[], type, since, value
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_kunden_customer on public.kunden(customer_id);

drop trigger if exists trg_kunden_touch on public.kunden;
create trigger trg_kunden_touch before update on public.kunden
  for each row execute function public.ma_touch_updated_at();

alter table public.kunden enable row level security;

drop policy if exists kunden_select on public.kunden;
create policy kunden_select on public.kunden for select using (
  public.is_gc_admin() or customer_id = public.app_customer_id()
);
drop policy if exists kunden_insert on public.kunden;
create policy kunden_insert on public.kunden for insert with check (
  public.is_gc_admin() or (public.app_is_manager() and customer_id = public.app_customer_id())
);
drop policy if exists kunden_update on public.kunden;
create policy kunden_update on public.kunden for update using (
  public.is_gc_admin() or (public.app_is_manager() and customer_id = public.app_customer_id())
) with check (
  public.is_gc_admin() or (public.app_is_manager() and customer_id = public.app_customer_id())
);
drop policy if exists kunden_delete on public.kunden;
create policy kunden_delete on public.kunden for delete using (
  public.is_gc_admin() or (public.app_is_manager() and customer_id = public.app_customer_id())
);

-- =========================================================
-- 3) PLANTAFEL (Aufträge je Kolonne & Tag)
-- =========================================================
create table if not exists public.plantafel (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  crew_id     uuid not null references public.kolonnen(id)  on delete cascade,
  kunde_id    uuid references public.kunden(id) on delete set null,
  datum       date not null,         -- ABSOLUTES Datum (nicht der relative Slot)
  titel       text not null,
  info        text,
  farbe       text,
  sort        int  not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_plan_customer on public.plantafel(customer_id);
create index if not exists idx_plan_crew_datum on public.plantafel(crew_id, datum);

drop trigger if exists trg_plan_touch on public.plantafel;
create trigger trg_plan_touch before update on public.plantafel
  for each row execute function public.ma_touch_updated_at();

alter table public.plantafel enable row level security;

drop policy if exists plan_select on public.plantafel;
create policy plan_select on public.plantafel for select using (
  public.is_gc_admin() or customer_id = public.app_customer_id()
);
drop policy if exists plan_insert on public.plantafel;
create policy plan_insert on public.plantafel for insert with check (
  public.is_gc_admin() or (public.app_is_manager() and customer_id = public.app_customer_id())
);
drop policy if exists plan_update on public.plantafel;
create policy plan_update on public.plantafel for update using (
  public.is_gc_admin() or (public.app_is_manager() and customer_id = public.app_customer_id())
) with check (
  public.is_gc_admin() or (public.app_is_manager() and customer_id = public.app_customer_id())
);
drop policy if exists plan_delete on public.plantafel;
create policy plan_delete on public.plantafel for delete using (
  public.is_gc_admin() or (public.app_is_manager() and customer_id = public.app_customer_id())
);

-- =========================================================
-- 4) ZEITERFASSUNG (Stempel-Einträge)
-- =========================================================
create table if not exists public.zeit_eintraege (
  id             uuid primary key default gen_random_uuid(),
  customer_id    uuid not null references public.customers(id)   on delete cascade,
  mitarbeiter_id uuid not null references public.mitarbeiter(id) on delete cascade,
  datum          date not null default current_date,
  site_id        text,                 -- 's0' (Bauhof) o. spätere Baustellen-Referenz
  site_customer  text,                 -- denormalisiert (Anzeige), da keine Baustellen-Tabelle
  site_label     text,
  start_zeit     text,                 -- 'HH:MM'
  end_zeit       text,                 -- 'HH:MM' | null = läuft
  ruest          boolean not null default false,
  pause_min      int     not null default 0,
  geo            jsonb,                -- {lat,lng,acc,at}
  geo_out        jsonb,
  manual         boolean not null default false,
  by_lead        boolean not null default false,
  proto          boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists idx_zeit_customer on public.zeit_eintraege(customer_id);
create index if not exists idx_zeit_ma_datum on public.zeit_eintraege(mitarbeiter_id, datum);

drop trigger if exists trg_zeit_touch on public.zeit_eintraege;
create trigger trg_zeit_touch before update on public.zeit_eintraege
  for each row execute function public.ma_touch_updated_at();

alter table public.zeit_eintraege enable row level security;

-- SELECT: Manager des Betriebs ODER der eigene Mitarbeiter (seine Stempel).
drop policy if exists zeit_select on public.zeit_eintraege;
create policy zeit_select on public.zeit_eintraege for select using (
  public.is_gc_admin()
  or (public.app_is_manager() and customer_id = public.app_customer_id())
  or public.app_owns_mitarbeiter(mitarbeiter_id)
);
-- INSERT: Manager ODER Mitarbeiter für sich selbst (Selbst-Stempeln/Kolonnenführer).
drop policy if exists zeit_insert on public.zeit_eintraege;
create policy zeit_insert on public.zeit_eintraege for insert with check (
  public.is_gc_admin()
  or (public.app_is_manager() and customer_id = public.app_customer_id())
  or (public.app_owns_mitarbeiter(mitarbeiter_id) and customer_id = public.app_customer_id())
);
-- UPDATE: Manager ODER der eigene Mitarbeiter (Ausstempeln/Pause).
drop policy if exists zeit_update on public.zeit_eintraege;
create policy zeit_update on public.zeit_eintraege for update using (
  public.is_gc_admin()
  or (public.app_is_manager() and customer_id = public.app_customer_id())
  or public.app_owns_mitarbeiter(mitarbeiter_id)
) with check (
  public.is_gc_admin()
  or (public.app_is_manager() and customer_id = public.app_customer_id())
  or public.app_owns_mitarbeiter(mitarbeiter_id)
);
-- DELETE: nur Manager des Betriebs.
drop policy if exists zeit_delete on public.zeit_eintraege;
create policy zeit_delete on public.zeit_eintraege for delete using (
  public.is_gc_admin() or (public.app_is_manager() and customer_id = public.app_customer_id())
);

-- ---------- 5) Bequeme Lese-RPCs (RLS-konform, liefern FKs fürs Client-Mapping) ----------
create or replace function public.my_kolonnen()
returns setof public.kolonnen
language sql stable security definer set search_path = public as $$
  select k.* from public.kolonnen k
  where public.is_gc_admin() or k.customer_id = public.app_customer_id()
  order by k.sort, k.created_at;
$$;
grant execute on function public.my_kolonnen() to authenticated;

create or replace function public.my_kunden()
returns setof public.kunden
language sql stable security definer set search_path = public as $$
  select k.* from public.kunden k
  where public.is_gc_admin() or k.customer_id = public.app_customer_id()
  order by k.created_at;
$$;
grant execute on function public.my_kunden() to authenticated;

create or replace function public.my_plantafel()
returns setof public.plantafel
language sql stable security definer set search_path = public as $$
  select p.* from public.plantafel p
  where public.is_gc_admin() or p.customer_id = public.app_customer_id()
  order by p.datum, p.sort;
$$;
grant execute on function public.my_plantafel() to authenticated;

create or replace function public.my_zeit_eintraege(p_von date default current_date, p_bis date default current_date)
returns setof public.zeit_eintraege
language sql stable security definer set search_path = public as $$
  select z.* from public.zeit_eintraege z
  where (public.is_gc_admin()
         or (public.app_is_manager() and z.customer_id = public.app_customer_id())
         or public.app_owns_mitarbeiter(z.mitarbeiter_id))
    and z.datum between p_von and p_bis
  order by z.start_zeit;
$$;
grant execute on function public.my_zeit_eintraege(date, date) to authenticated;
