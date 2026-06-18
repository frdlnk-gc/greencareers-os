-- =========================================================
-- GreenCareers OS · Schema v6 — Vertrag/Abo-Felder + Datei-Upload (Storage)
-- Einmal komplett in den Supabase SQL Editor einfuegen + "Run". Idempotent.
--
-- Was das macht:
--  1) Erweitert customers um Vertrag/Abo-Felder
--     (Kauftyp Einmal/Abo, Produkt Smart/Premium/Excellence, Betrag, Laufzeit, Zahlungsart)
--  2) Legt einen oeffentlichen Storage-Bucket "portal-media" an (Logos, Banner,
--     Unternehmens- & Stellenbilder, Ansprechpartner-Fotos) + Policies:
--     - JEDER darf lesen (Bilder erscheinen oeffentlich auf dem Stellenportal)
--     - nur eingeloggte Nutzer (authenticated = GC-Admins im Backend) duerfen
--       hochladen / ueberschreiben / loeschen
-- =========================================================

-- ---------- 1) CUSTOMERS: Vertrag/Abo-Felder ----------
alter table public.customers add column if not exists kauftyp     text;   -- 'einmalzahlung' | 'abo'
alter table public.customers add column if not exists produkt     text;   -- 'smart' | 'premium' | 'excellence'
alter table public.customers add column if not exists betrag      numeric; -- gezahlter Betrag (EUR)
alter table public.customers add column if not exists laufzeit    text;   -- '6' | '12' (nur bei Abo)
alter table public.customers add column if not exists zahlungsart text;   -- 'rechnung' | 'ueberweisung' | 'lastschrift' | 'paypal' | 'karte'

-- ---------- 2) STORAGE: oeffentlicher Bucket portal-media ----------
insert into storage.buckets (id, name, public)
values ('portal-media', 'portal-media', true)
on conflict (id) do update set public = true;

-- Oeffentlich lesbar (Bilder auf dem Portal sichtbar)
drop policy if exists "portal_media_read" on storage.objects;
create policy "portal_media_read"
  on storage.objects for select
  using (bucket_id = 'portal-media');

-- Nur eingeloggte Nutzer duerfen hochladen
drop policy if exists "portal_media_insert" on storage.objects;
create policy "portal_media_insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'portal-media');

-- Nur eingeloggte Nutzer duerfen ueberschreiben
drop policy if exists "portal_media_update" on storage.objects;
create policy "portal_media_update"
  on storage.objects for update to authenticated
  using (bucket_id = 'portal-media')
  with check (bucket_id = 'portal-media');

-- Nur eingeloggte Nutzer duerfen loeschen
drop policy if exists "portal_media_delete" on storage.objects;
create policy "portal_media_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'portal-media');
