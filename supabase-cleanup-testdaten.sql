-- =========================================================
-- GreenCareers OS · Test-Daten-Bereinigung (vor echtem Kunden-Durchlauf)
--
-- ZWECK: Alle beim Bauen/Testen angelegten OS-Accounts (Inhaber-Registrierungen)
--   + deren Betriebe, Mitarbeiter, Test-Stellen sauber entfernen — OHNE die
--   echten Portal-Firmen und OHNE dein GC-Admin-Konto anzufassen.
--
-- WARUM SO VORSICHTIG:
--   Die 8 echten Tiefbau-Portal-Firmen liegen in DERSELBEN `customers`-Tabelle.
--   `stellenanzeigen.customer_id` hat ON DELETE CASCADE -> ein pauschales
--   "delete from customers" würde die LIVE-Portal-Stellen mitlöschen.
--   Unterscheidung: Test-Accounts haben ein verknüpftes `profiles`-Row mit
--   role='owner' (jemand hat sich registriert). Portal-Firmen haben KEIN
--   verknüpftes Login. Dein Admin hat role='gc_admin'.
--
-- ABLAUF: Erst BLOCK 1 (Diagnose) ausführen und prüfen. Wenn die Liste der zu
--   löschenden Accounts stimmt, BLOCK 2 (Löschen) ausführen.
-- =========================================================

-- ---------- BLOCK 1: DIAGNOSE (nur lesen, nichts wird verändert) ----------
-- a) Alle Betriebe + ob ein Login dranhängt + wie viele Stellen sie haben.
--    Portal-Firmen = viele Stellen, KEINE owner_email. Test-Accounts = owner_email gesetzt.
select
  c.id,
  c.name,
  c.theme,
  p.email                                   as owner_email,
  p.role                                    as owner_role,
  (select count(*) from public.stellenanzeigen s where s.customer_id = c.id) as stellen,
  (select count(*) from public.mitarbeiter  m where m.customer_id = c.id)    as mitarbeiter,
  c.created_at
from public.customers c
left join public.profiles p on p.customer_id = c.id
order by owner_email nulls last, c.created_at;

-- b) Alle Login-Konten (profiles). gc_admin = behalten. owner/mitarbeiter/buero = Test -> löschen.
select id, email, name, role, customer_id, created_at
from public.profiles
order by role, created_at;


-- ---------- BLOCK 2: LÖSCHEN (destruktiv!) ----------
-- Erst ausführen, wenn BLOCK 1 bestätigt: NUR Test-Owner + deren Betriebe weg,
-- Portal-Firmen + gc_admin bleiben. Läuft transaktional; bei Fehler -> Rollback.
do $$
declare r record;
begin
  -- 1) Test-Betriebe (an einem 'owner'-Login hängend) löschen.
  --    Cascade entfernt automatisch deren mitarbeiter, Test-Stellen, Zuordnungen.
  for r in
    select distinct p.customer_id as cid
    from public.profiles p
    where p.role = 'owner' and p.customer_id is not null
  loop
    raise notice 'Lösche Test-Betrieb %', r.cid;
    delete from public.customers where id = r.cid;
  end loop;

  -- 2) Alle Nicht-Admin-Logins (owner + mitarbeiter + buero) entfernen.
  --    auth.users-Löschung cascadet die profiles-Zeile automatisch.
  delete from auth.users u
   using public.profiles p
   where p.id = u.id
     and p.role <> 'gc_admin';

  raise notice 'Bereinigung abgeschlossen. gc_admin + Portal-Firmen unangetastet.';
end $$;

-- ---------- BLOCK 3: KONTROLLE (nach dem Löschen) ----------
-- Erwartung: profiles enthält nur noch gc_admin; mitarbeiter ist leer;
-- customers enthält nur noch die echten Portal-Firmen (mit Stellen, ohne owner_email).
select role, count(*) from public.profiles group by role;
select count(*) as mitarbeiter_rows from public.mitarbeiter;
select count(*) as betriebe_gesamt from public.customers;
