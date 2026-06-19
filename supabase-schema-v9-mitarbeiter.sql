-- =========================================================
-- GreenCareers OS · Schema v9 — Mitarbeiter-Einladung & Self-Onboarding
-- Einmal komplett in den Supabase SQL Editor einfuegen + "Run". Idempotent.
--
-- WARUM / Problem:
--  Bisher kennt das OS nur Inhaber ('owner') + GC-Team ('gc_admin'). Mitarbeiter
--  eines Betriebs existieren nur im Browser-Speicher (employees=[]) und koennen
--  sich NICHT einloggen. Wir wollen: Der Arbeitgeber legt einen Mitarbeiter an und
--  laedt ihn per E-Mail ein -> Mitarbeiter setzt Passwort -> fuellt sein Profil
--  schlank selbst aus (Lock-in-Hebel). Dafuer braucht es:
--   1) Rolle 'mitarbeiter' (+ 'buero') in profiles erlaubt.
--   2) Eine persistente mitarbeiter-Tabelle (Personalakte-Kern), pro Betrieb.
--   3) handle_new_user muss bei Einladungen customer_id + role aus den
--      Einladungs-Metadaten uebernehmen (sonst landet der AN ohne Betrieb).
--   4) Eine sichere RPC, mit der der eingeladene AN NUR seine eigenen, freigegebenen
--      Felder ausfuellt (kein Self-Service auf customer_id/status/role).
--
--  Die eigentliche Einladungs-MAIL verschickt die Edge Function 'invite-mitarbeiter'
--  (Service-Role, admin.inviteUserByEmail) — siehe supabase/functions/invite-mitarbeiter.
-- =========================================================

-- ---------- 1) ROLLEN ERWEITERN ----------
-- profiles.role erlaubte bisher nur ('owner','gc_admin'). Wir ergaenzen die
-- Betriebs-internen Rollen. Bestehender CHECK wird sauber ersetzt.
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('owner','gc_admin','mitarbeiter','buero'));

-- ---------- 2) ROLLEN-HELFER (gegen RLS-Rekursion, SECURITY DEFINER) ----------
create or replace function public.app_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

-- Owner/Buero/GC-Admin = "darf das ganze Team des Betriebs verwalten"
create or replace function public.app_is_manager()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(
    (select role in ('owner','buero','gc_admin') from public.profiles where id = auth.uid()),
    false)
$$;

-- ---------- 3) MITARBEITER-TABELLE (Personalakte-Kern) ----------
create table if not exists public.mitarbeiter (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  -- Verknuepfung zum Login-User; NULL = reiner Personaldatensatz ohne Zugang.
  profile_id  uuid references public.profiles(id) on delete set null,
  name        text not null,
  email       text,
  position    text,                 -- "Funktion" (Polier, Landschaftsgaertner, ...)
  crew        text,                 -- Kolonne (frei, optional)
  phone       text,
  address     text,
  -- invited = eingeladen, wartet auf Erst-Login | active = drin | none = nur Datensatz
  status      text not null default 'none' check (status in ('none','invited','active')),
  sys_role    text not null default 'mitarbeiter' check (sys_role in ('mitarbeiter','buero')),
  -- Platz fuer weitere Self-Onboarding-/HR-Felder ohne Schema-Aenderung
  extra       jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (customer_id, profile_id)  -- 1 Login pro Betrieb max. 1 Mitarbeiter-Satz
);

create index if not exists idx_ma_customer on public.mitarbeiter(customer_id);
create index if not exists idx_ma_profile  on public.mitarbeiter(profile_id);
create index if not exists idx_ma_email    on public.mitarbeiter(lower(email));

-- updated_at automatisch pflegen
create or replace function public.ma_touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists trg_ma_touch on public.mitarbeiter;
create trigger trg_ma_touch before update on public.mitarbeiter
  for each row execute function public.ma_touch_updated_at();

-- ---------- 4) RLS ----------
alter table public.mitarbeiter enable row level security;

-- SELECT: Manager (Owner/Buero) sehen das ganze Team des eigenen Betriebs;
--         ein Mitarbeiter sieht nur seinen eigenen Datensatz.
drop policy if exists ma_select on public.mitarbeiter;
create policy ma_select on public.mitarbeiter for select
  using (
    public.is_gc_admin()
    or (public.app_is_manager() and customer_id = public.app_customer_id())
    or profile_id = auth.uid()
  );

-- INSERT: nur Manager des eigenen Betriebs (oder GC-Admin).
drop policy if exists ma_insert on public.mitarbeiter;
create policy ma_insert on public.mitarbeiter for insert
  with check (
    public.is_gc_admin()
    or (public.app_is_manager() and customer_id = public.app_customer_id())
  );

-- UPDATE: nur Manager des eigenen Betriebs (oder GC-Admin).
--         Der AN aendert seine Felder NICHT direkt, sondern ueber complete_my_profile
--         (kontrolliert, kann customer_id/status/role nicht manipulieren).
drop policy if exists ma_update on public.mitarbeiter;
create policy ma_update on public.mitarbeiter for update
  using (
    public.is_gc_admin()
    or (public.app_is_manager() and customer_id = public.app_customer_id())
  )
  with check (
    public.is_gc_admin()
    or (public.app_is_manager() and customer_id = public.app_customer_id())
  );

