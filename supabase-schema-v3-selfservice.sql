-- =========================================================
-- GreenCareers OS · Schema v3 — Self-Service-Onboarding
-- Einmal komplett in den Supabase SQL Editor einfuegen + "Run".
-- Ermoeglicht: Ein frisch registrierter Inhaber (role=owner, customer_id=NULL)
-- legt SELBST seinen Betrieb an. Sicher, weil die Funktion server-seitig laeuft
-- (SECURITY DEFINER) und nur greift, solange der Nutzer noch KEINEN Betrieb hat.
-- Ohne diese Migration scheitert das Anlegen an der RLS (customers_insert = nur gc_admin).
-- =========================================================

create or replace function public.create_my_company(
  p_name     text,
  p_branchen text[] default '{}',
  p_theme    text   default 'galabau',
  p_ort      text   default null,
  p_telefon  text   default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_existing uuid;
  v_new_id uuid;
begin
  if v_uid is null then
    raise exception 'Nicht eingeloggt.';
  end if;

  -- Schon ein Betrieb verknuepft? Dann diesen zurueckgeben (idempotent, kein Doppel-Anlegen).
  select customer_id into v_existing from public.profiles where id = v_uid;
  if v_existing is not null then
    return v_existing;
  end if;

  if coalesce(btrim(p_name),'') = '' then
    raise exception 'Betriebsname fehlt.';
  end if;

  insert into public.customers (name, branchen, theme, ort, telefon, email)
  values (
    p_name,
    coalesce(p_branchen,'{}'),
    coalesce(nullif(p_theme,''),'galabau'),
    p_ort,
    p_telefon,
    (select email from auth.users where id = v_uid)
  )
  returning id into v_new_id;

  -- Profil mit dem neuen Betrieb verknuepfen + Rolle sicher auf owner setzen.
  update public.profiles
     set customer_id = v_new_id,
         role = case when role = 'gc_admin' then role else 'owner' end
   where id = v_uid;

  return v_new_id;
end;
$$;

-- Nur eingeloggte Nutzer duerfen die Funktion aufrufen.
revoke all on function public.create_my_company(text, text[], text, text, text) from public;
grant execute on function public.create_my_company(text, text[], text, text, text) to authenticated;
