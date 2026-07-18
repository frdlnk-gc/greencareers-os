-- =========================================================
-- GreenCareers · Seed — fertige Newsletter-Kampagnen + Leadmagneten
-- Voraussetzung: supabase-schema-v20-newsletter.sql wurde ausgefuehrt.
-- Idempotent (loescht vorher die gleichnamigen Seed-Eintraege).
--
-- Was das macht:
--  1) Legt die 7 freigegebenen Kampagnen-Inhalte an (newsletter_campaigns)
--     -> im Cockpit direkt sichtbar/kontrollierbar, Betreff+HTML+Text fertig.
--  2) Legt Leadmagneten fuer die INBOUND-Zielgruppen an (3x B2B-Neukunde je
--     Branche + 1x Bewerber). Bestandskunden kommen per Import (s. unten), nicht
--     ueber eine Landingpage.
--
-- NACH dem Anlegen der Lemlist-Kampagnen: die echten Kampagnen-IDs eintragen
--  (Cockpit -> Leadmagneten, oder per UPDATE unten). Solange 'REPLACE_...'
--  drinsteht, laeuft noch nichts nach Lemlist – genau so gewollt (erst pruefen).
-- =========================================================

-- ---------- 1) Kampagnen-Inhalte (freigegeben) ----------
delete from public.newsletter_campaigns where meta->>'seed' = 'v20';

