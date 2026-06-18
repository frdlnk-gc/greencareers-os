-- =========================================================
-- GreenCareers OS · Tiefbau-Portal · VOLLSTAENDIGE Stellen-Inhalte
-- In den Supabase SQL Editor + Run. IDEMPOTENT.
--
-- Quelle: green-careers.de Job-Detail-API (1:1 Inhalte der Tiefbau-/Strassenbau-
-- Stellen). Fuellt pro Stelle: Aufgaben, Profil, Benefits (+Liste), Ansprech-
-- partner inkl. Rolle/Foto/Mail/Telefon. Pro Betrieb: Ueber-uns, Mitarbeiterzahl,
-- Gruendungsjahr, Website, Karriereseite, Telefon, Socials, Titelbild, Logo.
--
-- GUARD: coalesce/nullif -> nur LEERE Felder werden gefuellt. Bereits gepflegte
-- Inhalte (z.B. IDH, manuell) bleiben unangetastet. JSONB-Spalten korrekt behandelt
-- (unternehmensbilder/benefits_list/social sind jsonb, KEINE arrays).
-- =========================================================

-- ===== Gebr. Donhauser Bau GmbH & Co.KG =====
update public.customers set
  ueber_uns          = coalesce(nullif(ueber_uns,''), 'Seit 1914 und in 4. Generation: Wir sind das Familienunternehmen Gebr. Donhauser. Als Baufirma mit Sitz in Schwandorf realisieren wir bayernweit Projekte im Tief und Hochbau, von Erschließungen bis Wohnbau. Mittlerweile gehören 170 Mitarbeitende zur #donhausercrew.'),
  mitarbeiter_anzahl = coalesce(nullif(mitarbeiter_anzahl,''), '170'),
  gruendungsjahr     = coalesce(nullif(gruendungsjahr,''), '1914'),
  website            = coalesce(nullif(website,''), 'https://www.donhauser.de/'),
  karriere_url       = coalesce(nullif(karriere_url,''), 'https://www.donhauser.de/stellenangebote/'),
  telefon            = coalesce(nullif(telefon,''), '+4994317220'),
  titelbild          = coalesce(nullif(titelbild,''), 'https://www.green-careers.de/storage/media/a15e574a-ea1f-4b08-b5c5-eebaabb237ee/cSLsj0Z2fo9QiEp8GaxI7wvfXIECLoOnrBvli4A4.png'),
  logo_url           = coalesce(nullif(logo_url,''), 'https://www.green-careers.de/storage/media/a15e574a-ac4c-439d-b1ae-b8569b069a3c/Pd31C1ckyr0zThfu72wY83tGd5nI666cpgWDuFpU.jpg'),
  social             = case when coalesce(social,'{}'::jsonb) = '{}'::jsonb then '{"instagram": "https://www.instagram.com/gebr.donhauser.bau/?hl=de", "linkedin": "https://www.linkedin.com/company/gebr-donhauser?originalSubdomain=de", "facebook": "https://www.facebook.com/gebr.donhauser.bau/", "tiktok": "https://www.tiktok.com/@gebr.donhauser.bau"}'::jsonb else social end,
  unternehmensbilder = case when jsonb_array_length(coalesce(unternehmensbilder,'[]'::jsonb))=0 then '["https://www.green-careers.de/storage/media/a15e574a-ea1f-4b08-b5c5-eebaabb237ee/cSLsj0Z2fo9QiEp8GaxI7wvfXIECLoOnrBvli4A4.png"]'::jsonb else unternehmensbilder end
where name = 'Gebr. Donhauser Bau GmbH & Co.KG';

