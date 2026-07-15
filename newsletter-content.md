# GreenCareers · Fertige Newsletter-Inhalte (7 Kampagnen)

> Ready-to-paste. Pro Kampagne: **Betreff**, **Preheader**, **HTML-Body**, **Text-Version**.
> Platzhalter, die Lemlist pro Empfänger ersetzt: `{{firstName}}` (Vorname),
> `{{unsubscribeUrl}}` (Abmeldelink — schleust die Edge-Function ein).
> `{{cta_url}}` bitte vor dem Versand durch den echten Link ersetzen
> (Erstgespräch-Kalender bzw. Stellenübersicht).
>
> Diese Inhalte liegen zusätzlich als freigegebene Kampagnen in der DB
> (`supabase-seed-newsletter.sql`). **Erst kontrollieren, dann in Lemlist einfügen
> und starten** — nichts ist live.

Akzentfarben: GaLaBau `#16A34A` · Tiefbau `#EA580C` · Landwirtschaft `#CA8A04`.

---

## 1 · B2B-Neukunde · GaLaBau

**Betreff:** Diese Woche hätten 3 Landschaftsgärtner zu Ihnen gepasst
**Varianten:** „Fehlt Ihnen gerade eine Kolonne?" · „Gute GaLaBau-Leute sind da – nur nicht bei Ihnen"
**Preheader:** Warum qualifizierte Bewerber am Betrieb vorbeilaufen – und was planbar hilft.

```html
<div style="max-width:600px;margin:0 auto;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#17231A;font-size:16px;line-height:1.6">
  <p>Hallo {{firstName}},</p>
  <p>die Saison läuft, die Auftragsbücher sind voll – und trotzdem fehlt an allen Ecken die Fachkraft. Das Problem ist selten, dass es keine guten Landschaftsgärtner gibt. Sie erreichen Ihren Betrieb nur nicht.</p>
  <p>Genau da setzt GreenCareers an. Wir sind ein <strong>Karrierenetzwerk</strong> für den grünen Bereich und bringen Betriebe planbar mit qualifizierten Fachkräften aus ihrer Region zusammen – keine anonymen Massenanzeigen, sondern geprüfte Kandidaten, die zu Ihrem Gewerk passen.</p>
  <p style="background:#EAF7EF;border-radius:12px;padding:14px 16px;margin:22px 0">
    <strong>Was das für Sie heißt:</strong> vorqualifizierte Bewerber statt Zettelwirtschaft, weniger unbesetzte Kolonnen, kalkulierbarer Nachschub – auch wenn der Markt leergefegt scheint.
  </p>
  <p>Wollen wir 15 Minuten sprechen, wie das für <em>Ihren</em> Betrieb aussehen würde? Unverbindlich, kostenlos.</p>
  <p style="text-align:center;margin:28px 0">
    <a href="{{cta_url}}" style="display:inline-block;background:#16A34A;color:#fff;text-decoration:none;font-weight:700;padding:14px 30px;border-radius:10px">Kostenloses Erstgespräch sichern</a>
  </p>
  <p>Beste Grüße<br>Ihr GreenCareers-Team</p>
  <hr style="border:none;border-top:1px solid #E9ECE8;margin:26px 0 14px">
  <p style="font-size:12px;color:#6A7A6E">GreenCareers · green-careers.de · <a href="{{unsubscribeUrl}}" style="color:#6A7A6E">Keine weiteren E-Mails erhalten</a></p>
</div>
```

**Text:**
```
Hallo {{firstName}},

die Saison läuft, die Auftragsbücher sind voll – und trotzdem fehlt die Fachkraft. Das Problem ist selten, dass es keine guten Landschaftsgärtner gibt. Sie erreichen Ihren Betrieb nur nicht.

Genau da setzt GreenCareers an: ein Karrierenetzwerk für den grünen Bereich, das Betriebe planbar mit qualifizierten Fachkräften aus ihrer Region zusammenbringt – keine Massenanzeigen, sondern geprüfte Kandidaten.

Was das heißt: vorqualifizierte Bewerber statt Zettelwirtschaft, weniger unbesetzte Kolonnen, kalkulierbarer Nachschub.

15 Minuten, unverbindlich und kostenlos? Termin: {{cta_url}}

Beste Grüße
Ihr GreenCareers-Team

Abmelden: {{unsubscribeUrl}}
```

