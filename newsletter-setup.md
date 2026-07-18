# GreenCareers · Newsletter über Lemlist — Setup & Architektur

> Stand: 2026-07. Baut das Newsletter-System für GreenCareers: Versand an drei
> Zielgruppen über Lemlist, mit automatischer Schnittstelle von Landingpage →
> Supabase → Lemlist und KI-gestützter Content-Erstellung zur Freigabe.
>
> **Wichtig:** Diese Dateien liegen im Repo `greencareers-os`, weil hier das
> Supabase-Backend (Schema, RPCs, Edge Functions) lebt. Die **Bedien-Oberfläche**
> (`newsletter.html`) läuft aktuell als eigenständige Seite und ist so gebaut,
> dass sie 1:1 als **„Marketing → Newsletter"** ins GC Tracking Dashboard
> übernommen werden kann (siehe „Einbau ins Tracking-Dashboard" unten).

---

## Gewählte Grund­entscheidungen (jederzeit änderbar)

| Thema | Entscheidung | Wo geändert |
|---|---|---|
| Zielgruppen | 3 getrennte, mit **eigenen Kampagnen**: `b2b_neukunde`, `b2b_bestandskunde`, `bewerber` | `audience`-Feld in allen Tabellen/Prompts |
| Segmentierung | nach `theme` (galabau/tiefbau/landwirtschaft) + optional `branche` | Leadmagnet / KI-Formular |
| Bewerber-Branche | **optional** — Recruiting-Themen laufen oft branchenübergreifend | Cockpit-Hinweis, KI-Prompt |
| Lemlist-Modell | **Kampagnen mappen + Leads einschleusen** (kein Auto-Erstellen) | `newsletter-lemlist` Edge Function |
| Opt-in | **Single-Opt-in** + Pflicht-Abmeldelink in jeder Mail | `newsletter_subscribe` RPC |
| Content | KI erzeugt Entwurf → du prüfst/änderst → Freigabe → nach Lemlist | `newsletter-ki` + Cockpit |

---

## Datenfluss (die „automatische Schnittstelle")

```
Landingpage (Leadmagnet-Slug)
   │  newsletter-lp-embed.html  (E-Mail + Consent)
   ▼
public.newsletter_subscribe(...)         ← Supabase-RPC (anon)
   │  Lead wird AKTIV gespeichert, Consent protokolliert,
   │  über den Leadmagnet der richtigen Lemlist-Kampagne zugeordnet
   ▼
newsletter-lemlist  (action: enroll)     ← Edge Function (gc_admin, aus dem Cockpit)
   │  schleust aktive Leads in ihre gemappte Kampagne,
   │  übergibt {{unsubscribeUrl}} pro Lead
   ▼
Lemlist-Kampagne versendet den Newsletter
   │
   ▼  Abmeldelink „Keine weiteren E-Mails" → newsletter-unsubscribe.html
public.newsletter_unsubscribe(token)  →  Status 'unsubscribed'
   │
   ▼  newsletter-lemlist (action: sync_unsubscribes) meldet auch in Lemlist ab
```

---

## Dateien in diesem Repo

| Datei | Zweck |
|---|---|
| `supabase-schema-v20-newsletter.sql` | Tabellen, RLS, RPCs (einmal im SQL-Editor ausführen) |
| `supabase-edge-newsletter-lemlist.ts` | Lemlist-Anbindung (test/campaigns/enroll/sync_unsubscribes) |
| `supabase-edge-newsletter-ki.ts` | KI-Texter (Betreff/Preheader/HTML+Text-Body) |
| `newsletter.html` | Cockpit (gc_admin): erstellen, Abonnenten, Leadmagneten, Einstellungen |
| `newsletter-lp-embed.html` | Einbettbares Anmelde-Widget für Landingpages |
| `newsletter-unsubscribe.html` | Öffentliche Abmelde-Seite (Token) |

---

## Einrichtung — Schritt für Schritt

### 1. Secrets setzen (Supabase → Edge Functions → Manage secrets, oder CLI)

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...        # ggf. schon vorhanden (kalk-ki/maya)
supabase secrets set LEMLIST_API_KEY=xxxxxxxxxxxxxxxx    # Lemlist → Settings → Integrations → API
supabase secrets set SB_SERVICE_ROLE_KEY=eyJ...          # ggf. schon vorhanden (invite-mitarbeiter)
# optional, falls die Abmelde-Seite unter anderer URL liegt:
supabase secrets set NL_UNSUBSCRIBE_BASE=https://os.green-careers.de/newsletter-unsubscribe.html
```

### 2. Schema einspielen
`supabase-schema-v20-newsletter.sql` komplett in den **Supabase SQL Editor** kopieren → **Run**. Idempotent, kann bei Änderungen erneut laufen.

### 3. Edge Functions deployen
```bash
supabase functions deploy newsletter-lemlist
supabase functions deploy newsletter-ki
```
Verify-JWT bleibt **an** — beide Functions prüfen zusätzlich selbst `gc_admin`.

### 4. Cockpit öffnen
`newsletter.html` (z. B. `https://os.green-careers.de/newsletter.html`) mit einem `gc_admin`-Konto öffnen.
→ **Einstellungen → Verbindung testen** und **Kampagnen laden**.

### 5. Lemlist-Kampagnen anlegen (in Lemlist)
Lege je Zielgruppe/Branche eine Kampagne an, z. B.:
- „Newsletter · B2B Neukunden · GaLaBau"
- „Newsletter · B2B Bestand · alle"
- „Newsletter · Bewerber · alle"

Jede Kampagne braucht mindestens einen E-Mail-Schritt. Der Inhalt kommt aus dem
Cockpit (Betreff/HTML kopieren) — Lemlist ersetzt pro Empfänger `{{firstName}}`
und `{{unsubscribeUrl}}` (das Custom-Feld schleust die Edge Function mit ein).
Setze in Lemlist einen Abmelde-Link auf `{{unsubscribeUrl}}`.

### 6. Leadmagneten mappen (Cockpit → Leadmagneten)
Pro Landingpage einen Leadmagnet anlegen: **Slug**, Zielgruppe, Branche und die
**Lemlist-Kampagne** auswählen. Beispiel-Slug: `galabau-fachkraefte-guide`.

### 7. Landingpage anbinden
Auf der Landingpage einbinden (Slug = der aus Schritt 6):
```html
<div id="gc-newsletter"
     data-leadmagnet="galabau-fachkraefte-guide"
     data-accent="#16A34A"
     data-title="Kostenloser Fachkräfte-Guide für GaLaBau-Betriebe"></div>
<!-- Widget-Script aus newsletter-lp-embed.html übernehmen (oder als /newsletter-lp-embed.js hosten) -->
```
Der Rest (Zielgruppe, Branche, Kampagne, Consent-Text) kommt automatisch aus dem
Leadmagnet.

---

## Täglicher Ablauf

1. **Cockpit → Newsletter erstellen**: Zielgruppe + Branche wählen, optional ein
   Thema vorgeben → *Entwurf generieren* → prüfen/anpassen → *Freigeben*.
2. Freigegebenen Betreff + HTML in die passende **Lemlist-Kampagne** einsetzen.
3. **Cockpit → Einstellungen → Leads einschleusen** (optional nach Zielgruppe
   gefiltert): übergibt neue Abonnenten an ihre Kampagne.
4. Lemlist versendet. Abmeldungen laufen automatisch über den Link; danach
   **Abmeldungen synchronisieren** klicken (oder per Cron, s. u.).

---

## Bestandskunden & Bewerber aus der DB aufnehmen (optional)

Neue Leads kommen über Landingpages rein. Wer **bestehende** `customers` /
`bewerber` in den Newsletter aufnehmen will, spiegelt sie einmalig in
`newsletter_subscribers` (Rechtsgrundlage prüfen — §7 UWG Bestandskunden bzw.
berechtigtes Interesse, Abmeldelink ist immer dabei). Beispiel B2B-Bestand:

```sql
insert into public.newsletter_subscribers (email, name, audience, theme, branche, quelle, status, consent_source)
select lower(c.email), c.name, 'b2b_bestandskunde', c.theme,
       (c.branchen)[1], 'customers', 'active', 'bestandskunde_import'
from public.customers c
where c.email is not null and c.produkt is not null
on conflict (lower(email), audience) do nothing;
```
Danach im Cockpit die Kampagne zuordnen (oder `lemlist_campaign_id` per SQL
setzen) und einschleusen.

---

## Automatisierung (optional)

Abmeldungen regelmäßig nach Lemlist spiegeln — z. B. per Supabase-Cron
(`pg_cron`) oder externem Scheduler, der die Edge Function mit `gc_admin`-JWT und
`{ "action": "sync_unsubscribes" }` aufruft. Analog `enroll` für automatisches
Einschleusen neuer Leads.

---

## Einbau ins GC Tracking Dashboard (Marketing → Newsletter)

`newsletter.html` ist bewusst modular:
- **Auth-Block** (Login/gc_admin-Gate) — im Tracking-Dashboard entfällt er, wenn
  dort bereits ein gc_admin eingeloggt ist; dann nur `TOKEN` aus der bestehenden
  Session übernehmen.
- **`setTab()` + `render*`-Funktionen** bilden die vier Bereiche. Sie hängen nur
  an `#body`/`#stats` und den globalen Helfern (`sb`, `edge`, `esc`). Diese vier
  Render-Funktionen (`renderCreate/renderSubs/renderMagnets/renderSettings`) lassen
  sich als „Newsletter"-Unterseite unter dem Menüpunkt *Marketing* einhängen.

Sobald mir das Repo des Tracking-Dashboards vorliegt, portiere ich das Cockpit
dorthin (statt eigenständiger Seite) und passe Login/Navigation an dessen
Struktur an.

---

## Sicherheit & DSGVO

- Alle Newsletter-Tabellen haben **RLS**; direkter Zugriff nur `gc_admin`.
  Öffentlich läuft nur über die drei SECURITY-DEFINER-RPCs (subscribe /
  unsubscribe / leadmagnet_public).
- **Single-Opt-in**: Einwilligungstext + Zeitpunkt + Quelle werden pro Abonnent
  protokolliert (`consent_text/consent_at/consent_source`). Jede Mail enthält den
  Abmeldelink `{{unsubscribeUrl}}`.
- Secrets (Lemlist-, Service-Role-, Anthropic-Key) liegen ausschließlich als
  Supabase-Secrets, nie im Browser.
