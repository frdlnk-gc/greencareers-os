# GreenCareers OS – DSGVO & Hosting-Strategie

> Stand: 2026-06-09. Strategie-Notiz für die produktive Version (der Prototyp ist reines Frontend
> ohne Backend/echte Daten). Hier geht es um die Frage: Wie machen wir GreenCareers OS rechtssicher
> und zuverlässig, sobald echte Personal-, Zeiterfassungs- und Kundendaten verarbeitet werden.

---

## 1. Warum das kein "Nice-to-have" ist

GreenCareers OS verarbeitet drei besonders sensible Datenkategorien:

| Bereich | Datenart | Risikostufe |
|---|---|---|
| Zeiterfassung | Arbeitszeiten, ggf. Standort beim Stempeln | hoch (Verhaltens-/Leistungskontrolle) |
| Personal (Team) | Name, Kontakt, Krankheit, Urlaub, Lohn | sehr hoch (Gesundheitsdaten = Art. 9 DSGVO) |
| Kunden | Kontakt, Aufträge, Werte | mittel |

Gesundheitsdaten (Krankmeldungen) und Standortdaten sind die kritischsten Punkte – hier schaut
ein Datenschützer zuerst hin.

---

## 2. Wie "echte" Software-Unternehmen DSGVO-Konformität sicherstellen

Es gibt kein "DSGVO-Zertifikat, das man kauft". Konformität entsteht aus einem Bündel
technischer + organisatorischer Maßnahmen (TOMs). Das machen ernsthafte SaaS-Anbieter:

### 2.1 Rechtsgrundlage & Rollen klären
- **Wir sind Auftragsverarbeiter (Art. 28 DSGVO).** Der GaLaBau-Betrieb ist der Verantwortliche
  für die Daten seiner Mitarbeiter/Kunden. Wir verarbeiten in seinem Auftrag.
- **Pflicht: AV-Vertrag (AVV / DPA)** mit jedem Kunden. Standardisiert, beim Onboarding digital
  abschließbar (1 Klick). Ohne AVV darf der Betrieb die Software rechtlich nicht nutzen.
- Eigene **Sub-Auftragsverarbeiter** (Hoster, E-Mail-Versand, Fehler-Tracking) listen und im
  AVV offenlegen.

### 2.2 Datensparsamkeit & Zweckbindung (Art. 5)
- Nur erheben, was gebraucht wird. Standortnachweis beim Stempeln = **einmaliger Punkt als
  Nachweis**, KEINE Dauerortung (genau so ist es im Prototyp formuliert – das ist DSGVO-sauber
  und sollte so bleiben).
- Lösch-/Aufbewahrungskonzept: Bewerberdaten nach Absage löschen (Faustregel 6 Monate wg. AGG),
  Zeiterfassung gem. Aufbewahrungsfristen, dann automatisch anonymisieren/löschen.

### 2.3 Technische Maßnahmen (TOMs)
- **Verschlüsselung**: TLS 1.2+ in Transit, Verschlüsselung at-rest (DB + Backups).
- **Mandantentrennung**: jeder Betrieb sieht nur seine Daten (Row-Level-Security, z. B. bei
  Supabase/Postgres `auth.uid()`-Policies – passt zum bestehenden GC-Stack).
- **Rollen & Least-Privilege**: genau das Rollenmodell aus dem Prototyp (Admin /
  Personalverwaltung / Mitarbeiter). Mitarbeiter sehen nur eigene Zeiten/Urlaub.
- **Audit-Log**: wer hat wann welche Personaldaten geändert (für Art.-9-Daten quasi Pflicht).
- **Backups + Restore-Test**, MFA für Admins, automatische Updates.
- **Pseudonymisierung** wo möglich.

### 2.4 Betroffenenrechte technisch umsetzbar machen (Art. 15–20)
- Auskunft, Berichtigung, Löschung, Datenexport müssen per Funktion abbildbar sein
  (z. B. "Mitarbeiterdaten exportieren / löschen"-Button). Nicht erst wenn jemand klagt.

### 2.5 Organisatorisch
- **Verzeichnis von Verarbeitungstätigkeiten (VVT, Art. 30)** führen.
- **Datenschutzerklärung** + **TOM-Dokument** öffentlich/abrufbar.
- Bei Standortdaten + Leistungsdaten: **Datenschutz-Folgenabschätzung (DSFA, Art. 35)** durchführen –
  weil Zeiterfassung als potenzielle Verhaltens-/Leistungskontrolle gilt.
- **Meldekette für Datenpannen** (72-Stunden-Frist, Art. 33).
- Ggf. **externen Datenschutzbeauftragten** beauftragen (für ein kleines Unternehmen günstig
  als Service buchbar, ~50–150 €/Monat).
- **Mitbestimmung**: Wo Betriebsrat existiert, ist Zeiterfassungssoftware mitbestimmungspflichtig
  (§ 87 BetrVG). Für kleine GaLaBau-Betriebe meist irrelevant, aber gut zu wissen.

