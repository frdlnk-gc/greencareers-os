# LAUNCH-ANLEITUNG: Bewerbungsfunnel → bewerbung.green-careers.de

**Für die neue Claude-Code-Session.** Alles Inhaltliche ist FERTIG. Es fehlen nur Deployment + Make-Verdrahtung. Führe die Schritte in dieser Reihenfolge aus.

## Status (was schon fertig ist)

- **Landingpage fertig entwickelt**: `bewerbung/index.html` auf Branch `claude/job-application-landing-page-t1nmgh` in `frdlnk-gc/greencareers-os` (dieser Ordner). Mobile-First-Funnel im Design des Gehaltschecks (Repo `frdlnk-gc/gehaltscheck`).
  - 3 Ad-Gruppen per URL-Parameter: ohne Param = generisch (Branchen-Frage), `?v=galabau`, `?v=tiefbau`, `?v=bauleiter`
  - Basis-Fragen: Branche → Position (echte Stellenbezeichnungen je Branche, Rollen-Klasse steuert Weiche) → Ausbildung Ja/Nein (bei Nein: Erfahrungs-Regler 0–30+ Jahre) → Standort (PLZ/Ort-Autocomplete aus `plz.json` + Umkreis-Chips)
  - Sonderfälle: Leitungsrollen = Erfahrungs-Regler + Qualifikations-Chips; Azubis = ohne Ausbildungs-/Gehaltsfrage; Helfer = Regler statt Ausbildungsfrage; Quereinsteiger = Herkunfts-Frage + Deutschkenntnisse (Qualitäts-Filter!)
  - Upsell-Weiche („noch nicht abgeschickt"): direkt abschicken vs. Zusatzfragen (Wunschgehalt-Slider zuerst, Benefits max. 5 aus 27 in Gruppen, ggf. Erfahrung/Scheine/Kolonne, Verfügbarkeit; einzeln überspringbar → „Frage übersprungen" im Payload)
  - Kontakt-Gate: Name/Handy/E-Mail, WhatsApp/Mail-Toggle, Pflicht-Consent Datenweitergabe, optionales Freitextfeld; danach ggf. Nachqualifizierung (`lead_enriched`)
  - Payload enthält ALLE Felder strukturiert + `bewerber_nachricht` (fertiger Textblock aller Fragen/Antworten für das Backend, Wunsch von Jana) + Meta Pixel/CAPI-Dedup (Pixel-ID `1986121842345009`)
  - Alles per Headless-Chromium end-to-end getestet.
- **IONOS-DNS ist gesetzt**: CNAME `bewerbung` → `frdlnk-gc.github.io` ✅ (durch Frederik erledigt)
- **Make-Blueprint fertig**: `bewerbung/launch/make-blueprint-gc-bewerbungsfunnel.json` (Webhook → Google Sheets addRow, 36 Spalten gemappt)
- **Sheet-Kopfzeile fertig**: `bewerbung/launch/sheet-kopfzeile.tsv`

## Schritt 1: Repo anlegen + deployen

1. Neues **öffentliches** GitHub-Repo `frdlnk-gc/bewerbung` anlegen (via `gh repo create bewerbung --public` oder API — die neue Session sollte nach `/web-setup` volle GitHub-Rechte haben).
2. Inhalt: Kopie von `bewerbung/index.html` und `bewerbung/plz.json` aus diesem Repo (Branch `claude/job-application-landing-page-t1nmgh`), dabei in index.html alle Vorkommen von `https://gehaltscheck.green-careers.de/` durch `` (leer, relative Pfade) ersetzen. Dazu aus dem Repo `frdlnk-gc/gehaltscheck` diese Assets kopieren: `hero.jpg`, `logo.png`, `favicon.png`, `testi-landschaft.jpg`, `testi-vorarbeiter.jpg`, `testi-baum.jpg`, `testi-bauleiter.jpg`, `testi-forst.jpg`, `testi-gaertnerin.jpg`, `testi-baumaschine.jpg`, `testi-quereinsteiger.jpg`. Plus Datei `CNAME` mit Inhalt `bewerbung.green-careers.de`.
3. Auf `main` pushen. GitHub Pages aktivieren (Settings → Pages → Deploy from a branch → `main` / root; Custom Domain zieht die CNAME-Datei; „Enforce HTTPS" aktivieren, sobald möglich).
4. Prüfen: https://bewerbung.green-careers.de lädt, PLZ-Autocomplete funktioniert (plz.json), Bilder laden.

## Schritt 2: Make-Szenario (Leads → Google Sheet)

Ziel-Sheet: „GC-Bewerber", Spreadsheet-ID `1ib0KvMezVycxhrQSQq7dosYN21N9OG94r4DrSSH4p48`, **Tabellenblatt 5**. Make-Ordner: **Master Dashboard GC**.

1. Kopfzeile aus `launch/sheet-kopfzeile.tsv` in Tabellenblatt 5, Zelle A1 einfügen (falls noch nicht geschehen).
2. Szenario „GC Bewerbungsfunnel → Google Sheet" anlegen — per Make-MCP (Webhook `gateway-webhook` erstellen, Blueprint aus `launch/make-blueprint-gc-bewerbungsfunnel.json` mit Hook-ID + bestehender Google-Connection versehen, in Ordner „Master Dashboard GC", aktivieren) — ODER Frederik importiert das Blueprint manuell (Szenario → Import Blueprint) und liefert die Webhook-URL.
3. **Webhook-URL** in BEIDE Kopien der Seite eintragen: Konstante `LEAD_WEBHOOK` (aktuell `""`) in `bewerbung/index.html` hier im OS-Repo (Branch `claude/job-application-landing-page-t1nmgh`) UND im neuen `bewerbung`-Repo. Committen + pushen.

## Schritt 3: End-to-End-Test

1. Funnel auf bewerbung.green-careers.de mit Testdaten komplett durchklicken (Vorname „Test") und absenden.
2. Make-Ausführung prüfen → Zeile erscheint in Tabellenblatt 5 mit allen Antworten inkl. Spalte „Bewerber-Nachricht" (Textblock).
3. Auch einmal „Ohne Zusatzfragen abschicken" + danach Nachqualifizierung testen (zweites Event `lead_enriched`).
4. Testzeilen im Sheet markieren/löschen.

## Wichtige Regeln aus dem bisherigen Chat (Frederik)

- So wenig Texteingabe wie möglich — alles über Buttons/Chips/Regler (nur Standort-Autocomplete + Kontaktdaten + optionales Freitextfeld tippen).
- Ziel: qualifizierte Bewerber; Quereinsteiger/Helfer sauber getrennt erfassen (Herkunft + Deutsch), keine harten Abfrage-Fronten (Regler statt „mind. 5 Jahre?").
- Benefits: max. 5 auswählbar (zeigt Motivation).
- Frederik will nach jedem Push einen klickbaren Vorschau-Link. Bis Pages live ist: https://raw.githack.com/frdlnk-gc/greencareers-os/claude/job-application-landing-page-t1nmgh/bewerbung/index.html
- Keine Schwerpunkt-Frage (kommt in späterem Meilenstein, Screen liegt inaktiv im Code).