---

## 2 · B2B-Neukunde · Straßen- & Tiefbau

**Betreff:** Unterbesetzte Kolonne? Das kostet mehr als eine Stelle
**Varianten:** „Wer fährt Montag den Bagger?" · „Fachkräfte für Ihre Baustelle – planbar"
**Preheader:** Verzögerte Baustellen sind teurer als jede Recruiting-Investition.

```html
<div style="max-width:600px;margin:0 auto;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#17231A;font-size:16px;line-height:1.6">
  <p>Hallo {{firstName}},</p>
  <p>eine Baustelle, die stillsteht, weil die Kolonne unterbesetzt ist, kostet Sie jeden Tag Geld – Vertragsstrafen, verschobene Folgeaufträge, Überstunden bei den verbliebenen Leuten. Eine unbesetzte Stelle ist selten das eigentliche Problem. Die Folgekosten sind es.</p>
  <p>GreenCareers ist ein <strong>Karrierenetzwerk</strong> für den Straßen- & Tiefbau. Wir bringen Betriebe planbar mit qualifizierten Fachkräften – Baugeräteführer, Rohrleitungsbauer, Poliere, Facharbeiter – aus ihrer Region zusammen. Geprüft, vorqualifiziert, passend zum Gewerk.</p>
  <p style="background:#FFF3EC;border-radius:12px;padding:14px 16px;margin:22px 0">
    <strong>Was das für Sie heißt:</strong> weniger Leerlauf auf der Baustelle, planbarer Personalnachschub statt Last-Minute-Suche, und ein Bewerberfluss, der nicht abreißt, sobald eine Anzeige ausläuft.
  </p>
  <p>15 Minuten am Telefon, wie das bei Ihnen laufen könnte? Kostenlos und unverbindlich.</p>
  <p style="text-align:center;margin:28px 0">
    <a href="{{cta_url}}" style="display:inline-block;background:#EA580C;color:#fff;text-decoration:none;font-weight:700;padding:14px 30px;border-radius:10px">Kostenloses Erstgespräch sichern</a>
  </p>
  <p>Beste Grüße<br>Ihr GreenCareers-Team</p>
  <hr style="border:none;border-top:1px solid #E9ECE8;margin:26px 0 14px">
  <p style="font-size:12px;color:#6A7A6E">GreenCareers · green-careers.de · <a href="{{unsubscribeUrl}}" style="color:#6A7A6E">Keine weiteren E-Mails erhalten</a></p>
</div>
```

**Text:**
```
Hallo {{firstName}},

eine Baustelle, die stillsteht, weil die Kolonne unterbesetzt ist, kostet jeden Tag Geld – Vertragsstrafen, verschobene Folgeaufträge, Überstunden. Die unbesetzte Stelle ist selten das Problem, die Folgekosten sind es.

GreenCareers ist ein Karrierenetzwerk für den Straßen- & Tiefbau: planbar qualifizierte Fachkräfte – Baugeräteführer, Rohrleitungsbauer, Poliere – aus Ihrer Region, geprüft und vorqualifiziert.

Was das heißt: weniger Leerlauf, planbarer Nachschub statt Last-Minute-Suche, ein Bewerberfluss, der nicht abreißt.

15 Minuten, kostenlos und unverbindlich? Termin: {{cta_url}}

Beste Grüße
Ihr GreenCareers-Team

Abmelden: {{unsubscribeUrl}}
```

---

## 3 · B2B-Neukunde · Landwirtschaft