-- DELETE: nur Manager des eigenen Betriebs (oder GC-Admin).
drop policy if exists ma_delete on public.mitarbeiter;
create policy ma_delete on public.mitarbeiter for delete
  using (
    public.is_gc_admin()
    or (public.app_is_manager() and customer_id = public.app_customer_id())
  );

-- ---------- 5) AUTO-PROFIL BEI SIGNUP: Einladungs-Metadaten uebernehmen ----------
-- Bei einer Einladung (admin.inviteUserByEmail) setzen wir customer_id + role + name
-- in die user_metadata. handle_new_user muss diese ins profile uebertragen, sonst
-- haette der eingeladene Mitarbeiter keinen Betrieb und die falsche Rolle.
-- Normaler Inhaber-Signup (ohne Metadaten) bleibt unveraendert: role='owner'.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_role text := coalesce(nullif(new.raw_user_meta_data->>'role',''), 'owner');
  v_cust uuid := nullif(new.raw_user_meta_data->>'customer_id','')::uuid;
begin
  -- Sicherheits-Netz: nur erlaubte Rollen zulassen, sonst 'owner'.
  if v_role not in ('owner','gc_admin','mitarbeiter','buero') then
    v_role := 'owner';
  end if;
  insert into public.profiles (id, email, name, role, customer_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', new.email),
    v_role,
    v_cust
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- 6) RPC: Eingeladener Mitarbeiter fuellt sein Profil schlank selbst aus ----------
-- Laeuft server-seitig (SECURITY DEFINER) und betrifft IMMER nur die Zeile des
-- eingeloggten Nutzers (profile_id = auth.uid()). Der AN kann damit NUR die
-- freigegebenen Felder setzen — nie customer_id, status (ausser -> 'active'),
-- sys_role oder eine fremde Zeile.
create or replace function public.complete_my_profile(
  p_name     text,
  p_position text default null,
  p_phone    text default null,
  p_address  text default null,
  p_extra    jsonb default '{}'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_id  uuid;
  v_cust uuid;
  v_clean_name text := nullif(btrim(p_name), '');
begin
  if v_uid is null then
    raise exception 'Nicht eingeloggt.';
  end if;

  -- Bereits ein verknuepfter Mitarbeiter-Datensatz (Normalfall nach Einladung)?
  update public.mitarbeiter
     set name     = coalesce(v_clean_name, name),
         position = coalesce(nullif(btrim(p_position),''), position),
         phone    = coalesce(nullif(btrim(p_phone),''),    phone),
         address  = coalesce(nullif(btrim(p_address),''),  address),
         extra    = coalesce(extra,'{}'::jsonb) || coalesce(p_extra,'{}'::jsonb),
         status   = 'active'
   where profile_id = v_uid
   returning id into v_id;

  -- Kein Datensatz vorhanden (z. B. Direkt-Signup ohne vorab angelegten AN):
  -- aus dem Profil den Betrieb ziehen und neu anlegen.
  if v_id is null then
    select customer_id into v_cust from public.profiles where id = v_uid;
    if v_cust is null then
      raise exception 'Kein Betrieb verknuepft.';
    end if;
    insert into public.mitarbeiter (customer_id, profile_id, name, email, position, phone, address, extra, status, sys_role)
    select v_cust, v_uid,
           coalesce(v_clean_name, p.name, u.email),
           u.email,
           nullif(btrim(p_position),''),
           nullif(btrim(p_phone),''),
           nullif(btrim(p_address),''),
           coalesce(p_extra,'{}'::jsonb),
           'active', 'mitarbeiter'
    from public.profiles p
    join auth.users u on u.id = p.id
    where p.id = v_uid
    returning id into v_id;
  end if;

  -- Namen auch im Login-Profil mitziehen (Konsistenz in der Sidebar etc.)
  if v_clean_name is not null then
    update public.profiles set name = v_clean_name where id = v_uid;
  end if;

  return v_id;
end;
$$;

revoke all on function public.complete_my_profile(text, text, text, text, jsonb) from public;
grant execute on function public.complete_my_profile(text, text, text, text, jsonb) to authenticated;

-- ---------- 7) (optional) RPC: Team des eigenen Betriebs laden ----------
-- Bequemer, RLS-konformer Read fuer den Arbeitgeber. (RLS erlaubt den Select
-- ohnehin; diese Funktion ist nur Zucker fuer den Client.)
create or replace function public.my_team()
returns setof public.mitarbeiter
language sql stable security definer set search_path = public as $$
  select m.* from public.mitarbeiter m
  where public.is_gc_admin()
     or (public.app_is_manager() and m.customer_id = public.app_customer_id())
  order by m.created_at;
$$;
grant execute on function public.my_team() to authenticated;
