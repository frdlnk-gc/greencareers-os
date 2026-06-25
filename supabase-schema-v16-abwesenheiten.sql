-- =========================================================
-- GreenCareers OS · Schema v16 — Abwesenheiten persistent (Urlaub/Krank/Sonder)
-- Einmal komplett in den Supabase SQL Editor einfügen + "Run". Idempotent.
--
-- WARUM:
--  Abwesenheiten (Urlaub, Krankmeldung, Sonderurlaub) lagen bisher NUR im Browser
--  (localStorage gcos_absences_v3). Genehmigt der Inhaber am Laptop einen Urlaub,
--  sah der Mitarbeiter am Handy NICHTS davon – kein echtes Produkt. Diese Tabelle
--  macht Abwesenheiten zur server-seitigen Wahrheit pro Betrieb, an die echte
--  mitarbeiter-Zeile (Schema v9) gebunden.
--
--  Demo-frei: es werden KEINE Beispiel-Abwesenheiten angelegt. Frische Betriebe
--  starten leer.
--
--  Voraussetzung: Schema v9 (mitarbeiter-Tabelle + app_is_manager/app_customer_id/
--  is_gc_admin + ma_touch_updated_at).
-- =========================================================

-- ---------- 1) TABELLE ----------
create table if not exists public.abwesenheiten (
  id             uuid primary key default gen_random_uuid(),
  customer_id    uuid not null references public.customers(id)   on delete cascade,
  mitarbeiter_id uuid not null references public.mitarbeiter(id) on delete cascade,
  art            text not null check (art in ('urlaub','krank','sonder')),
  von            date not null,
  bis            date not null,                 -- inklusiv
  note           text,
  status         text not null default 'offen' check (status in ('offen','genehmigt','abgelehnt')),
  au             text,                          -- Dateiname der AU-Bescheinigung (Bild bleibt clientseitig)
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_abw_customer on public.abwesenheiten(customer_id);
create index if not exists idx_abw_ma       on public.abwesenheiten(mitarbeiter_id);

-- updated_at automatisch pflegen (gleiche Trigger-Funktion wie mitarbeiter, v9)
drop trigger if exists trg_abw_touch on public.abwesenheiten;
create trigger trg_abw_touch before update on public.abwesenheiten
  for each row execute function public.ma_touch_updated_at();

-- ---------- 2) HELFER: gehört diese mitarbeiter-Zeile dem eingeloggten Nutzer? ----------
-- SECURITY DEFINER, damit die RLS-Prüfung der Abwesenheit nicht in die mitarbeiter-RLS
-- rekursiv hineinläuft.
create or replace function public.app_owns_mitarbeiter(p_ma uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.mitarbeiter m
     where m.id = p_ma and m.profile_id = auth.uid()
  )
$$;

-- ---------- 3) RLS ----------
alter table public.abwesenheiten enable row level security;

-- SELECT: GC-Admin; Manager (Owner/Büro) des eigenen Betriebs; ein Mitarbeiter
--         sieht seine eigenen Abwesenheiten.
drop policy if exists abw_select on public.abwesenheiten;
create policy abw_select on public.abwesenheiten for select using (
  public.is_gc_admin()
  or (public.app_is_manager() and customer_id = public.app_customer_id())
  or public.app_owns_mitarbeiter(mitarbeiter_id)
);

-- INSERT: Manager des eigenen Betriebs ODER ein Mitarbeiter für SICH SELBST
--         (eigener Antrag). customer_id muss immer der eigene Betrieb sein.
drop policy if exists abw_insert on public.abwesenheiten;
create policy abw_insert on public.abwesenheiten for insert with check (
  public.is_gc_admin()
  or (public.app_is_manager() and customer_id = public.app_customer_id())
  or (public.app_owns_mitarbeiter(mitarbeiter_id) and customer_id = public.app_customer_id())
);

-- UPDATE: nur Manager des eigenen Betriebs (Genehmigen/Ablehnen/Korrigieren) oder GC-Admin.
drop policy if exists abw_update on public.abwesenheiten;
create policy abw_update on public.abwesenheiten for update using (
  public.is_gc_admin()
  or (public.app_is_manager() and customer_id = public.app_customer_id())
) with check (
  public.is_gc_admin()
  or (public.app_is_manager() and customer_id = public.app_customer_id())
);

-- DELETE: nur Manager des eigenen Betriebs oder GC-Admin.
drop policy if exists abw_delete on public.abwesenheiten;
create policy abw_delete on public.abwesenheiten for delete using (
  public.is_gc_admin()
  or (public.app_is_manager() and customer_id = public.app_customer_id())
);

-- ---------- 4) (Zucker) RPC: Abwesenheiten des eigenen Betriebs laden ----------
-- RLS erlaubt den Select ohnehin; diese Funktion liefert dem Client bequem die
-- mitarbeiter_id mit, damit er sie auf seine In-Memory-Mitarbeiter mappen kann.
create or replace function public.my_abwesenheiten()
returns setof public.abwesenheiten
language sql stable security definer set search_path = public as $$
  select a.* from public.abwesenheiten a
  where public.is_gc_admin()
     or (public.app_is_manager() and a.customer_id = public.app_customer_id())
     or public.app_owns_mitarbeiter(a.mitarbeiter_id)
  order by a.von desc;
$$;
grant execute on function public.my_abwesenheiten() to authenticated;
