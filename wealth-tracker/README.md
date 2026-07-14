# Vermögen — persönlicher Vermögens- & Aktien-Tracker

Eine private, werbefreie Alternative zu GetQuin: alle Depots aggregiert,
einzelne Positionen, Dividenden, Vermögens-Prognose. Läuft im Browser auf
Laptop und Handy.

**Stack:** Next.js 16 (App Router) · React 19 · Tailwind v4 · Supabase
(Postgres + Auth) · Kurse später über Yahoo Finance (Aktien/ETF) und CoinGecko
(Krypto).

## Status: Phase 1

- ✅ Datenmodell: Depots, Instrumente, Transaktionen, Kurse, Wechselkurse
      (`supabase/migrations/0001_init.sql`), abgesichert per Row Level Security.
- ✅ Login (E-Mail/Passwort) über Supabase.
- ✅ Aggregierte Übersicht (Gesamtvermögen + alle Depots) und Depot-Detail mit
      Positionsliste — dunkles Design.
- ✅ Positionen werden immer aus Transaktionen berechnet, in EUR umgerechnet.

Nächste Phasen: automatische Kurse (Yahoo/CoinGecko, stündlich 6–24 Uhr) ·
Screenshot-Import · Dividenden · Vermögens-Prognose.

## Lokal starten

```bash
cd wealth-tracker
npm install
cp .env.example .env.local   # Supabase-Werte eintragen
npm run dev                  # http://localhost:3000
```

Die beiden benötigten Werte (`NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`) stehen im Supabase-Dashboard unter
**Project Settings → API**.

## Datenbank einrichten

1. Migration einspielen: Inhalt von `supabase/migrations/0001_init.sql` im
   Supabase SQL-Editor ausführen (legt Tabellen + RLS an).
2. Nutzer anlegen: im Supabase-Dashboard unter **Authentication → Users**
   einen Nutzer mit E-Mail/Passwort erstellen.
3. Startdaten einspielen: `supabase/seed.sql` ausführen (verknüpft die echten
   Depots und Positionen mit dem in Schritt 2 angelegten Nutzer).

Der Seed wird aus `scripts/gen-seed.mjs` erzeugt (`node scripts/gen-seed.mjs`).
Die Zuordnung Position → Depot ist dort eine Demo-Zuordnung; die echte
Zuordnung kommt später über den Screenshot-Import.