**Betreff:** Wenn zur Saison genau die Leute fehlen
**Varianten:** „Melker, Schlepperfahrer, Betriebshelfer – gefunden" · „Personal für den Hof, bevor es eng wird"
**Preheader:** Saisonspitzen sind planbar – Ihr Personal sollte es auch sein.

```html
<div style="max-width:600px;margin:0 auto;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#17231A;font-size:16px;line-height:1.6">
  <p>Hallo {{firstName}},</p>
  <p>in der Landwirtschaft kommt die Arbeit nicht gleichmäßig – sie kommt in Spitzen. Und genau dann, wenn jede Hand zählt, ist niemand zu finden. Das ist kein Zufall, sondern ein Struktur­problem: Gute Leute für Hof, Stall und Technik erreichen die Betriebe kaum noch über die üblichen Wege.</p>
  <p>GreenCareers ist ein <strong>Karrierenetzwerk</strong> für die grüne Branche – von Landwirtschaft über Landtechnik bis Tierwirtschaft. Wir bringen Betriebe planbar mit qualifizierten Kräften aus ihrer Region zusammen: Melker, Schlepper- und Maschinenführer, Betriebshelfer, Fachkräfte Agrarservice.</p>
  <p style="background:#FBF3E0;border-radius:12px;padding:14px 16px;margin:22px 0">
    <strong>Was das für Sie heißt:</strong> Personal, das da ist, bevor die Saison losgeht – statt hektischer Suche mittendrin. Geprüfte Kandidaten, die zur Arbeit auf dem Hof passen.
  </p>
  <p>Sollen wir kurz sprechen, wie das für Ihren Betrieb aussehen würde? 15 Minuten, kostenlos.</p>
  <p style="text-align:center;margin:28px 0">
    <a href="{{cta_url}}" style="display:inline-block;background:#CA8A04;color:#fff;text-decoration:none;font-weight:700;padding:14px 30px;border-radius:10px">Kostenloses Erstgespräch sichern</a>
  </p>
  <p>Beste Grüße<br>Ihr GreenCareers-Team</p>
  <hr style="border:none;border-top:1px solid #E9ECE8;margin:26px 0 14px">
  <p style="font-size:12px;color:#6A7A6E">GreenCareers · green-careers.de · <a href="{{unsubscribeUrl}}" style="color:#6A7A6E">Keine weiteren E-Mails erhalten</a></p>
</div>
```

**Text:**
```
Hallo {{firstName}},

in der Landwirtschaft kommt die Arbeit in Spitzen – und genau dann ist niemand zu finden. Gute Leute für Hof, Stall und Technik erreichen die Betriebe kaum noch über die üblichen Wege.

GreenCareers ist ein Karrierenetzwerk für die grüne Branche: planbar qualifizierte Kräfte aus Ihrer Region – Melker, Schlepper- und Maschinenführer, Betriebshelfer, Agrarservice.

Was das heißt: Personal, das da ist, bevor die Saison losgeht – geprüft und passend.

15 Minuten, kostenlos? Termin: {{cta_url}}

Beste Grüße
Ihr GreenCareers-Team

Abmelden: {{unsubscribeUrl}}
```

---

## 4 · B2B-Bestandskunde · GaLaBau

**Betreff:** So holen Sie mehr aus Ihren GreenCareers-Bewerbern
**Varianten:** „3 Handgriffe für schnellere Zusagen" · „Ihre Kolonne voll – schneller besetzt"
**Preheader:** Ein kurzer Praxis-Tipp, der Ihre Besetzungszeit spürbar senkt.