update public.stellenanzeigen set
  aufgaben             = coalesce(nullif(aufgaben,''), 'Herstellen von Baugruben und Leitungsgräben
Verlegen von Rohrleitungen, Kabeln und Kanälen
Pflasterarbeiten sowie Setzen von Bordsteinen
Einbauen und Verdichten von Tragschichten und Asphalt
Bedienen von Baumaschinen und Baugeräten'),
  profil               = coalesce(nullif(profil,''), 'Abgeschlossene Ausbildung idealerweise im Bereich Tief-, Straßen-, Kanalbau oder alternativ mehrjährige Erfahrung im Bereich Tiefbau
idealerweise Kenntnisse im Bereich Erdbewegungsarbeiten, Baugeräteführung, Baumaschinenführung
Führerschein Klasse B'),
  benefits             = coalesce(nullif(benefits,''), 'Flache Hierarchien\nInterne Karrierechancen\nJobrad-Leasing\nMitarbeiter-Events (z.B. Teambuilding-Aktivitäten)\nRegelmäßige Firmenfeiern\nUnbefristeter Arbeitsvertrag\nVermögenswirksame Leistungen\nWeihnachtsgeld'),
  benefits_list        = case when jsonb_array_length(coalesce(benefits_list,'[]'::jsonb))=0 then '["Flache Hierarchien", "Interne Karrierechancen", "Jobrad-Leasing", "Mitarbeiter-Events (z.B. Teambuilding-Aktivitäten)", "Regelmäßige Firmenfeiern", "Unbefristeter Arbeitsvertrag", "Vermögenswirksame Leistungen", "Weihnachtsgeld"]'::jsonb else benefits_list end,
  ansprechpartner      = coalesce(nullif(ansprechpartner,''), 'Julia Hecht'),
  ansprechpartner_rolle= coalesce(nullif(ansprechpartner_rolle,''), 'Assistenz'),
  ansprechpartner_foto = coalesce(nullif(ansprechpartner_foto,''), null),
  kontakt_email        = coalesce(nullif(kontakt_email,''), 'julia.hecht@donhauser.de'),
  kontakt_telefon      = coalesce(nullif(kontakt_telefon,''), '+4994317220')
where customer_id = (select id from public.customers where name = 'Gebr. Donhauser Bau GmbH & Co.KG' limit 1);

-- ===== IDH-Innovative Dienstleistungen Habers GmbH =====
update public.customers set
  ueber_uns          = coalesce(nullif(ueber_uns,''), 'Du hast genug von anonymen Baustellen? Bei IDH Overath arbeitest du im Tiefbau in einem familiären Team mit direktem Draht zum Chef, kurzen Wegen und klarer Kommunikation. Hier zählen Verlässlichkeit, Zusammenhalt und ehrliche Zusammenarbeit.'),
  mitarbeiter_anzahl = coalesce(nullif(mitarbeiter_anzahl,''), '50'),
  gruendungsjahr     = coalesce(nullif(gruendungsjahr,''), '1995'),
  website            = coalesce(nullif(website,''), 'https://www.idh-koeln.de/'),
  karriere_url       = coalesce(nullif(karriere_url,''), 'https://www.idh-koeln.de/index.php/idh-karriere/'),
  telefon            = coalesce(nullif(telefon,''), '+4922198609600'),
  titelbild          = coalesce(nullif(titelbild,''), 'https://www.green-careers.de/storage/media/a1625beb-dbf2-4384-9681-e595ba99c32d/MTHXU8odUfdxRTj5vOCOFWM9GZlUfL6LDFY56PYh.jpg'),
  logo_url           = coalesce(nullif(logo_url,''), 'https://www.green-careers.de/storage/media/a1625be9-2446-42ba-a53a-c275e1c6c62e/Cwlw89sHbxYVHsX2Aa84PulhFKHThjaMyB78vSAe.jpg'),
  social             = case when coalesce(social,'{}'::jsonb) = '{}'::jsonb then '{"instagram": "https://www.instagram.com/idh_gmbh"}'::jsonb else social end,
  unternehmensbilder = case when jsonb_array_length(coalesce(unternehmensbilder,'[]'::jsonb))=0 then '["https://www.green-careers.de/storage/media/a1625beb-dbf2-4384-9681-e595ba99c32d/MTHXU8odUfdxRTj5vOCOFWM9GZlUfL6LDFY56PYh.jpg"]'::jsonb else unternehmensbilder end
where name = 'IDH-Innovative Dienstleistungen Habers GmbH';

update public.stellenanzeigen set
  aufgaben             = coalesce(nullif(aufgaben,''), '- Durchführung von Tiefbauarbeiten im Straßen-, Kanal- und Leitungsbau
- Erdarbeiten sowie Verlegen von Rohrleitungen und Kabeln
- Bedienung moderner Baumaschinen
- Baustellenvorbereitung und -absicherung
- Zusammenarbeit im Team auf wechselnden Baustellen'),
  profil               = coalesce(nullif(profil,''), '- Abgeschlossene Ausbildung im Straßen- und Tiefbau oder vergleichbare Erfahrung
- Handwerkliches Geschick und technisches Verständnis
- Teamfähigkeit und zuverlässige Arbeitsweise
- Führerschein Klasse B zwingend erforderlich, zusätzliche Klassen sind ein Plus, aber kein Muss
- Motivation und Einsatzbereitschaft'),
  benefits             = coalesce(nullif(benefits,''), 'Flache Hierarchien\nInterne Karrierechancen\nJobrad-Leasing\nUnbefristeter Arbeitsvertrag\nFreundliches Arbeitsklima\nStrukturierte Abläufe\nBetriebliche Altersvorsorge\nKeine Montageeinsätze mit Übernachtung\nKostenübernahme für berufliche Zertifizierungen\nRegelmäßige Firmenfeiern\nVermögenswirksame Leistungen\nWeihnachtsgeld'),
  benefits_list        = case when jsonb_array_length(coalesce(benefits_list,'[]'::jsonb))=0 then '["Flache Hierarchien", "Interne Karrierechancen", "Jobrad-Leasing", "Unbefristeter Arbeitsvertrag", "Freundliches Arbeitsklima", "Strukturierte Abläufe", "Betriebliche Altersvorsorge", "Keine Montageeinsätze mit Übernachtung", "Kostenübernahme für berufliche Zertifizierungen", "Regelmäßige Firmenfeiern", "Vermögenswirksame Leistungen", "Weihnachtsgeld"]'::jsonb else benefits_list end,
  ansprechpartner      = coalesce(nullif(ansprechpartner,''), 'Philipp Habers'),
  ansprechpartner_rolle= coalesce(nullif(ansprechpartner_rolle,''), 'Geschäftsführer'),
  ansprechpartner_foto = coalesce(nullif(ansprechpartner_foto,''), null),
  kontakt_email        = coalesce(nullif(kontakt_email,''), 'philipp.habers@idh-koeln.de'),
  kontakt_telefon      = coalesce(nullif(kontakt_telefon,''), '+492206905430')
where customer_id = (select id from public.customers where name = 'IDH-Innovative Dienstleistungen Habers GmbH' limit 1);

-- ===== Wilhelm Weier GmbH & Co. KG =====
update public.customers set
  ueber_uns          = coalesce(nullif(ueber_uns,''), 'Wir sind ein familiengeführtes Tiefbauunternehmen aus Duisburg (seit 1908) mit rund 30 Mitarbeitern. Wir stehen für Qualität, Effizienz und Teamgeist, flache Hierarchien sowie individuelle Weiterbildungsmöglichkeiten.'),
  mitarbeiter_anzahl = coalesce(nullif(mitarbeiter_anzahl,''), '30'),
  gruendungsjahr     = coalesce(nullif(gruendungsjahr,''), '1908'),
  website            = coalesce(nullif(website,''), 'https://wilhelm-weier-webseite.onepage.me/'),
  karriere_url       = coalesce(nullif(karriere_url,''), 'https://wilhelm-weier-webseite.onepage.me/'),
  telefon            = coalesce(nullif(telefon,''), '+49203701710'),
  titelbild          = coalesce(nullif(titelbild,''), 'https://www.green-careers.de/storage/media/a1984aad-59a8-4ba9-ba3b-577f869de7f8/izTTO6r3NghFeF8ovb3nSv9jz62TlWBUX1OdwBSB.jpg'),
  logo_url           = coalesce(nullif(logo_url,''), 'https://www.green-careers.de/storage/media/a1984aab-bedf-4554-9ecc-d6e8b6d140bc/TQi67MwceugJtBDpl4egJkBMHWQvNnUPB0Pw08vl.jpg'),
  social             = case when coalesce(social,'{}'::jsonb) = '{}'::jsonb then '{"instagram": "https://www.instagram.com/bauunternehmung_weier/", "facebook": "https://www.facebook.com/profile.php?id=61553606349712"}'::jsonb else social end,
  unternehmensbilder = case when jsonb_array_length(coalesce(unternehmensbilder,'[]'::jsonb))=0 then '["https://www.green-careers.de/storage/media/a1984aad-59a8-4ba9-ba3b-577f869de7f8/izTTO6r3NghFeF8ovb3nSv9jz62TlWBUX1OdwBSB.jpg"]'::jsonb else unternehmensbilder end
where name = 'Wilhelm Weier GmbH & Co. KG';

update public.stellenanzeigen set
  aufgaben             = coalesce(nullif(aufgaben,''), 'Ausschachten von Gräben
Verbau von Gräben
Einrichten, Sichern und Räumen von Baustellen
Verlegen von Rohren
Betonarbeiten
Bedienung von Baumaschinen'),
  profil               = coalesce(nullif(profil,''), 'Körperlich belastbar
Handwerklich geschickt
Teamfähig
Zuverlässig und eine selbstständige Arbeitsweise
Motiviert (auch für eine interne Weiterbildung)
Erfahrung im Tief-, Straßen- oder Kanalbau'),
  benefits             = coalesce(nullif(benefits,''), 'Betriebliche Altersvorsorge\nBetriebsausflüge\nFahrtkostenzuschuss\nFlache Hierarchien\nFreundliches Arbeitsklima\nGetränke-Flatrate\nInterne Karrierechancen\nJobrad-Leasing\nKeine Montageeinsätze mit Übernachtung\nKostenübernahme für berufliche Zertifizierungen\nKurzer Freitag\nMitarbeiter-Events (z.B. Teambuilding-Aktivitäten)\nRegelmäßige Firmenfeiern\nStrukturierte Abläufe\nUnbefristeter Arbeitsvertrag\nUnfallversicherung\nUrlaubsgeld\nVermögenswirksame Leistungen\nWeihnachtsgeld'),
  benefits_list        = case when jsonb_array_length(coalesce(benefits_list,'[]'::jsonb))=0 then '["Betriebliche Altersvorsorge", "Betriebsausflüge", "Fahrtkostenzuschuss", "Flache Hierarchien", "Freundliches Arbeitsklima", "Getränke-Flatrate", "Interne Karrierechancen", "Jobrad-Leasing", "Keine Montageeinsätze mit Übernachtung", "Kostenübernahme für berufliche Zertifizierungen", "Kurzer Freitag", "Mitarbeiter-Events (z.B. Teambuilding-Aktivitäten)", "Regelmäßige Firmenfeiern", "Strukturierte Abläufe", "Unbefristeter Arbeitsvertrag", "Unfallversicherung", "Urlaubsgeld", "Vermögenswirksame Leistungen", "Weihnachtsgeld"]'::jsonb else benefits_list end,
  ansprechpartner      = coalesce(nullif(ansprechpartner,''), 'Wolfgang Krallmann'),
  ansprechpartner_rolle= coalesce(nullif(ansprechpartner_rolle,''), 'Geschäftsführung'),
  ansprechpartner_foto = coalesce(nullif(ansprechpartner_foto,''), null),
  kontakt_email        = coalesce(nullif(kontakt_email,''), 'info@bauunternehmung-weier.de'),
  kontakt_telefon      = coalesce(nullif(kontakt_telefon,''), '+49203701710')
where customer_id = (select id from public.customers where name = 'Wilhelm Weier GmbH & Co. KG' limit 1);

-- ===== Ackers GmbH =====
update public.customers set
  ueber_uns          = coalesce(nullif(ueber_uns,''), 'Die Ackers GmbH ist ein etabliertes Unternehmen im Bereich der Verkehrstechnik mit Sitz in Kempen, Deutschland. Seit ihrer Gründung im Jahr 1979 hat sich die Firma als zuverlässiger Familienbetrieb im Handwerk positioniert.

Das Unternehmen konzentriert sich auf Dienstleistungen im Bereich Verkehrstechnik, mit einem besonderen Fokus auf Fahrbahnmarkierung, Fräsarbeiten, Beschilderung sowie Riss- und Schlaglochsanierung. Zudem werden auch Verkehrsleitelemente angeboten. Wir operieren vorwiegend im regionalen Markt von NRW, zu dem der Großraum um Düsseldorf, Mönchengladbach und Krefeld gehört.

Mit rund 19 Mitarbeitern bleibt die Ackers GmbH ein mittelständisches Unternehmen, das auf seine regionale Verwurzelung setzt. Die jahrelange Erfahrung machen es zu einem wichtigen Akteur in der Verkehrstechnikbranche.'),
  mitarbeiter_anzahl = coalesce(nullif(mitarbeiter_anzahl,''), '19'),
  gruendungsjahr     = coalesce(nullif(gruendungsjahr,''), '1979'),
  website            = coalesce(nullif(website,''), 'https://www.ackersgmbh.de'),
  karriere_url       = coalesce(nullif(karriere_url,''), null),
  telefon            = coalesce(nullif(telefon,''), '+4921522532'),
  titelbild          = coalesce(nullif(titelbild,''), 'https://www.green-careers.de/storage/media/a1c0c4e6-2b95-41f0-81a5-08bd8e23e34e/aY8XUcyz6vnxSN5nxUOnDgGGYnj60Dl2WEzfSxX1.jpg'),
  logo_url           = coalesce(nullif(logo_url,''), 'https://www.green-careers.de/storage/media/a1c0c4e4-74bc-48fd-8643-ff521cb5c617/UAY2vV2H9NyRmwoIrVKyLeLDPwahunWujbO2sc0l.jpg'),
  social             = case when coalesce(social,'{}'::jsonb) = '{}'::jsonb then '{}'::jsonb else social end,
  unternehmensbilder = case when jsonb_array_length(coalesce(unternehmensbilder,'[]'::jsonb))=0 then '["https://www.green-careers.de/storage/media/a1c0c4e6-2b95-41f0-81a5-08bd8e23e34e/aY8XUcyz6vnxSN5nxUOnDgGGYnj60Dl2WEzfSxX1.jpg"]'::jsonb else unternehmensbilder end
where name = 'Ackers GmbH';

update public.stellenanzeigen set
  aufgaben             = coalesce(nullif(aufgaben,''), 'Teamführung
zuverlässiges, selbständiges und wirtschaftliches umsetzen der Projekte
Kommunikation mit Kunden, Bauleitung, Kollegen'),
  profil               = coalesce(nullif(profil,''), 'zuverlässig
eigenständig
lösungsorientiert'),
  benefits             = coalesce(nullif(benefits,''), 'Anhängerführerschein Kostenübernahme\nBetriebliche Altersvorsorge\nFirmenhandy\nFreundliches Arbeitsklima\nKostenübernahme für berufliche Zertifizierungen\nStrukturierte Abläufe\nUnbefristeter Arbeitsvertrag\nUrlaubsgeld\nWeihnachtsgeld\nVermögenswirksame Leistungen\nJahresprämie'),
  benefits_list        = case when jsonb_array_length(coalesce(benefits_list,'[]'::jsonb))=0 then '["Anhängerführerschein Kostenübernahme", "Betriebliche Altersvorsorge", "Firmenhandy", "Freundliches Arbeitsklima", "Kostenübernahme für berufliche Zertifizierungen", "Strukturierte Abläufe", "Unbefristeter Arbeitsvertrag", "Urlaubsgeld", "Weihnachtsgeld", "Vermögenswirksame Leistungen", "Jahresprämie"]'::jsonb else benefits_list end,
  ansprechpartner      = coalesce(nullif(ansprechpartner,''), 'Philip Ackers'),
  ansprechpartner_rolle= coalesce(nullif(ansprechpartner_rolle,''), 'Geschäftsführer'),
  ansprechpartner_foto = coalesce(nullif(ansprechpartner_foto,''), null),
  kontakt_email        = coalesce(nullif(kontakt_email,''), 'mail@ackersgmbh.de'),
  kontakt_telefon      = coalesce(nullif(kontakt_telefon,''), '+4921522532')
where customer_id = (select id from public.customers where name = 'Ackers GmbH' limit 1);

-- ===== GPInfra Ingenieurgesellschaft PartG mbB =====
update public.customers set
  ueber_uns          = coalesce(nullif(ueber_uns,''), 'Die GPInfra Ingenieurgesellschaft PartG mbB ist ein Ingenieurbüro mit Sitz in Köln. Das Unternehmen wurde 2019 gegründet und beschäftigt derzeit rund 10 Mitarbeiter.

GPInfra konzentriert sich auf den Bereich Straßen-, Kanal- und Tiefbau. Zu den Hauptaufgaben gehören die Planung von Infrastrukturprojekten sowie die Überwachung der Bauausführung. Das Unternehmen bedient sowohl öffentliche Auftraggeber wie Städte und Kommunen, als auch private Unternehmen, was ein vielfältiges Tätigkeitsfeld innerhalb der Branche darstellt.

Der Standort in Köln ermöglicht GPInfra eng mit Kunden der Region zusammen zu arbeiten und innerhalb eines dynamischen Marktumfeldes zu agieren. Das Unternehmen nutzt die zentrale Lage, um im regionalen Infrastruktursektor effektiv tätig zu sein.'),
  mitarbeiter_anzahl = coalesce(nullif(mitarbeiter_anzahl,''), '10'),
  gruendungsjahr     = coalesce(nullif(gruendungsjahr,''), '2019'),
  website            = coalesce(nullif(website,''), 'https://www.gpinfra.de'),
  karriere_url       = coalesce(nullif(karriere_url,''), null),
  telefon            = coalesce(nullif(telefon,''), '+4922142338231'),
  titelbild          = coalesce(nullif(titelbild,''), 'https://www.green-careers.de/storage/media/a19cc20d-8249-45d2-961f-401ab75cd984/ZejVSFcSTtmlHU9IioQo4ZlSs8TYHvbNgN5vlxVX.jpg'),
  logo_url           = coalesce(nullif(logo_url,''), 'https://www.green-careers.de/storage/media/a1c280bb-ac66-42dc-a5b3-92c7f5b6e9ea/tZkRrYSX3SRNg3h3OZnRIWRMTNsUbLQZlCXc3M0R.png'),
  social             = case when coalesce(social,'{}'::jsonb) = '{}'::jsonb then '{}'::jsonb else social end,
  unternehmensbilder = case when jsonb_array_length(coalesce(unternehmensbilder,'[]'::jsonb))=0 then '["https://www.green-careers.de/storage/media/a19cc20d-8249-45d2-961f-401ab75cd984/ZejVSFcSTtmlHU9IioQo4ZlSs8TYHvbNgN5vlxVX.jpg"]'::jsonb else unternehmensbilder end
where name = 'GPInfra Ingenieurgesellschaft PartG mbB';

update public.stellenanzeigen set
  aufgaben             = coalesce(nullif(aufgaben,''), 'Erstellung von detaillierten 2D- und 3D-Plänen im Bereich Verkehrsanlagen, Entwässerung, Außen- und Freianlagen
Arbeiten mit verschiedenen Programmen, wie BricsCad, Vestra, Auto
Enge Zusammenarbeit mit den Kolleg:Innen aus den Bereichen Planung und Bauüberwachung
Unterstützung in der erfolgreichen Abwicklung unserer Projekte
Eigenverantwortliches Arbeiten'),
  profil               = coalesce(nullif(profil,''), 'Ausbildung zum Bauzeichner (w/m/d) oder vergleichbare Qualifikation
Erste Berufserfahrung in der Planung von Infrastruktur- und Verkehrsprojekten wie Straßen- oder Entwässerungsanlagen
Ein sicherer Umgang mit dem CAD-Programm BricsCad, AutoCad
Sie sind flexibel, kreativ und aufgeschlossen für innovative Lösungen und übernehmen gerne Verantwortung'),
  benefits             = coalesce(nullif(benefits,''), 'Betriebliche Altersvorsorge\nBetriebsausflüge\nFlexible Arbeitszeiten\nFlache Hierarchien\nFreundliches Arbeitsklima\nGesundheitsangebote\nGetränke-Flatrate\nMitarbeiter-Events (z.B. Teambuilding-Aktivitäten)\nKostenübernahme für berufliche Zertifizierungen\nFahrtkostenzuschuss\nStrukturierte Abläufe\nUnbefristeter Arbeitsvertrag\nInterne Karrierechancen\nKurzer Freitag'),
  benefits_list        = case when jsonb_array_length(coalesce(benefits_list,'[]'::jsonb))=0 then '["Betriebliche Altersvorsorge", "Betriebsausflüge", "Flexible Arbeitszeiten", "Flache Hierarchien", "Freundliches Arbeitsklima", "Gesundheitsangebote", "Getränke-Flatrate", "Mitarbeiter-Events (z.B. Teambuilding-Aktivitäten)", "Kostenübernahme für berufliche Zertifizierungen", "Fahrtkostenzuschuss", "Strukturierte Abläufe", "Unbefristeter Arbeitsvertrag", "Interne Karrierechancen", "Kurzer Freitag"]'::jsonb else benefits_list end,
  ansprechpartner      = coalesce(nullif(ansprechpartner,''), 'Andreas Papajewski'),
  ansprechpartner_rolle= coalesce(nullif(ansprechpartner_rolle,''), 'Inhaber'),
  ansprechpartner_foto = coalesce(nullif(ansprechpartner_foto,''), 'https://www.green-careers.de/storage/media/a1c2e2ec-d530-4f81-84a3-7beb478712eb/FrTpoVoatnXOmqOtdoeyeopyxQGcWbFZvViJ66Nl.jpg'),
  kontakt_email        = coalesce(nullif(kontakt_email,''), 'papajewski@gpinfra.de'),
  kontakt_telefon      = coalesce(nullif(kontakt_telefon,''), '+4922142338231')
where customer_id = (select id from public.customers where name = 'GPInfra Ingenieurgesellschaft PartG mbB' limit 1);

-- ===== Wieczorek Tief- und Pflasterbau GmbH =====
update public.customers set
  ueber_uns          = coalesce(nullif(ueber_uns,''), 'Unser Unternehmen Wieczorek Tief- und Pflasterbau GmbH ist auf die Bereiche Tief-, Erd- und Straßenbau, Außenanlagen und Abbrucharbeiten spezialisiert.

Wir bieten:
- Angenehmes Arbeitsklima in einem stetig wachsenden Unternehmen
- Sorgfältige Ausbildung durch erfahrene Mitarbeiter:innen
- Zahlreiche, abwechslungsreiche und interessante Herausforderungen
- Monatliche Tankgutscheine oder Egym Wellpass
- Corporate Benefits
- Persönliche Schutzausrüstung sowie Arbeitskleidung
- Geradlinige, vertrauensvolle und verlässliche Firmenstruktur
- 30 Urlaubstage im Jahr'),
  mitarbeiter_anzahl = coalesce(nullif(mitarbeiter_anzahl,''), '29'),
  gruendungsjahr     = coalesce(nullif(gruendungsjahr,''), '2015'),
  website            = coalesce(nullif(website,''), 'https://www.tiefbau-wieczorek.de'),
  karriere_url       = coalesce(nullif(karriere_url,''), 'https://www.tiefbau-wieczorek.de/karriere'),
  telefon            = coalesce(nullif(telefon,''), '+4980366740223'),
  titelbild          = coalesce(nullif(titelbild,''), 'https://www.green-careers.de/storage/media/a1aa9e7a-4250-479a-bcdd-62fdb81c2b0a/z6jEfthnqS8yFfVjqkOT1r4lrUQvJsa8CZSQJk0x.png'),
  logo_url           = coalesce(nullif(logo_url,''), 'https://www.green-careers.de/storage/media/a18ed5e1-b4d7-41a7-9aac-003026e2bc8d/GMtJRiEisg5eKhiCym0swPJ8ZThSF9AXgBPgcVbv.png'),
  social             = case when coalesce(social,'{}'::jsonb) = '{}'::jsonb then '{"instagram": "https://wieczorek_tiefundpflasterbau"}'::jsonb else social end,
  unternehmensbilder = case when jsonb_array_length(coalesce(unternehmensbilder,'[]'::jsonb))=0 then '["https://www.green-careers.de/storage/media/a1aa9e7a-4250-479a-bcdd-62fdb81c2b0a/z6jEfthnqS8yFfVjqkOT1r4lrUQvJsa8CZSQJk0x.png"]'::jsonb else unternehmensbilder end
where name = 'Wieczorek Tief- und Pflasterbau GmbH';

update public.stellenanzeigen set
  aufgaben             = coalesce(nullif(aufgaben,''), 'Durchführung von Vermessungsarbeiten auf unseren Baustellen
Erstellung von Aufmaßen und Massenermittlungen
Unterstützung bei der Abrechnung von Bauleistungen
Auswertung und Dokumentation von Vermessungsdaten
Erstellung und Pflege von Bestands- und Abrechnungsunterlagen
Zusammenarbeit mit Bauleitung, Polieren und Auftraggebern
Kontrolle von Leistungen und Mengen gemäß Leistungsverzeichnis
Unterstützung bei der Baustellendokumentation'),
  profil               = coalesce(nullif(profil,''), 'Abgeschlossene Ausbildung als Vermessungstechniker, Bautechniker oder vergleichbare Qualifikation
Erfahrung im Tief-, Straßen- oder Pflasterbau von Vorteil
Sicherer Umgang mit Vermessungsgeräten und relevanter Software
Kenntnisse in der Bauabrechnung und Massenermittlung
Selbstständige, strukturierte und zuverlässige Arbeitsweise
Teamfähigkeit und Kommunikationsstärke
Führerschein Klasse B'),
  benefits             = coalesce(nullif(benefits,''), 'Betriebsausflüge\nFlexible Arbeitszeiten\nFreundliches Arbeitsklima\nGesundheitsangebote\nFahrtkostenzuschuss\nKostenlose Mahlzeiten bzw. finanzieller Ausgleich (Verpflegungspauschale)\nKostenübernahme für berufliche Zertifizierungen\nKurzer Freitag\nMitarbeiter-Events (z.B. Teambuilding-Aktivitäten)\nRegelmäßige Firmenfeiern\nUnbefristeter Arbeitsvertrag\nVermögenswirksame Leistungen'),
  benefits_list        = case when jsonb_array_length(coalesce(benefits_list,'[]'::jsonb))=0 then '["Betriebsausflüge", "Flexible Arbeitszeiten", "Freundliches Arbeitsklima", "Gesundheitsangebote", "Fahrtkostenzuschuss", "Kostenlose Mahlzeiten bzw. finanzieller Ausgleich (Verpflegungspauschale)", "Kostenübernahme für berufliche Zertifizierungen", "Kurzer Freitag", "Mitarbeiter-Events (z.B. Teambuilding-Aktivitäten)", "Regelmäßige Firmenfeiern", "Unbefristeter Arbeitsvertrag", "Vermögenswirksame Leistungen"]'::jsonb else benefits_list end,
  ansprechpartner      = coalesce(nullif(ansprechpartner,''), 'Isabell Müller'),
  ansprechpartner_rolle= coalesce(nullif(ansprechpartner_rolle,''), 'Personalabteilung'),
  ansprechpartner_foto = coalesce(nullif(ansprechpartner_foto,''), null),
  kontakt_email        = coalesce(nullif(kontakt_email,''), 'info@tiefbau-wieczorek.de'),
  kontakt_telefon      = coalesce(nullif(kontakt_telefon,''), '+4980366740223')
where customer_id = (select id from public.customers where name = 'Wieczorek Tief- und Pflasterbau GmbH' limit 1);

-- ===== Billstein jun. Bauunternehmen GmbH & Co. KG =====
update public.customers set
  ueber_uns          = coalesce(nullif(ueber_uns,''), 'Seit über 50 Jahren steht Billstein Bau für zuverlässige Arbeit, fachliche Kompetenz und hochwertige Bauprojekte in der Region Krefeld. Als familiengeführtes Unternehmen in zweiter Generation sind wir heute in den Bereichen Straßenbau, Tiefbau, Kanalbau, Erdarbeiten, Hochbau sowie Garten- und Landschaftsbau tätig.

Was uns auszeichnet? Ein starkes Team, moderne Technik und die Überzeugung, dass gute Arbeit nur gemeinsam entsteht. Deshalb setzen wir auf qualifizierte Mitarbeitende, kurze Entscheidungswege und einen respektvollen Umgang auf Augenhöhe. Bei uns kennt man sich noch persönlich und jeder Einzelne trägt zum Erfolg unserer Projekte bei.

Von kleineren Bauvorhaben bis hin zu komplexen Infrastrukturprojekten erwarten dich abwechslungsreiche Aufgaben und spannende Herausforderungen. Dabei legen wir großen Wert darauf, unsere Arbeitsplätze kontinuierlich weiterzuentwickeln und unseren Mitarbeitenden langfristige Perspektiven zu bieten.

Wenn du gerne anpackst, sichtbare Ergebnisse schaffen möchtest und Teil eines familiären Bauunternehmens werden willst, das Tradition mit modernem Arbeiten verbindet, dann freuen wir uns darauf, dich kennenzulernen.'),
  mitarbeiter_anzahl = coalesce(nullif(mitarbeiter_anzahl,''), '14'),
  gruendungsjahr     = coalesce(nullif(gruendungsjahr,''), '1970'),
  website            = coalesce(nullif(website,''), 'https://www.billstein-bau.de/'),
  karriere_url       = coalesce(nullif(karriere_url,''), 'https://www.billstein-bau.de/stellenangebote.html'),
  telefon            = coalesce(nullif(telefon,''), '+492151473739'),
  titelbild          = coalesce(nullif(titelbild,''), 'https://www.green-careers.de/storage/media/a1ef1a2e-bb7d-4156-bd1f-38eaedf94a8b/1ITOkuVGwCzJJJs43mbG2itr2gl4jKX1MWOBMFhN.jpg'),
  logo_url           = coalesce(nullif(logo_url,''), 'https://www.green-careers.de/storage/media/a1ef1a2d-de1b-45b6-9232-9bea4b51e96e/mgpwUk1HL5hBytOCmFHMA1EhE48eaeGhiJqI1GVP.png'),
  social             = case when coalesce(social,'{}'::jsonb) = '{}'::jsonb then '{}'::jsonb else social end,
  unternehmensbilder = case when jsonb_array_length(coalesce(unternehmensbilder,'[]'::jsonb))=0 then '["https://www.green-careers.de/storage/media/a1ef1a2e-bb7d-4156-bd1f-38eaedf94a8b/1ITOkuVGwCzJJJs43mbG2itr2gl4jKX1MWOBMFhN.jpg"]'::jsonb else unternehmensbilder end
where name = 'Billstein jun. Bauunternehmen GmbH & Co. KG';

update public.stellenanzeigen set
  aufgaben             = coalesce(nullif(aufgaben,''), 'Führen und Bedienen von Baggern und weiteren Baumaschinen
Durchführung von Erd-, Aushub- und Tiefbauarbeiten
Transport von Maschinen, Geräten und Materialien mit dem LKW
Unterstützung des Teams bei allen anfallenden Arbeiten auf der Baustelle
Eigenverantwortliches Arbeiten und Mitwirken an der erfolgreichen Umsetzung unserer Bauprojekte'),
  profil               = coalesce(nullif(profil,''), 'Erfahrung als Baggerfahrer oder Baumaschinenführer im Tief- und Straßenbau
Führerschein Klasse CE (LKW mit Anhänger)
Selbstständige, zuverlässige und verantwortungsbewusste Arbeitsweise
Bereitschaft, auch außerhalb der Maschine aktiv auf der Baustelle mitzuarbeiten
Teamgeist, Engagement und Freude an abwechslungsreichen Bauprojekten'),
  benefits             = coalesce(nullif(benefits,''), 'Interne Karrierechancen\nStrukturierte Abläufe\nUnbefristeter Arbeitsvertrag'),
  benefits_list        = case when jsonb_array_length(coalesce(benefits_list,'[]'::jsonb))=0 then '["Interne Karrierechancen", "Strukturierte Abläufe", "Unbefristeter Arbeitsvertrag"]'::jsonb else benefits_list end,
  ansprechpartner      = coalesce(nullif(ansprechpartner,''), 'Marc-Aurel Billstein'),
  ansprechpartner_rolle= coalesce(nullif(ansprechpartner_rolle,''), 'Geschäftsführer'),
  ansprechpartner_foto = coalesce(nullif(ansprechpartner_foto,''), 'https://www.green-careers.de/storage/media/a1ef1ed3-6ebb-4216-83ba-ea720ce3ea40/9CJEnVzrGzvDCaNFoutkwCoxBfORjidEwmEAHrFh.jpg'),
  kontakt_email        = coalesce(nullif(kontakt_email,''), 'info@billstein-bau.de'),
  kontakt_telefon      = coalesce(nullif(kontakt_telefon,''), '+492151473739')
where customer_id = (select id from public.customers where name = 'Billstein jun. Bauunternehmen GmbH & Co. KG' limit 1);

-- ===== Verkehrstechnik Potsdam GmbH =====
update public.customers set
  ueber_uns          = coalesce(nullif(ueber_uns,''), 'Die Verkehrstechnik Potsdam GmbH ist ein brandenburgisches mittelständisches Unternehmen. Wir haben uns auf Dienstleistungen, vorrangig für Bund, Länder und Kommunen, im Bereich der Verkehrstechnik spezialisiert. Unser Schwerpunkt liegt auf der Montage und Demontage von Beschilderungen, Verkehrszeichen, Wegweisungen und Leiteinrichtungen.

Mit unseren 14 Mitarbeitern sind wir im Land Brandenburg fest verankert und kombinieren unsere langjährige Erfahrung mit spezialisiertem Know-How im Straßenwesen.'),
  mitarbeiter_anzahl = coalesce(nullif(mitarbeiter_anzahl,''), '14'),
  gruendungsjahr     = coalesce(nullif(gruendungsjahr,''), '1994'),
  website            = coalesce(nullif(website,''), null),
  karriere_url       = coalesce(nullif(karriere_url,''), null),
  telefon            = coalesce(nullif(telefon,''), '+493320050780'),
  titelbild          = coalesce(nullif(titelbild,''), 'https://www.green-careers.de/storage/media/a2078729-f69e-4c8a-8b89-27bfb29937ec/r8ueW9BQv557uruk5CNOketTza7pe9fqnRNCfEz6.jpg'),
  logo_url           = coalesce(nullif(logo_url,''), 'https://www.green-careers.de/storage/media/a2077f65-7e80-4205-823b-600a93cf80cf/ESzlshZkGTLhQecDHhRjlAtIqtCyQZMRdWbiEkxG.jpg'),
  social             = case when coalesce(social,'{}'::jsonb) = '{}'::jsonb then '{}'::jsonb else social end,
  unternehmensbilder = case when jsonb_array_length(coalesce(unternehmensbilder,'[]'::jsonb))=0 then '["https://www.green-careers.de/storage/media/a2078729-f69e-4c8a-8b89-27bfb29937ec/r8ueW9BQv557uruk5CNOketTza7pe9fqnRNCfEz6.jpg"]'::jsonb else unternehmensbilder end
where name = 'Verkehrstechnik Potsdam GmbH';

update public.stellenanzeigen set
  aufgaben             = coalesce(nullif(aufgaben,''), 'Führung der Kolonne
Baustellen abwickeln
Pläne umsetzen'),
  profil               = coalesce(nullif(profil,''), 'Erfahrung im Tiefbau
Führungskraft
Durchblick
Führerschein
Teamgeist'),
  benefits             = coalesce(nullif(benefits,''), 'Freundliches Arbeitsklima\nInterne Karrierechancen\nUnbefristeter Arbeitsvertrag\nVoll ausgestatteter Firmenwagen\nWeihnachtsgeld\nJahresprämie\nFlache Hierarchien'),
  benefits_list        = case when jsonb_array_length(coalesce(benefits_list,'[]'::jsonb))=0 then '["Freundliches Arbeitsklima", "Interne Karrierechancen", "Unbefristeter Arbeitsvertrag", "Voll ausgestatteter Firmenwagen", "Weihnachtsgeld", "Jahresprämie", "Flache Hierarchien"]'::jsonb else benefits_list end,
  ansprechpartner      = coalesce(nullif(ansprechpartner,''), 'Dirk Bethke'),
  ansprechpartner_rolle= coalesce(nullif(ansprechpartner_rolle,''), 'Geschäftsführer'),
  ansprechpartner_foto = coalesce(nullif(ansprechpartner_foto,''), null),
  kontakt_email        = coalesce(nullif(kontakt_email,''), 'info@vt-potsdam.de'),
  kontakt_telefon      = coalesce(nullif(kontakt_telefon,''), '+491739051252')
where customer_id = (select id from public.customers where name = 'Verkehrstechnik Potsdam GmbH' limit 1);

-- ===== Uwe Jahns GmbH Straßen und Tiefbau =====
update public.customers set
  ueber_uns          = coalesce(nullif(ueber_uns,''), 'Die Uwe Jahns GmbH Straßen und Tiefbau ist familien geführtes Unternehmen mit Sitz in Waldmohr, Deutschland. Es ist spezialisiert auf den Straßen- und Tiefbau und bietet Dienstleistungen in diesem Bereich an. 
Auch arbeiten wir im privaten Bereich, was Außenanlagen, Abrisse sowie Erdarbeiten beinhaltet.

Unser Unternehmen beschäftigt zwischen 12 und 15 Mitarbeiter und ist damit ein kleiner Betrieb. Diese überschaubare Größe ermöglicht  flache Hierachien und eine enge Zusammenarbeit innerhalb des Teams. Der Betrieb legt Wert auf die Einbindung der Mitarbeiter und fördert selbstständiges Arbeiten sowie eigene Arbeitsplanung. Die kurzen Kommunikationswege tragen zur Effizienz und einer angenehmen Arbeitsatmosphäre bei.'),
  mitarbeiter_anzahl = coalesce(nullif(mitarbeiter_anzahl,''), '13'),
  gruendungsjahr     = coalesce(nullif(gruendungsjahr,''), '1990'),
  website            = coalesce(nullif(website,''), 'https://www.Uwe Jahns Straßen und Tiefbau GmbH.de'),
  karriere_url       = coalesce(nullif(karriere_url,''), null),
  telefon            = coalesce(nullif(telefon,''), '+491774901614'),
  titelbild          = coalesce(nullif(titelbild,''), 'https://www.green-careers.de/storage/media/a1f92578-38a8-4464-a5ca-ba61bcd17cd5/ySGKOOVtoFINPFhXLHGWKQGZ9lxc8aydVfyQCTEs.png'),
  logo_url           = coalesce(nullif(logo_url,''), 'https://www.green-careers.de/storage/media/a1ff5c75-82f6-4bd6-809d-1ad4d956528b/JFyzLPe9FvOIjWV7fkrgQxuWUdRA8mt05eCNzJ77.png'),
  social             = case when coalesce(social,'{}'::jsonb) = '{}'::jsonb then '{}'::jsonb else social end,
  unternehmensbilder = case when jsonb_array_length(coalesce(unternehmensbilder,'[]'::jsonb))=0 then '["https://www.green-careers.de/storage/media/a1f92578-38a8-4464-a5ca-ba61bcd17cd5/ySGKOOVtoFINPFhXLHGWKQGZ9lxc8aydVfyQCTEs.png"]'::jsonb else unternehmensbilder end
where name = 'Uwe Jahns GmbH Straßen und Tiefbau';

update public.stellenanzeigen set
  aufgaben             = coalesce(nullif(aufgaben,''), 'Angebote schreiben
Mitarbeiter Betreuung
Aufmaße und Abrechnungen
Kunden- sowie Lieferantenkontakt
Wechsel zwischen Büro und Baustelle'),
  profil               = coalesce(nullif(profil,''), 'Teamfähig
Flexibilität
Kenntnnise im Straßenbau sowie Privatkundenbereich -Beratung bei Erdarbeiten , Aussenanlagen und diverses'),
  benefits             = coalesce(nullif(benefits,''), 'Firmenhandy\nFlache Hierarchien\nFreundliches Arbeitsklima\nUnbefristeter Arbeitsvertrag\nUrlaubsgeld\nVermögenswirksame Leistungen\nWeihnachtsgeld\nKostenübernahme für berufliche Zertifizierungen\nRegelmäßige Firmenfeiern'),
  benefits_list        = case when jsonb_array_length(coalesce(benefits_list,'[]'::jsonb))=0 then '["Firmenhandy", "Flache Hierarchien", "Freundliches Arbeitsklima", "Unbefristeter Arbeitsvertrag", "Urlaubsgeld", "Vermögenswirksame Leistungen", "Weihnachtsgeld", "Kostenübernahme für berufliche Zertifizierungen", "Regelmäßige Firmenfeiern"]'::jsonb else benefits_list end,
  ansprechpartner      = coalesce(nullif(ansprechpartner,''), 'Uwe Jahns'),
  ansprechpartner_rolle= coalesce(nullif(ansprechpartner_rolle,''), 'Geschäftsführer'),
  ansprechpartner_foto = coalesce(nullif(ansprechpartner_foto,''), null),
  kontakt_email        = coalesce(nullif(kontakt_email,''), 'Info@jahns-waldmohr.de'),
  kontakt_telefon      = coalesce(nullif(kontakt_telefon,''), '+491774901614')
where customer_id = (select id from public.customers where name = 'Uwe Jahns GmbH Straßen und Tiefbau' limit 1);

