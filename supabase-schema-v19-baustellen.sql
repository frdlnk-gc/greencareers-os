-- =========================================================
-- GreenCareers OS · Schema v19 — Baustellen (Projekte) als echte Entität
--   + Leistungsverzeichnis (Aufgaben/Material) je Baustelle
-- Einmal komplett in den Supabase SQL Editor einfügen + "Run". Idempotent.
--
-- WARUM:
--  Bisher war die „Baustelle" nur denormalisiert auf den Zeit-Einträgen (v17:
--  site_id/site_customer/site_label) – es gab nur den festen Anker s0 (Bauhof),
--  keine echte, anlegbare, persistierte Baustelle. Für die operativen Add-ons
--  (Deckungsbeitrag pro Baustelle, Leistungsverzeichnis, Leistungsnachweis)
--  braucht es die Baustelle als eigene Zeile, an der Umsatz, Kosten, Aufgaben
--  und Material hängen.
--
--  Modell:
--   * Eine Baustelle gehört EINEM Betrieb (customer_id) und optional EINEM
--     Endkunden (kunde_id). Ohne Kunde = freies Bauvorhaben.
--   * Das Leistungsverzeichnis (was ist zu tun + welches Material) liegt als
--     jsonb `lv = { "tasks": [...], "material": [...] }`. Bewusst denormalisiert
--     (kurze Stichpunkt-Listen, die der Mitarbeiter beim Einstempeln sieht).
--   * Die Zeit-Einträge (v17.zeit_eintraege.site_id) referenzieren weiterhin
--     per TEXT – jetzt mit der Baustellen-UUID statt nur 's0'. Kein FK-Zwang,
--     damit Bauhof (s0, ohne DB-Zeile) und gelöschte Baustellen nicht brechen.
--
--  Demo-frei: KEINE Beispieldaten. Frische Betriebe starten ohne Baustelle.
--
--  Voraussetzung: Schema v17 (kunden/kolonnen/plantafel/zeit_eintraege) +
--  v9-Helfer (app_is_manager/app_customer_id/is_gc_admin/ma_touch_updated_at).
-- =========================================================

-- ---------- 1) TABELLE ----------
create table if not exists public.baustellen (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  kunde_id    uuid references public.kunden(id) on delete set null,
  label       text not null,
  addr        text,
  lat         double precision,
  lng         double precision,
  status      text not null default 'aktiv',     -- 'aktiv' | 'fertig'
  lv          jsonb not null default '{}',         -- { tasks:[...], material:[...] }
  extra       jsonb not null default '{}',         -- customer (Anzeigename), etc.
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_baustellen_customer on public.baustellen(customer_id);
create index if not exists idx_baustellen_kunde    on public.baustellen(kunde_id);

drop trigger if exists trg_baustellen_touch on public.baustellen;
create trigger trg_baustellen_touch before update on public.baustellen
  for each row execute function public.ma_touch_updated_at();

-- ---------- 2) RLS ----------
alter table public.baustellen enable row level security;

-- SELECT: jeder im Betrieb (Mitarbeiter sehen ihre Baustellen + Aufgaben/Material).
drop policy if exists baustellen_select on public.baustellen;
create policy baustellen_select on public.baustellen for select using (
  public.is_gc_admin() or customer_id = public.app_customer_id()
);
-- INSERT/UPDATE/DELETE: nur Manager (Owner/Büro) des eigenen Betriebs.
drop policy if exists baustellen_insert on public.baustellen;
create policy baustellen_insert on public.baustellen for insert with check (
  public.is_gc_admin() or (public.app_is_manager() and customer_id = public.app_customer_id())
);
drop policy if exists baustellen_update on public.baustellen;
create policy baustellen_update on public.baustellen for update using (
  public.is_gc_admin() or (public.app_is_manager() and customer_id = public.app_customer_id())
) with check (
  public.is_gc_admin() or (public.app_is_manager() and customer_id = public.app_customer_id())
);
drop policy if exists baustellen_delete on public.baustellen;
create policy baustellen_delete on public.baustellen for delete using (
  public.is_gc_admin() or (public.app_is_manager() and customer_id = public.app_customer_id())
);

-- ---------- 3) LESE-RPC (RLS-konform, liefert kunde_id fürs Client-Mapping) ----------
create or replace function public.my_baustellen()
returns setof public.baustellen
language sql stable security definer set search_path = public as $$
  select b.* from public.baustellen b
  where public.is_gc_admin() or b.customer_id = public.app_customer_id()
  order by b.created_at;
$$;
grant execute on function public.my_baustellen() to authenticated;