```html
<div style="max-width:600px;margin:0 auto;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#17231A;font-size:16px;line-height:1.6">
  <p>Hallo {{firstName}},</p>
  <p>Sie nutzen GreenCareers bereits – schön, dass Sie dabei sind. Ein Tipp aus der Praxis, der bei anderen GaLaBau-Betrieben die Besetzungszeit deutlich verkürzt hat: <strong>Geschwindigkeit schlägt alles.</strong></p>
  <p>Wer sich im grünen Bereich bewirbt, hat oft mehrere Eisen im Feuer. Die drei wirksamsten Handgriffe:</p>
  <ol>
    <li><strong>Innerhalb von 24 Stunden anrufen</strong> – nicht mailen. Ein Anruf am selben Tag verdoppelt die Zusagequote.</li>
    <li><strong>Probetag statt langem Prozess</strong> – im Handwerk zählt „zeigen" mehr als „bewerben".</li>
    <li><strong>Klare Ansage zum Verdienst</strong> gleich im Erstkontakt – das filtert und bindet.</li>
  </ol>
  <p style="background:#EAF7EF;border-radius:12px;padding:14px 16px;margin:22px 0">Übrigens: Haben Sie schon weitere Stellen hinterlegt? Mehr aktive Suchen = mehr passende Bewerber im gleichen Zeitraum.</p>
  <p style="text-align:center;margin:28px 0">
    <a href="{{cta_url}}" style="display:inline-block;background:#16A34A;color:#fff;text-decoration:none;font-weight:700;padding:14px 30px;border-radius:10px">Zu meinen Stellen</a>
  </p>
  <p>Beste Grüße<br>Ihr GreenCareers-Team</p>
  <hr style="border:none;border-top:1px solid #E9ECE8;margin:26px 0 14px">
  <p style="font-size:12px;color:#6A7A6E">GreenCareers · green-careers.de · <a href="{{unsubscribeUrl}}" style="color:#6A7A6E">Keine weiteren E-Mails erhalten</a></p>
</div>
```

**Text:**
```
Hallo {{firstName}},

Sie nutzen GreenCareers bereits – ein Praxis-Tipp, der die Besetzungszeit deutlich senkt: Geschwindigkeit schlägt alles.

1. Innerhalb von 24 Stunden anrufen, nicht mailen – verdoppelt die Zusagequote.
2. Probetag statt langem Prozess – im Handwerk zählt „zeigen".
3. Klare Ansage zum Verdienst im Erstkontakt – filtert und bindet.

Übrigens: Mehr aktive Stellen = mehr passende Bewerber im gleichen Zeitraum. Zu Ihren Stellen: {{cta_url}}

Beste Grüße
Ihr GreenCareers-Team

Abmelden: {{unsubscribeUrl}}
```

---

## 5 · B2B-Bestandskunde · Straßen- & Tiefbau

**Betreff:** Schneller besetzen: 3 Dinge, die Tiefbau-Betriebe unterschätzen
**Varianten:** „Ihre Baustelle voll – ohne langes Warten" · „Zusage statt Absage: so klappt's"
**Preheader:** Kleiner Prozess-Kniff, große Wirkung auf Ihre Besetzungszeit.

```html
<div style="max-width:600px;margin:0 auto;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#17231A;font-size:16px;line-height:1.6">
  <p>Hallo {{firstName}},</p>
  <p>danke, dass Sie mit GreenCareers arbeiten. Ein Tipp, der im Tiefbau den Unterschied macht: Die besten Facharbeiter und Baugeräteführer sind schnell wieder vom Markt. Wer zuerst und konkret reagiert, gewinnt.</p>
  <ol>
    <li><strong>Am selben Tag anrufen</strong> – kurz, direkt, mit klarer nächster Aktion (Probetag/Termin).</li>
    <li><strong>Konkret werden</strong>: Baustelle, Gerät, Schicht, Verdienst – Facharbeiter wollen wissen, woran sie sind.</li>
    <li><strong>Kurze Wege</strong>: eine Entscheidung, nicht drei Gesprächsrunden.</li>
  </ol>
  <p style="background:#FFF3EC;border-radius:12px;padding:14px 16px;margin:22px 0">Mehrere Gewerke offen? Legen Sie zusätzliche Stellen an – jede aktive Suche zieht eigene Bewerber.</p>
  <p style="text-align:center;margin:28px 0">
    <a href="{{cta_url}}" style="display:inline-block;background:#EA580C;color:#fff;text-decoration:none;font-weight:700;padding:14px 30px;border-radius:10px">Zu meinen Stellen</a>
  </p>
  <p>Beste Grüße<br>Ihr GreenCareers-Team</p>
  <hr style="border:none;border-top:1px solid #E9ECE8;margin:26px 0 14px">
  <p style="font-size:12px;color:#6A7A6E">GreenCareers · green-careers.de · <a href="{{unsubscribeUrl}}" style="color:#6A7A6E">Keine weiteren E-Mails erhalten</a></p>
</div>
```