insert into public.newsletter_campaigns (title, audience, theme, subject, preheader, body_html, body_text, status, generated_by_ai, approved_at, meta) values
(
 'Newsletter · B2B Neukunde · GaLaBau', 'b2b_neukunde', 'galabau',
 'Diese Woche hätten 3 Landschaftsgärtner zu Ihnen gepasst',
 'Warum qualifizierte Bewerber am Betrieb vorbeilaufen – und was planbar hilft.',
 $h$<div style="max-width:600px;margin:0 auto;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#17231A;font-size:16px;line-height:1.6"><p>Hallo {{firstName}},</p><p>die Saison läuft, die Auftragsbücher sind voll – und trotzdem fehlt an allen Ecken die Fachkraft. Das Problem ist selten, dass es keine guten Landschaftsgärtner gibt. Sie erreichen Ihren Betrieb nur nicht.</p><p>Genau da setzt GreenCareers an. Wir sind ein <strong>Karrierenetzwerk</strong> für den grünen Bereich und bringen Betriebe planbar mit qualifizierten Fachkräften aus ihrer Region zusammen – keine anonymen Massenanzeigen, sondern geprüfte Kandidaten, die zu Ihrem Gewerk passen.</p><p style="background:#EAF7EF;border-radius:12px;padding:14px 16px;margin:22px 0"><strong>Was das für Sie heißt:</strong> vorqualifizierte Bewerber statt Zettelwirtschaft, weniger unbesetzte Kolonnen, kalkulierbarer Nachschub.</p><p>Wollen wir 15 Minuten sprechen, wie das für <em>Ihren</em> Betrieb aussehen würde? Unverbindlich, kostenlos.</p><p style="text-align:center;margin:28px 0"><a href="{{cta_url}}" style="display:inline-block;background:#16A34A;color:#fff;text-decoration:none;font-weight:700;padding:14px 30px;border-radius:10px">Kostenloses Erstgespräch sichern</a></p><p>Beste Grüße<br>Ihr GreenCareers-Team</p><hr style="border:none;border-top:1px solid #E9ECE8;margin:26px 0 14px"><p style="font-size:12px;color:#6A7A6E">GreenCareers · green-careers.de · <a href="{{unsubscribeUrl}}" style="color:#6A7A6E">Keine weiteren E-Mails erhalten</a></p></div>$h$,
 $t$Hallo {{firstName}},

die Saison läuft, die Auftragsbücher sind voll – und trotzdem fehlt die Fachkraft. Sie erreichen Ihren Betrieb nur nicht.

GreenCareers ist ein Karrierenetzwerk für den grünen Bereich: planbar qualifizierte Fachkräfte aus Ihrer Region, geprüft statt Massenanzeige.

15 Minuten, unverbindlich und kostenlos? Termin: {{cta_url}}

Beste Grüße, Ihr GreenCareers-Team
Abmelden: {{unsubscribeUrl}}$t$,
 'freigegeben', true, now(), '{"seed":"v20"}'
),
(
 'Newsletter · B2B Neukunde · Tiefbau', 'b2b_neukunde', 'tiefbau',
 'Unterbesetzte Kolonne? Das kostet mehr als eine Stelle',
 'Verzögerte Baustellen sind teurer als jede Recruiting-Investition.',
 $h$<div style="max-width:600px;margin:0 auto;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#17231A;font-size:16px;line-height:1.6"><p>Hallo {{firstName}},</p><p>eine Baustelle, die stillsteht, weil die Kolonne unterbesetzt ist, kostet Sie jeden Tag Geld – Vertragsstrafen, verschobene Folgeaufträge, Überstunden. Eine unbesetzte Stelle ist selten das Problem. Die Folgekosten sind es.</p><p>GreenCareers ist ein <strong>Karrierenetzwerk</strong> für den Straßen- & Tiefbau: planbar qualifizierte Fachkräfte – Baugeräteführer, Rohrleitungsbauer, Poliere – aus Ihrer Region, geprüft und vorqualifiziert.</p><p style="background:#FFF3EC;border-radius:12px;padding:14px 16px;margin:22px 0"><strong>Was das für Sie heißt:</strong> weniger Leerlauf, planbarer Nachschub statt Last-Minute-Suche, ein Bewerberfluss, der nicht abreißt.</p><p>15 Minuten am Telefon, wie das bei Ihnen laufen könnte? Kostenlos und unverbindlich.</p><p style="text-align:center;margin:28px 0"><a href="{{cta_url}}" style="display:inline-block;background:#EA580C;color:#fff;text-decoration:none;font-weight:700;padding:14px 30px;border-radius:10px">Kostenloses Erstgespräch sichern</a></p><p>Beste Grüße<br>Ihr GreenCareers-Team</p><hr style="border:none;border-top:1px solid #E9ECE8;margin:26px 0 14px"><p style="font-size:12px;color:#6A7A6E">GreenCareers · green-careers.de · <a href="{{unsubscribeUrl}}" style="color:#6A7A6E">Keine weiteren E-Mails erhalten</a></p></div>$h$,
 $t$Hallo {{firstName}},

eine unterbesetzte Baustelle kostet jeden Tag: Vertragsstrafen, verschobene Folgeaufträge, Überstunden. Die unbesetzte Stelle ist selten das Problem, die Folgekosten sind es.

GreenCareers ist ein Karrierenetzwerk für den Straßen- & Tiefbau: planbar qualifizierte Fachkräfte aus Ihrer Region, geprüft.

15 Minuten, kostenlos? Termin: {{cta_url}}

Beste Grüße, Ihr GreenCareers-Team
Abmelden: {{unsubscribeUrl}}$t$,
 'freigegeben', true, now(), '{"seed":"v20"}'
),
(
 'Newsletter · B2B Neukunde · Landwirtschaft', 'b2b_neukunde', 'landwirtschaft',
 'Wenn zur Saison genau die Leute fehlen',
 'Saisonspitzen sind planbar – Ihr Personal sollte es auch sein.',
 $h$<div style="max-width:600px;margin:0 auto;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#17231A;font-size:16px;line-height:1.6"><p>Hallo {{firstName}},</p><p>in der Landwirtschaft kommt die Arbeit in Spitzen – und genau dann ist niemand zu finden. Gute Leute für Hof, Stall und Technik erreichen die Betriebe kaum noch über die üblichen Wege.</p><p>GreenCareers ist ein <strong>Karrierenetzwerk</strong> für die grüne Branche: planbar qualifizierte Kräfte aus Ihrer Region – Melker, Schlepper- und Maschinenführer, Betriebshelfer, Agrarservice.</p><p style="background:#FBF3E0;border-radius:12px;padding:14px 16px;margin:22px 0"><strong>Was das für Sie heißt:</strong> Personal, das da ist, bevor die Saison losgeht – geprüft und passend.</p><p>Sollen wir kurz sprechen, wie das für Ihren Betrieb aussehen würde? 15 Minuten, kostenlos.</p><p style="text-align:center;margin:28px 0"><a href="{{cta_url}}" style="display:inline-block;background:#CA8A04;color:#fff;text-decoration:none;font-weight:700;padding:14px 30px;border-radius:10px">Kostenloses Erstgespräch sichern</a></p><p>Beste Grüße<br>Ihr GreenCareers-Team</p><hr style="border:none;border-top:1px solid #E9ECE8;margin:26px 0 14px"><p style="font-size:12px;color:#6A7A6E">GreenCareers · green-careers.de · <a href="{{unsubscribeUrl}}" style="color:#6A7A6E">Keine weiteren E-Mails erhalten</a></p></div>$h$,
 $t$Hallo {{firstName}},

in der Landwirtschaft kommt die Arbeit in Spitzen – und dann ist niemand zu finden.

GreenCareers ist ein Karrierenetzwerk für die grüne Branche: planbar qualifizierte Kräfte aus Ihrer Region – Melker, Maschinenführer, Betriebshelfer.

Personal, das da ist, bevor die Saison losgeht. 15 Minuten, kostenlos? Termin: {{cta_url}}

Beste Grüße, Ihr GreenCareers-Team
Abmelden: {{unsubscribeUrl}}$t$,
 'freigegeben', true, now(), '{"seed":"v20"}'
),
(
 'Newsletter · B2B Bestand · GaLaBau', 'b2b_bestandskunde', 'galabau',
 'So holen Sie mehr aus Ihren GreenCareers-Bewerbern',
 'Ein kurzer Praxis-Tipp, der Ihre Besetzungszeit spürbar senkt.',
 $h$<div style="max-width:600px;margin:0 auto;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#17231A;font-size:16px;line-height:1.6"><p>Hallo {{firstName}},</p><p>Sie nutzen GreenCareers bereits – ein Tipp aus der Praxis, der die Besetzungszeit deutlich verkürzt: <strong>Geschwindigkeit schlägt alles.</strong></p><ol><li><strong>Innerhalb von 24 Stunden anrufen</strong> – nicht mailen. Verdoppelt die Zusagequote.</li><li><strong>Probetag statt langem Prozess</strong> – im Handwerk zählt „zeigen".</li><li><strong>Klare Ansage zum Verdienst</strong> gleich im Erstkontakt – filtert und bindet.</li></ol><p style="background:#EAF7EF;border-radius:12px;padding:14px 16px;margin:22px 0">Haben Sie schon weitere Stellen hinterlegt? Mehr aktive Suchen = mehr passende Bewerber.</p><p style="text-align:center;margin:28px 0"><a href="{{cta_url}}" style="display:inline-block;background:#16A34A;color:#fff;text-decoration:none;font-weight:700;padding:14px 30px;border-radius:10px">Zu meinen Stellen</a></p><p>Beste Grüße<br>Ihr GreenCareers-Team</p><hr style="border:none;border-top:1px solid #E9ECE8;margin:26px 0 14px"><p style="font-size:12px;color:#6A7A6E">GreenCareers · green-careers.de · <a href="{{unsubscribeUrl}}" style="color:#6A7A6E">Keine weiteren E-Mails erhalten</a></p></div>$h$,
 $t$Hallo {{firstName}},

ein Praxis-Tipp, der die Besetzungszeit senkt: Geschwindigkeit schlägt alles.
1. Innerhalb 24 h anrufen, nicht mailen.
2. Probetag statt langem Prozess.
3. Klare Ansage zum Verdienst.

Mehr aktive Stellen = mehr Bewerber. Zu Ihren Stellen: {{cta_url}}

Beste Grüße, Ihr GreenCareers-Team
Abmelden: {{unsubscribeUrl}}$t$,
 'freigegeben', true, now(), '{"seed":"v20"}'
),
(
 'Newsletter · B2B Bestand · Tiefbau', 'b2b_bestandskunde', 'tiefbau',
 'Schneller besetzen: 3 Dinge, die Tiefbau-Betriebe unterschätzen',
 'Kleiner Prozess-Kniff, große Wirkung auf Ihre Besetzungszeit.',
 $h$<div style="max-width:600px;margin:0 auto;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#17231A;font-size:16px;line-height:1.6"><p>Hallo {{firstName}},</p><p>danke, dass Sie mit GreenCareers arbeiten. Die besten Facharbeiter und Baugeräteführer sind schnell wieder vom Markt – wer zuerst und konkret reagiert, gewinnt.</p><ol><li><strong>Am selben Tag anrufen</strong> – kurz, direkt, mit klarer nächster Aktion.</li><li><strong>Konkret werden</strong>: Baustelle, Gerät, Schicht, Verdienst.</li><li><strong>Kurze Wege</strong>: eine Entscheidung, nicht drei Runden.</li></ol><p style="background:#FFF3EC;border-radius:12px;padding:14px 16px;margin:22px 0">Mehrere Gewerke offen? Zusätzliche Stellen anlegen – jede Suche zieht eigene Bewerber.</p><p style="text-align:center;margin:28px 0"><a href="{{cta_url}}" style="display:inline-block;background:#EA580C;color:#fff;text-decoration:none;font-weight:700;padding:14px 30px;border-radius:10px">Zu meinen Stellen</a></p><p>Beste Grüße<br>Ihr GreenCareers-Team</p><hr style="border:none;border-top:1px solid #E9ECE8;margin:26px 0 14px"><p style="font-size:12px;color:#6A7A6E">GreenCareers · green-careers.de · <a href="{{unsubscribeUrl}}" style="color:#6A7A6E">Keine weiteren E-Mails erhalten</a></p></div>$h$,
 $t$Hallo {{firstName}},

die besten Facharbeiter sind schnell wieder vom Markt – wer zuerst und konkret reagiert, gewinnt.
1. Am selben Tag anrufen.
2. Konkret werden: Baustelle, Gerät, Schicht, Verdienst.
3. Kurze Wege: eine Entscheidung.

Mehrere Gewerke offen? Zusätzliche Stellen anlegen. {{cta_url}}

Beste Grüße, Ihr GreenCareers-Team
Abmelden: {{unsubscribeUrl}}$t$,
 'freigegeben', true, now(), '{"seed":"v20"}'
),
(
 'Newsletter · B2B Bestand · Landwirtschaft', 'b2b_bestandskunde', 'landwirtschaft',
 'Vor der Saison besetzen – nicht mittendrin',
 'Ein Tipp, damit Ihnen zur Spitze nicht die Leute fehlen.',
 $h$<div style="max-width:600px;margin:0 auto;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#17231A;font-size:16px;line-height:1.6"><p>Hallo {{firstName}},</p><p>schön, dass Sie GreenCareers nutzen. Der wirksamste Hebel in der Landwirtschaft ist <strong>Timing</strong>: vor der Saison besetzen, nicht mittendrin.</p><ol><li><strong>Frühzeitig Stellen aktiv halten</strong> – auch wenn es gerade noch läuft.</li><li><strong>Schnell zurückmelden</strong> – gute Leute sind rar und schnell weg.</li><li><strong>Konkret sein</strong>: Aufgaben, Arbeitszeiten, Verdienst.</li></ol><p style="background:#FBF3E0;border-radius:12px;padding:14px 16px;margin:22px 0">Planen Sie schon die nächste Spitze? Legen Sie die Stelle jetzt an.</p><p style="text-align:center;margin:28px 0"><a href="{{cta_url}}" style="display:inline-block;background:#CA8A04;color:#fff;text-decoration:none;font-weight:700;padding:14px 30px;border-radius:10px">Zu meinen Stellen</a></p><p>Beste Grüße<br>Ihr GreenCareers-Team</p><hr style="border:none;border-top:1px solid #E9ECE8;margin:26px 0 14px"><p style="font-size:12px;color:#6A7A6E">GreenCareers · green-careers.de · <a href="{{unsubscribeUrl}}" style="color:#6A7A6E">Keine weiteren E-Mails erhalten</a></p></div>$h$,
 $t$Hallo {{firstName}},

der wirksamste Hebel in der Landwirtschaft ist Timing: vor der Saison besetzen.
1. Frühzeitig Stellen aktiv halten.
2. Schnell zurückmelden.
3. Konkret sein: Aufgaben, Arbeitszeiten, Verdienst.

Nächste Spitze in Sicht? Stelle jetzt anlegen. {{cta_url}}

Beste Grüße, Ihr GreenCareers-Team
Abmelden: {{unsubscribeUrl}}$t$,
 'freigegeben', true, now(), '{"seed":"v20"}'
),
(
 'Newsletter · Bewerber · Alle', 'bewerber', null,
 'Suchst du noch – oder wartest du nur ab?',
 'Neue Stellen, ehrliche Gehälter, ein Betrieb, der dich wirklich will.',
 $h$<div style="max-width:600px;margin:0 auto;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#17231A;font-size:16px;line-height:1.6"><p>Hi {{firstName}},</p><p>Hand aufs Herz: Läuft dein Job gerade wirklich rund – oder hast du dich nur dran gewöhnt? Viele bleiben, weil Wechseln anstrengend klingt. Bei uns geht genau das in wenigen Minuten.</p><p><strong>Warum es sich gerade lohnt, sich umzuschauen:</strong></p><ul><li>Betriebe suchen händeringend – bessere Karten für dich bei Gehalt und Bedingungen.</li><li>Kurze Wege statt endloser Bewerbungsprozesse.</li><li>Du siehst vorher, wer der Arbeitgeber wirklich ist.</li></ul><p style="background:#EAF7EF;border-radius:12px;padding:14px 16px;margin:22px 0"><strong>Arbeitgeber des Monats:</strong> ein Betrieb aus unserem Netzwerk, der fair zahlt, sein Team hält und gerade Leute sucht.</p><p><strong>Gehalts-Tipp:</strong> Frag im Erstgespräch konkret nach Zuschlägen, Fahrtzeit und Weiterbildung – nicht nur nach dem Stundenlohn. Das Gesamtpaket macht oft den Unterschied.</p><p style="text-align:center;margin:28px 0"><a href="{{cta_url}}" style="display:inline-block;background:#16A34A;color:#fff;text-decoration:none;font-weight:700;padding:14px 30px;border-radius:10px">Passende Stellen ansehen</a></p><p>Viel Erfolg –<br>dein GreenCareers-Team</p><hr style="border:none;border-top:1px solid #E9ECE8;margin:26px 0 14px"><p style="font-size:12px;color:#6A7A6E">GreenCareers · green-careers.de · <a href="{{unsubscribeUrl}}" style="color:#6A7A6E">Keine weiteren E-Mails erhalten</a></p></div>$h$,
 $t$Hi {{firstName}},

Läuft dein Job gerade wirklich rund – oder hast du dich nur dran gewöhnt?

Warum sich umschauen lohnt:
- Betriebe suchen händeringend – bessere Karten bei Gehalt und Bedingungen.
- Kurze Wege statt endloser Prozesse.
- Du siehst vorher, wer der Arbeitgeber wirklich ist.

Arbeitgeber des Monats: ein Betrieb, der fair zahlt und gerade sucht.
Gehalts-Tipp: nach Zuschlägen, Fahrtzeit und Weiterbildung fragen – nicht nur Stundenlohn.

Passende Stellen: {{cta_url}}

Viel Erfolg – dein GreenCareers-Team
Abmelden: {{unsubscribeUrl}}$t$,
 'freigegeben', true, now(), '{"seed":"v20"}'
);