### 2.6 Vertrauensbeschleuniger (optional, später)
- **ISO 27001** oder **TISAX** als Zertifizierung – teuer, aber starkes Verkaufsargument bei
  größeren Kunden / Ausschreibungen (Stadtwerke Nord o. ä.).
- Pen-Test / Security-Audit vor dem Launch.

---

## 3. Hosting – zuverlässig in DE (Prio), AT, CH

### 3.1 Grundprinzip
DSGVO verlangt nicht zwingend "Server in Deutschland", aber **EU/EWR-Hosting ohne
Drittlandtransfer** ist der sicherste und vertrauensbildendste Weg – gerade im Handwerk
("Daten bleiben in Deutschland" ist ein echtes Verkaufsargument). Für CH gilt: die Schweiz hat
ein **Angemessenheitsbeschluss** der EU → Datenfluss EU↔CH ist unproblematisch.

### 3.2 Konkrete Hoster-Optionen (DE/EU, DSGVO-konform)

**Managed / einfach (empfohlen für Start):**
- **Hetzner Cloud** (Nürnberg/Falkenstein, DE) – günstig, zuverlässig, deutsche AVV. Top
  Preis/Leistung für ein Bootstrap-Produkt.
- **IONOS** (DE), **OVHcloud** (DE/EU/FR) – ebenfalls EU-Rechenzentren + AVV.
- **Scaleway** (FR) – EU, gute Cloud-Tools.

**Plattform/Backend-Layer:**
- **Supabase** (passt zum bestehenden GC-Stack): bietet **EU-Region (Frankfurt)** wählbar.
  Wichtig: bei Projekt-Erstellung explizit `eu-central-1 (Frankfurt)` wählen + AVV mit Supabase
  abschließen. Supabase ist US-Firma → AVV + EU-Region + SCCs nötig; sauber machbar.
- Wer 100 % deutsche Hoheit will: Supabase ist **Open Source** und **self-hostbar** auf
  Hetzner → maximale Datenhoheit, mehr Eigenaufwand.

**Vollständig "souverän/deutsch" (für größte Kunden):**
- **STACKIT** (Schwarz-Gruppe, DE), **Open Telekom Cloud** (T-Systems, DE), **IONOS Cloud**.
  Teurer/komplexer, aber maximales Vertrauen.

### 3.3 Zuverlässigkeit (Verfügbarkeit)
- **Region mit mehreren Availability Zones** wählen (Hetzner/Supabase EU-Central).
- **Tägliche, verschlüsselte Backups** + getesteter Restore.
- **Monitoring/Uptime-Alerts** (z. B. Better Stack / UptimeRobot).
- **Status-Page** für Kunden.
- Realistisches Ziel zum Start: 99,9 % – mit Managed-Hosting gut erreichbar ohne eigenes Ops-Team.

### 3.4 Konkrete Empfehlung für GreenCareers OS
1. **Backend/DB: Supabase EU-Region (Frankfurt)** + AVV mit Supabase + Row-Level-Security pro
   Betrieb. Schnellster Weg, passt zum bestehenden GC-Know-how.
2. **Frontend/Hosting: Vercel (EU-Edge) oder direkt bei Hetzner/IONOS.** Falls "alles deutsch"
   gefragt ist → Hetzner + eigenes Deployment.
3. **AVV-Kette dokumentieren**: GreenCareers ↔ Kunde (wir = Auftragsverarbeiter),
   GreenCareers ↔ Supabase/Hetzner (= Sub-Auftragsverarbeiter).
4. **Marketing-Botschaft**: "Gehostet in Deutschland, DSGVO-konform, AV-Vertrag inklusive" –
   genau das, was GaLaBau-Inhaber hören wollen.

---

## 4. Minimal-Checkliste vor dem Go-Live mit echten Daten

- [ ] AVV-Vorlage (digital abschließbar beim Onboarding)
- [ ] Datenschutzerklärung + TOM-Dokument
- [ ] Verzeichnis Verarbeitungstätigkeiten (VVT)
- [ ] DSFA für Zeiterfassung/Standort
- [ ] EU-Region beim Hoster verifiziert (Frankfurt)
- [ ] Verschlüsselung in Transit + at-rest aktiv
- [ ] Row-Level-Security / Mandantentrennung getestet
- [ ] Rollen-/Rechtekonzept (Admin/Personalverwaltung/Mitarbeiter) – ✅ im Produkt angelegt
- [ ] Lösch-/Aufbewahrungskonzept (Bewerber, Zeiten)
- [ ] Backup + Restore-Test
- [ ] Export-/Lösch-Funktion für Betroffenenrechte
- [ ] Datenpannen-Meldekette (72 h)
- [ ] Optional: externer DSB beauftragt

---

*Hinweis: Das ist eine fundierte Strategie-Orientierung, keine Rechtsberatung. Vor dem Launch
mit echten Personaldaten sollte ein Fachanwalt/DSB AVV, DSFA und TOMs einmal final prüfen.*