**Text:**
```
Hallo {{firstName}},

danke, dass Sie mit GreenCareers arbeiten. Die besten Facharbeiter und Baugeräteführer sind schnell wieder vom Markt – wer zuerst und konkret reagiert, gewinnt.

1. Am selben Tag anrufen – kurz, direkt, mit klarer nächster Aktion.
2. Konkret werden: Baustelle, Gerät, Schicht, Verdienst.
3. Kurze Wege: eine Entscheidung, nicht drei Runden.

Mehrere Gewerke offen? Zusätzliche Stellen anlegen – jede Suche zieht eigene Bewerber. {{cta_url}}

Beste Grüße
Ihr GreenCareers-Team

Abmelden: {{unsubscribeUrl}}
```

---

## 6 · B2B-Bestandskunde · Landwirtschaft

**Betreff:** Vor der Saison besetzen – nicht mittendrin
**Varianten:** „So bleibt der Hof handlungsfähig" · „Ihre offenen Stellen, rechtzeitig gefüllt"
**Preheader:** Ein Tipp, damit Ihnen zur Spitze nicht die Leute fehlen.

```html
<div style="max-width:600px;margin:0 auto;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#17231A;font-size:16px;line-height:1.6">
  <p>Hallo {{firstName}},</p>
  <p>schön, dass Sie GreenCareers nutzen. Der wirksamste Hebel in der Landwirtschaft ist <strong>Timing</strong>: Wer erst sucht, wenn die Spitze da ist, sucht zu spät. Besetzen Sie vor, nicht während der Saison.</p>
  <ol>
    <li><strong>Frühzeitig Stellen aktiv halten</strong> – auch wenn es gerade noch läuft.</li>
    <li><strong>Schnell zurückmelden</strong> – gute Betriebshelfer und Maschinenführer sind rar und schnell weg.</li>
    <li><strong>Konkret sein</strong>: Aufgaben, Arbeitszeiten, Verdienst offen ansprechen.</li>
  </ol>
  <p style="background:#FBF3E0;border-radius:12px;padding:14px 16px;margin:22px 0">Planen Sie schon die nächste Spitze? Legen Sie die Stelle jetzt an – dann ist die Kraft da, wenn Sie sie brauchen.</p>
  <p style="text-align:center;margin:28px 0">
    <a href="{{cta_url}}" style="display:inline-block;background:#CA8A04;color:#fff;text-decoration:none;font-weight:700;padding:14px 30px;border-radius:10px">Zu meinen Stellen</a>
  </p>
  <p>Beste Grüße<br>Ihr GreenCareers-Team</p>
  <hr style="border:none;border-top:1px solid #E9ECE8;margin:26px 0 14px">
  <p style="font-size:12px;color:#6A7A6E">GreenCareers · green-careers.de · <a href="{{unsubscribeUrl}}" style="color:#6A7A6E">Keine weiteren E-Mails erhalten</a></p>
</div>
```