-- ---------- 2) Leadmagneten (INBOUND: B2B-Neukunde je Branche + Bewerber) ----------
-- lemlist_campaign_id bleibt Platzhalter, bis die Lemlist-Kampagne existiert.
insert into public.newsletter_leadmagnets (slug, title, audience, theme, lemlist_campaign_id, consent_text, active) values
 ('b2b-neukunde-galabau',       'B2B Neukunde · GaLaBau',        'b2b_neukunde', 'galabau',        'REPLACE_LEMLIST_CAMPAIGN_ID', 'Ja, ich möchte den GreenCareers-Newsletter mit News und Angeboten per E-Mail erhalten. Abmeldung jederzeit über den Link in jeder E-Mail.', true),
 ('b2b-neukunde-tiefbau',       'B2B Neukunde · Tiefbau',        'b2b_neukunde', 'tiefbau',        'REPLACE_LEMLIST_CAMPAIGN_ID', 'Ja, ich möchte den GreenCareers-Newsletter mit News und Angeboten per E-Mail erhalten. Abmeldung jederzeit über den Link in jeder E-Mail.', true),
 ('b2b-neukunde-landwirtschaft','B2B Neukunde · Landwirtschaft', 'b2b_neukunde', 'landwirtschaft', 'REPLACE_LEMLIST_CAMPAIGN_ID', 'Ja, ich möchte den GreenCareers-Newsletter mit News und Angeboten per E-Mail erhalten. Abmeldung jederzeit über den Link in jeder E-Mail.', true),
 ('bewerber-alle',              'Bewerber · Alle',               'bewerber',     null,             'REPLACE_LEMLIST_CAMPAIGN_ID', 'Ja, schickt mir passende Jobs, Gehalts- und Bewerbungstipps per E-Mail. Abmeldung jederzeit über den Link in jeder E-Mail.', true)
