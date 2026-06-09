# Build-Brief: „GreenCareers OS" – klickbarer Prototyp (Split-Test-Version)

Baue einen voll klickbaren Frontend-Prototyp einer Betriebssoftware für GaLaBau-Betriebe
(Garten- & Landschaftsbau). Es ist ein Design-/UX-Prototyp mit Dummy-Daten – KEIN Backend,
KEINE echte Datenbank. Es geht um ein eigenständiges, gegen eine Vergleichsversion antretendes
Design. Interpretiere Layout & Optik bewusst eigenständig (Split-Test), aber halte dich strikt
an die Produkt-Architektur, Inhalte und technischen Vorgaben unten.

## Produktvision
- Kostenlose, täglich genutzte Betriebssoftware für GaLaBau-Inhaber.
- Recruiting ist die Eintrittstür, die Software drumherum schafft Lock-in (täglicher Nutzen).
- Zielnutzer: Betriebsinhaber (Beispiel: „Georg Müller", Firma „Müller GaLaBau"), oft am Handy.
- Leitprinzip: maximal übersichtlich, Handwerker-Sprache, hell/clean wie echte SaaS-Tools,
  mobile-first, NICHT verspielt/kindlich.

## Architektur – 4 feste Hauptbereiche (Namen NIEMALS ändern)
Genau diese 4 Navigationspunkte, in dieser Reihenfolge:
1. **Heute** – Tages-Dashboard („Mein Cockpit"), erzeugt die tägliche Nutzung.
2. **Team** – mit 4 Unter-Tabs: Bewerber (Recruiting-Kanban) · Mitarbeiter (Personalliste) ·
   Urlaub & Krank · Zeiterfassung.
3. **Planung** – Plantafel: Kolonnen/Trupps × Wochentage, Drag & Drop.
4. **Kunden** – mit 2 Unter-Tabs: Anfragen-Inbox (Multichannel) · Kundenliste.

## Technische Vorgaben (hart)
- **EINE einzige `app.html`-Datei**, kein Build-Step, doppelklickbar/teilbar.
- Vanilla HTML + CSS + JS. Eigenes CSS mit CSS-Custom-Properties (Token-System).
- Icons: Lucide via CDN (`https://unpkg.com/lucide@latest`, `lucide.createIcons()`).
- Fonts via Google Fonts: **Inter** für ALLE Texte. **Fraunces** (Serif) AUSSCHLIESSLICH
  für die Begrüßungs-Überschrift „Guten Morgen, …" und ggf. den Login-Titel – sonst nirgends.
- Rendering: View-Switching-SPA per JS (Template-Literals in Container injecten).
- Responsive: Desktop = einklappbare Sidebar; Mobile = Bottom-Nav + Slide-in-Sidebar mit Scrim.
- 3 unabhängige Drag-&-Drop-Systeme (HTML5 DnD): Kanban-Spalten, Plantafel-Zellen, Heute-Module.

## Design-Richtung „Hell & Weich" (Referenz – darf im Split-Test variiert werden)
GreenCareers-Markenpalette als Basis:
- Akzent-Grün: `#16A34A` → `#0E7A43` (Verlauf), Soft-Grün-BG: `#EAF7EF`
- Text: `#17231A`, Muted: `#6A7A6E`, Linien: `#E9ECE8`, Karten: `#fff`
- Dunkle Sidebar: `#15241A`, Sidebar-Text: `#A9B8AC`
- Canvas mit dezentem grünem Radial-Verlauf auf fast-weiß (`#FBFDFB`→`#F2F6F2`)
- Weiche Schatten, runde Ecken (`--radius:14px`), freundlich & professionell.
- Co-Branding: Kundenlogo oben links in der Sidebar; dezent unten „läuft auf GreenCareers OS".

## Screens & Inhalte (mit Dummy-Daten)

### Login (gated die App)
- Karte mit Logo „GreenCareers **OS**", Titel „Willkommen zurück", Untertitel.
- Felder E-Mail (vorausgefüllt `georg@mueller-galabau.de`) + Passwort (vorausgefüllt `demo1234`).
- „Angemeldet bleiben" + „Passwort vergessen?" → Reset-Sub-View → „Link gesendet"-Bestätigung.
- „Anmelden" blendet die App ein und öffnet „Heute".

### Heute – „Mein Cockpit" (modular, Module per Drag & Drop anordbar)
- Begrüßung in Fraunces: „Guten Morgen, Georg" + Datum „Mittwoch, 3. Juni 2026 · KW 23 · 11 Mitarbeiter im Einsatz".
- Hinweis-Banner: Module per Drag & Drop anordnen.
- 2 KPI-Kacheln: „Bewerber anrufen 2 · vom Bot qualifiziert" (Akzent) · „Neue Anfragen 5 · WhatsApp·Mail·Tel.".
- Panel „Das ist heute wichtig": 2 qualifizierte Bewerber anrufen (Thomas K., Murat Y.) ·
  Anfrage Familie Brandt beantworten (WhatsApp) · Urlaubsantrag Sven prüfen.
- Rail rechts: Wetter-Widget (21°C Hamburg, „trocken – guter Arbeitstag" – Wetter ist GaLaBau-kritisch, MUSS rein) ·
  Recruiting-Such-Panel („Landschaftsgärtner (m/w/d), 7 Bewerber/Monat, 2 qualifiziert, Bewerber ansehen") ·
  Quick-Actions (Mitarbeiter / Einsatz / Angebot / Zeiten).
- „+ Modul hinzufügen"-Platzhalter.

### Team › Bewerber (Kanban, Drag & Drop)
4 Spalten: **Neu** · **Qualifiziert · anrufen** · **Im Gespräch** · **Eingestellt**.
Karten enthalten Name, Rolle, Tags, Meta (Quelle/Datum). Beispiele:
Daniel Hoffmann (Landschaftsgärtner, WhatsApp), Erik Lindqvist (Geselle, Web),
Thomas Krause (Vorarbeiter, Bot-qualifiziert), Murat Yilmaz (Pflasterer, Bot-qualifiziert),
Lukas Berger (Azubi, Probetag), Jonas Weber (Start 01.07.).
Hinweis: „Bewerber vom WhatsApp-Bot vorqualifiziert landen direkt in ‚Qualifiziert · anrufen'."
Karten per Drag & Drop zwischen Spalten verschiebbar. Klick → Detail-Modal mit
Status/Quelle/Vorqualifikation/Verfügbarkeit + Buttons „Jetzt anrufen" / „Probetag".

### Team › Mitarbeiter
Tabelle: Name · Funktion · Kolonne · Telefon · Status (Aktiv/Krank/Urlaub) · Urlaubstage.
Beispiele: Sven Albrecht (Vorarbeiter), Mehmet Kaya (Pflasterer), Tim Schulz (Landschaftsgärtner),
Ali Demir (Geselle, Krank), Lukas Berger (Azubi, Urlaub).

### Team › Urlaub & Krank
Tabelle: Mitarbeiter · Art (Urlaub/Krank) · Von · Bis · Dauer · Status (Genehmigen-Button/Genehmigt/Aktiv).

### Team › Zeiterfassung
3 KPI-Kacheln (Eingestempelt 11 · Ø Stunden 9 · Feierabend 1) + Tabelle:
Mitarbeiter · Einstempeln · Ausstempeln · Stunden · Baustelle · Status (Läuft/Fertig).

### Planung – Plantafel
Grid: linke Spalte Kolonnen (Kolonne 1/2/3 mit Mann-Anzahl), Spalten = Wochentage (Heute·Mi, Do, Fr, Mo, Di).
Zellen = Aufträge (Baustelle + Ort, farbiger Rand), per Drag & Drop auf Kolonne/Tag verschiebbar.
Button „+ Auftrag".

### Kunden › Anfragen-Inbox (Multichannel)
Liste eingehender Anfragen mit Kanal-Badge (WhatsApp/E-Mail/Telefon/Website) + Zeit + Vorschautext.
Beispiele: Familie Brandt (WhatsApp, Gartenneuanlage), Stadtwerke Nord (E-Mail, Ausschreibung),
Herr Petersen (Telefon, verpasster Anruf/Mailbox), Anja Bauer (Website, Terrasse), Klaus Möller (WhatsApp).

### Kunden › Kundenliste
Tabelle: Kunde · Ort · Typ (Neukunde/Bestand) · Projekt · Wert · Status (Anfrage/Angebot/Aktiv).

## Globale Interaktionen
- Sidebar einklappen (Burger), Mobile Slide-in mit Scrim.
- Top-Bar: Burger, View-Titel, Wetter-Mini, Glocke (Benachrichtigungen).
- Detail-Modals/Sheets (Bewerber, Mitarbeiter, Nachricht), schließbar.
- Toast für Aktionen ohne echte Funktion (z. B. „Profil & Einstellungen folgen").
- Aktiver Nav-Punkt hervorgehoben; Badges auf Team (2) und Kunden (5).

## Akzeptanzkriterien
- Login → App; alle 4 Bereiche + alle Unter-Tabs navigierbar.
- Alle 3 Drag-&-Drop-Systeme funktionieren.
- Begrüßung in Fraunces, sonst überall Inter.
- Wetter-Widget vorhanden. Funktioniert sauber auf Desktop UND Mobile.
- Komplett in einer `app.html`, ohne Build-Step lauffähig.

> Hinweis: Dies ist die Vergleichs-/Split-Test-Vorlage. Bringe gern eine eigenständige visuelle
> Handschrift ein – aber Architektur (4 Bereiche + Unter-Tabs), Inhalte und Tech-Constraints
> sind verbindlich.