**Text:**
```
Hallo {{firstName}},

schön, dass Sie GreenCareers nutzen. Der wirksamste Hebel in der Landwirtschaft ist Timing: vor der Saison besetzen, nicht mittendrin.

1. Frühzeitig Stellen aktiv halten.
2. Schnell zurückmelden – gute Leute sind rar und schnell weg.
3. Konkret sein: Aufgaben, Arbeitszeiten, Verdienst.

Nächste Spitze in Sicht? Stelle jetzt anlegen. {{cta_url}}

Beste Grüße
Ihr GreenCareers-Team

Abmelden: {{unsubscribeUrl}}
```

---

## 7 · Bewerber · Alle (branchenübergreifend, „du")

**Betreff:** Suchst du noch – oder wartest du nur ab?
**Varianten:** „Dein nächster Job zahlt vielleicht mehr" · „Arbeitgeber des Monats – das könnte deiner sein"
**Preheader:** Neue Stellen, ehrliche Gehälter, ein Betrieb, der dich wirklich will.

```html
<div style="max-width:600px;margin:0 auto;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#17231A;font-size:16px;line-height:1.6">
  <p>Hi {{firstName}},</p>
  <p>Hand aufs Herz: Läuft dein Job gerade wirklich rund – oder hast du dich nur dran gewöhnt? Viele bleiben, weil Wechseln anstrengend klingt. Dabei geht genau das bei uns in wenigen Minuten.</p>
  <p><strong>Warum es sich gerade lohnt, sich umzuschauen:</strong></p>
  <ul>
    <li>Betriebe suchen händeringend – das heißt für dich: bessere Karten bei Gehalt und Bedingungen.</li>
    <li>Kurze Wege statt endloser Bewerbungsprozesse.</li>
    <li>Du siehst vorher, wer der Arbeitgeber wirklich ist – kein Blindflug.</li>
  </ul>
  <p style="background:#EAF7EF;border-radius:12px;padding:14px 16px;margin:22px 0">
    <strong>Arbeitgeber des Monats:</strong> Ein Betrieb aus unserem Netzwerk, der fair zahlt, sein Team hält und gerade Leute sucht. Schau ihn dir an – vielleicht ist das dein nächster Schritt.
  </p>
  <p><strong>Kurz-Tipp fürs mehr Gehalt:</strong> Frag im Erstgespräch konkret nach Zuschlägen, Fahrtzeit und Weiterbildung – nicht nur nach dem Stundenlohn. Das Gesamtpaket macht oft den größeren Unterschied.</p>
  <p style="text-align:center;margin:28px 0">
    <a href="{{cta_url}}" style="display:inline-block;background:#16A34A;color:#fff;text-decoration:none;font-weight:700;padding:14px 30px;border-radius:10px">Passende Stellen ansehen</a>
  </p>
  <p>Viel Erfolg –<br>dein GreenCareers-Team</p>
  <hr style="border:none;border-top:1px solid #E9ECE8;margin:26px 0 14px">
  <p style="font-size:12px;color:#6A7A6E">GreenCareers · green-careers.de · <a href="{{unsubscribeUrl}}" style="color:#6A7A6E">Keine weiteren E-Mails erhalten</a></p>
</div>
```

**Text:**
```
Hi {{firstName}},

Hand aufs Herz: Läuft dein Job gerade wirklich rund – oder hast du dich nur dran gewöhnt?

Warum es sich lohnt, sich umzuschauen:
- Betriebe suchen händeringend – bessere Karten für dich bei Gehalt und Bedingungen.
- Kurze Wege statt endloser Bewerbungsprozesse.
- Du siehst vorher, wer der Arbeitgeber wirklich ist.

Arbeitgeber des Monats: ein Betrieb aus unserem Netzwerk, der fair zahlt, sein Team hält und gerade sucht.

Gehalts-Tipp: Frag konkret nach Zuschlägen, Fahrtzeit und Weiterbildung – nicht nur nach dem Stundenlohn.

Passende Stellen: {{cta_url}}

Viel Erfolg – dein GreenCareers-Team

Abmelden: {{unsubscribeUrl}}
```
