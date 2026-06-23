-- =========================================================
-- GreenCareers OS · Schema v12 — Unternehmensprofil-Sync (OS -> customers)
-- Einmal komplett in den Supabase SQL Editor einfügen + "Run". Idempotent.
--
-- WARUM / Problem:
--  Das OS erfasst in den Einstellungen jetzt ein vollständiges UNTERNEHMENSPROFIL
--  (Logo, Titelbild, Über-uns-Text, Unternehmensbilder, Website, Karriere-URL,
--  Mitarbeiteranzahl, Gründungsjahr, Social-Links). Diese Felder leben in der
--  Stammtabelle `customers` und werden von der public_jobs-View ans Portal
--  durchgereicht (firma_logo, firma_titelbild, firma_ueber_uns, firma_bilder, …).
--
--  ABER: Die RLS auf `customers` erlaubt UPDATE nur gc_admin. Ein selbst
--  registrierter Inhaber (role=owner) konnte seine eigene Firmenzeile NICHT
--  aktualisieren -> seine Portal-Firmenseite blieb leer (kein Logo/Titelbild).
--
--  LÖSUNG (analog zu create_my_company, Schema v3): eine SECURITY-DEFINER-RPC,
--  die NUR die eigene, am eingeloggten Profil hängende customer-Zeile ändert und
--  NUR eine feste Whitelist branding-relevanter Spalten schreibt. Kein direkter
--  Tabellen-Zugriff, keine RLS-Lockerung. Andere Spalten (produkt, kontingent,
--  betrag, …) bleiben unangetastet.
-- =========================================================

create or replace function public.update_my_company_profile(
  p_logo_url           text default null,
  p_titelbild          text default null,
  p_ueber_uns          text default null,
  p_unternehmensbilder jsonb default null,
  p_website            text default null,
  p_karriere_url       text default null,
  p_mitarbeiter_anzahl text default null,
  p_gruendungsjahr     text default null,
  p_social             jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_cid uuid;
begin
  if v_uid is null then
    raise exception 'Nicht eingeloggt.';
  end if;

  -- An welchem Betrieb hängt der eingeloggte Nutzer? Nur DEN darf er ändern.
  select customer_id into v_cid from public.profiles where id = v_uid;
  if v_cid is null then
    raise exception 'Kein Betrieb verknüpft.';
  end if;

  -- COALESCE pro Spalte: NULL-Parameter lassen den bestehenden Wert unangetastet
  -- (Teil-Updates möglich). Leerer String '' wird bewusst übernommen (= gelöscht),
  -- nur echtes NULL = "nicht anfassen".
  update public.customers c
     set logo_url           = coalesce(p_logo_url,           c.logo_url),
         titelbild          = coalesce(p_titelbild,          c.titelbild),
         ueber_uns          = coalesce(p_ueber_uns,          c.ueber_uns),
         unternehmensbilder = coalesce(p_unternehmensbilder, c.unternehmensbilder),
         website            = coalesce(p_website,            c.website),
         karriere_url       = coalesce(p_karriere_url,       c.karriere_url),
         mitarbeiter_anzahl = coalesce(p_mitarbeiter_anzahl, c.mitarbeiter_anzahl),
         gruendungsjahr     = coalesce(p_gruendungsjahr,     c.gruendungsjahr),
         social             = coalesce(p_social,             c.social)
   where c.id = v_cid;

  return v_cid;
end;
$$;

-- Nur eingeloggte Nutzer dürfen die Funktion aufrufen.
revoke all on function public.update_my_company_profile(text, text, text, jsonb, text, text, text, text, jsonb) from public;
grant execute on function public.update_my_company_profile(text, text, text, jsonb, text, text, text, text, jsonb) to authenticated;