on conflict (slug) do update set
  title = excluded.title, audience = excluded.audience, theme = excluded.theme, consent_text = excluded.consent_text, active = excluded.active, updated_at = now();

-- =========================================================
-- NACH dem Anlegen der Lemlist-Kampagnen: echte IDs setzen, z. B.
--   update public.newsletter_leadmagnets set lemlist_campaign_id='cam_xxx' where slug='b2b-neukunde-galabau';
--
-- Bestandskunden (kein Leadmagnet, kommen per Import) – Beispiel GaLaBau:
--   insert into public.newsletter_subscribers (email,name,audience,theme,quelle,status,consent_source,lemlist_campaign_id)
--   select lower(c.email), c.name, 'b2b_bestandskunde', c.theme, 'customers', 'active', 'bestandskunde_import', 'cam_bestand_galabau'
--   from public.customers c where c.email is not null and c.produkt is not null and c.theme='galabau'
--   on conflict (lower(email), audience) do nothing;
--
-- Bewerber-Import – Beispiel:
--   insert into public.newsletter_subscribers (email,name,audience,quelle,status,consent_source,lemlist_campaign_id,bewerber_id)
--   select lower(b.email), b.name, 'bewerber', 'bewerber', 'active', 'bewerber_import', 'cam_bewerber_alle', b.id
--   from public.bewerber b where b.email is not null
--   on conflict (lower(email), audience) do nothing;
-- =========================================================
