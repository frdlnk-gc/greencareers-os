-- =========================================================
-- GreenCareers OS · Schema v8 — Bewerber-Zuordnung (Many-to-Many)
-- Einmal komplett in den Supabase SQL Editor einfuegen + "Run". Idempotent.
--
-- WARUM / Problem:
--  Bisher haengt ein Bewerber an GENAU EINEM Kunden (bewerber.customer_id) +
--  EINER Stelle. In der Praxis kommen 98-99% der Bewerber per Import (Masse oder
--  manuell) rein und muessen an MEHRERE Betriebe verteilt werden koennen
--  (1 Bewerber -> n Kunden). Das ist mit einer Einzel-FK nicht moeglich.
--
-- LOESUNG (wie im GreenCareers-Hauptbackend):
--  Neue Join-Tabelle "bewerber_zuordnung". Jede Zeile = 1 Zuordnung eines
--  Bewerbers an 1 Kunden (optional an 1 Stelle), mit EIGENEM Status + Rating +
--  Notizen pro Zuordnung. So kann derselbe Bewerber bei Betrieb A "eingestellt"
--  und bei Betrieb B "neu" sein.
--
--  - bewerber.customer_id / .stellenanzeige_id BLEIBEN bestehen (Rueckwaerts-
--    kompatibilitaet + Erst-Quelle bei Website-Bewerbungen via apply_to_job).
--  - Bestehende Einzel-Zuordnungen werden in die Join-Tabelle BACKFILLED.
--  - RLS spiegelt die bewerber-Policies: GC-Admins sehen alles, Kunden-Owner
--    sehen nur Zuordnungen ZU IHREM Betrieb.
-- =========================================================

-- ---------- 1) JOIN-TABELLE ----------
create table if not exists public.bewerber_zuordnung (
  id                uuid primary key default gen_random_uuid(),
  bewerber_id       uuid not null references public.bewerber(id)        on delete cascade,
  customer_id       uuid not null references public.customers(id)       on delete cascade,
  stellenanzeige_id uuid          references public.stellenanzeigen(id) on delete set null,
  status            text not null default 'neu',   -- eigener Kanban-Status pro Zuordnung
  rating            int  default 0,
  notizen           text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (bewerber_id, customer_id)                -- 1 Bewerber max. 1x pro Kunde
);

create index if not exists idx_bz_bewerber on public.bewerber_zuordnung(bewerber_id);
create index if not exists idx_bz_customer on public.bewerber_zuordnung(customer_id);
create index if not exists idx_bz_stelle   on public.bewerber_zuordnung(stellenanzeige_id);

-- updated_at automatisch pflegen
create or replace function public.bz_touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists trg_bz_touch on public.bewerber_zuordnung;
create trigger trg_bz_touch before update on public.bewerber_zuordnung
  for each row execute function public.bz_touch_updated_at();

-- ---------- 2) RLS (spiegelt bewerber-Policies) ----------
alter table public.bewerber_zuordnung enable row level security;

drop policy if exists bz_select on public.bewerber_zuordnung;
create policy bz_select on public.bewerber_zuordnung for select
  using (public.is_gc_admin() or customer_id = public.app_customer_id());

drop policy if exists bz_insert on public.bewerber_zuordnung;
create policy bz_insert on public.bewerber_zuordnung for insert
  with check (public.is_gc_admin() or customer_id = public.app_customer_id());

drop policy if exists bz_update on public.bewerber_zuordnung;
create policy bz_update on public.bewerber_zuordnung for update
  using (public.is_gc_admin() or customer_id = public.app_customer_id())
  with check (public.is_gc_admin() or customer_id = public.app_customer_id());

drop policy if exists bz_delete on public.bewerber_zuordnung;
create policy bz_delete on public.bewerber_zuordnung for delete
  using (public.is_gc_admin() or customer_id = public.app_customer_id());

-- ---------- 3) BACKFILL bestehender Einzel-Zuordnungen ----------
-- Nur Felder verwenden, die garantiert in bewerber existieren (customer_id,
-- stellenanzeige_id, status, notizen). Doppelte werden ignoriert.
insert into public.bewerber_zuordnung (bewerber_id, customer_id, stellenanzeige_id, status, notizen)
select b.id, b.customer_id, b.stellenanzeige_id, coalesce(b.status,'neu'), b.notizen
from public.bewerber b
where b.customer_id is not null
on conflict (bewerber_id, customer_id) do nothing;
