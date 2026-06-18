-- =========================================================
-- GreenCareers OS · Daten-Import — 8 Tiefbau-/Straßenbau-Firmen
-- Quelle: green-careers.de/jobs (Branche Tiefbau, Stand 2026-06-17)
-- Einmal komplett in den Supabase SQL Editor einfügen + "Run". IDEMPOTENT:
--   - Firma wird nur angelegt, wenn der Name noch nicht existiert.
--   - Stelle wird via "on conflict (slug) do nothing" nur einmal angelegt.
-- Voraussetzung: Schemas v1, v2, v5, v6 sind bereits ausgeführt.
-- (Die folgenden add-column-Guards sind nur Sicherheitsnetz, falls nicht.)
-- =========================================================

alter table public.customers add column if not exists plz     text;
alter table public.customers add column if not exists produkt text;
alter table public.stellenanzeigen add column if not exists slug               text;
alter table public.stellenanzeigen add column if not exists beschaeftigungsart text;
alter table public.stellenanzeigen add column if not exists vertragsart        text;
alter table public.stellenanzeigen add column if not exists eintritt           text;
alter table public.stellenanzeigen add column if not exists aufgaben           text;
alter table public.stellenanzeigen add column if not exists profil             text;
alter table public.stellenanzeigen add column if not exists benefits           text;
alter table public.stellenanzeigen add column if not exists ansprechpartner       text;
alter table public.stellenanzeigen add column if not exists ansprechpartner_rolle text;
alter table public.stellenanzeigen add column if not exists kontakt_telefon       text;
alter table public.stellenanzeigen add column if not exists published_at          timestamptz;

-- ---------------------------------------------------------
-- 1) IDH-Innovative Dienstleistungen Habers GmbH · Overath · PREMIUM
-- ---------------------------------------------------------
do $$
declare v_cid uuid;
begin
  select id into v_cid from public.customers where name = 'IDH-Innovative Dienstleistungen Habers GmbH' limit 1;
  if v_cid is null then
    insert into public.customers (name, branchen, theme, ort, plz, ansprechpartner, produkt, onboarding_status, ueber_uns)
    values ('IDH-Innovative Dienstleistungen Habers GmbH', '{Tiefbau}', 'tiefbau', 'Overath', '51491',
            'Philipp Habers', 'premium', 'live',
            'Wachsendes Tiefbauunternehmen aus Overath mit Projekten im Straßen-, Kanal- und Leitungsbau. Modernes Equipment, eingespieltes, familiäres Team und kurze Entscheidungswege.')
    returning id into v_cid;
  end if;
  insert into public.stellenanzeigen
    (customer_id, titel, branche, ort, beschreibung, beschaeftigungsart, vertragsart, eintritt,
     aufgaben, profil, ansprechpartner, ansprechpartner_rolle, kontakt_telefon, slug, status, published_at)
  values (v_cid, 'Facharbeiter Tiefbau (m/w/d)', 'Tiefbau', 'Overath',
    'Straßen- und Tiefbauer (m/w/d) für ein wachsendes Tiefbauunternehmen in Overath gesucht. Einsatz in abwechslungsreichen Projekten im Straßen-, Kanal- und Leitungsbau mit modernen Maschinen und einem eingespielten, familiären Team. Zu den Aufgaben gehören Erdarbeiten, das Verlegen von Leitungen sowie die Baustellenvorbereitung. Geboten werden ein sicherer Arbeitsplatz, faire Bezahlung inklusive Fahrtzeit (Lager-Baustelle-Lager), moderne Ausstattung und ein kollegiales Arbeitsumfeld mit kurzen Entscheidungswegen.',
    'Vollzeit', 'Unbefristet', '01.05.2026',
    E'Durchführung von Tiefbauarbeiten im Straßen-, Kanal- und Leitungsbau\nErdarbeiten sowie Verlegen von Rohrleitungen und Kabeln\nBedienung moderner Baumaschinen\nBaustellenvorbereitung und -absicherung\nZusammenarbeit im Team auf wechselnden Baustellen',
    E'Abgeschlossene Ausbildung im Straßen- und Tiefbau oder vergleichbare Erfahrung\nHandwerkliches Geschick und technisches Verständnis\nTeamfähigkeit und zuverlässige Arbeitsweise\nFührerschein Klasse B zwingend erforderlich, zusätzliche Klassen sind ein Plus, aber kein Muss\nMotivation und Einsatzbereitschaft',
    'Philipp Habers', 'Geschäftsführer', '+49 2206 905430', 'facharbeiter-tiefbau-overath', 'aktiv', now())
  on conflict (slug) do nothing;
end $$;

-- ---------------------------------------------------------
-- 2) Verkehrstechnik Potsdam GmbH · Nuthetal · PREMIUM
-- ---------------------------------------------------------
do $$
declare v_cid uuid;
begin
  select id into v_cid from public.customers where name = 'Verkehrstechnik Potsdam GmbH' limit 1;
  if v_cid is null then
    insert into public.customers (name, branchen, theme, ort, plz, ansprechpartner, produkt, onboarding_status, ueber_uns)
    values ('Verkehrstechnik Potsdam GmbH', '{Tiefbau}', 'tiefbau', 'Nuthetal', '14558',
            'Dirk Bethke', 'premium', 'live',
            'Tiefbauunternehmen im Raum Potsdam mit spannenden Projekten im regionalen Umfeld, modernem Fuhrpark und einem eingespielten, motivierten Team, das zusammenhält.')
    returning id into v_cid;
  end if;
  insert into public.stellenanzeigen
    (customer_id, titel, branche, ort, beschreibung, beschaeftigungsart, vertragsart, eintritt,
     aufgaben, profil, benefits, ansprechpartner, ansprechpartner_rolle, kontakt_telefon, slug, status, published_at)
  values (v_cid, 'Kolonnenführer Tiefbau (m/w/d)', 'Tiefbau', 'Nuthetal',
    'Zur Verstärkung unseres Teams suchen wir einen Kolonnenführer im Tiefbau (m/w/d). Du leitest dein Team auf der Baustelle an, organisierst den Ablauf im Tiefbau und setzt Baupläne gemeinsam mit deinem Team genau um.',
    'Vollzeit', 'Unbefristet', '16.06.2026',
    E'Führung der Kolonne: Du leitest dein Team auf der Baustelle an und teilst die tägliche Arbeit ein\nBaustellen abwickeln: Du organisierst den Ablauf im Tiefbau\nPläne umsetzen: Du liest Baupläne und setzt diese mit deinem Team genau um',
    E'Erfahrung im Tiefbau: Ausbildung als Tiefbaufacharbeiter oder Betonbauer\nFührungskraft: idealerweise schon als Vorarbeiter oder Kolonnenführer gearbeitet\nDurchblick: Baupläne sicher lesen und verstehen\nFührerschein: mindestens Klasse B (Klasse BE oder C1E von Vorteil)\nTeamgeist: zuverlässig, packt selbst mit an und motiviert die Kollegen',
    E'Attraktive Vergütung und Zusatzleistungen\nSicherer Vollzeit-Job mit unbefristetem Arbeitsverhältnis\nSpannende Projekte im regionalen Umfeld\nModerner Fuhrpark, Firmenfahrzeug auch zur privaten Nutzung\nWeiterbildungsmöglichkeiten und Entwicklungsperspektiven\nEingespieltes, motiviertes Team',
    'Dirk Bethke', 'Geschäftsführer', '+49 173 9051252', 'kolonnenfuehrer-tiefbau-nuthetal', 'aktiv', now())
  on conflict (slug) do nothing;
end $$;

-- ---------------------------------------------------------
-- 3) Gebr. Donhauser Bau GmbH & Co.KG · Schwandorf · PREMIUM
-- ---------------------------------------------------------
do $$
declare v_cid uuid;
begin
  select id into v_cid from public.customers where name = 'Gebr. Donhauser Bau GmbH & Co.KG' limit 1;
  if v_cid is null then
    insert into public.customers (name, branchen, theme, ort, plz, ansprechpartner, produkt, onboarding_status, ueber_uns)
    values ('Gebr. Donhauser Bau GmbH & Co.KG', '{Strassenbau}', 'tiefbau', 'Schwandorf', '92421',
            'Julia Hecht', 'premium', 'live',
            'Regional tätiges Bauunternehmen mit Projekten in den Bereichen Erschließung, Wasserleitungsbau, Kanalbau und Straßenbau.')
    returning id into v_cid;
  end if;
  insert into public.stellenanzeigen
    (customer_id, titel, branche, ort, beschreibung, beschaeftigungsart, vertragsart, eintritt,
     aufgaben, profil, ansprechpartner, ansprechpartner_rolle, kontakt_telefon, slug, status, published_at)
  values (v_cid, 'Facharbeiter Straßen- und Tiefbau (m/w/d)', 'Straßenbau', 'Schwandorf',
    'Als Facharbeiter im Straßen- und Tiefbau arbeitest du mit unserem Team regional an Bauprojekten in den Bereichen Erschließung, Wasserleitungsbau, Kanalbau und Straßenbau.',
    'Vollzeit', 'Unbefristet', '01.05.2026',
    E'Herstellen von Baugruben und Leitungsgräben\nVerlegen von Rohrleitungen, Kabeln und Kanälen\nPflasterarbeiten sowie Setzen von Bordsteinen\nEinbauen und Verdichten von Tragschichten und Asphalt\nBedienen von Baumaschinen und Baugeräten',
    E'Abgeschlossene Ausbildung idealerweise im Bereich Tief-, Straßen-, Kanalbau oder alternativ mehrjährige Erfahrung im Bereich Tiefbau\nIdealerweise Kenntnisse im Bereich Erdbewegungsarbeiten, Baugeräteführung, Baumaschinenführung\nFührerschein Klasse B',
    'Julia Hecht', 'Assistenz', '+49 9431 7220', 'facharbeiter-strassen-tiefbau-schwandorf', 'aktiv', now())
  on conflict (slug) do nothing;
end $$;

-- ---------------------------------------------------------
-- 4) GPInfra Ingenieurgesellschaft PartG mbB · Köln · PREMIUM
-- ---------------------------------------------------------
do $$
declare v_cid uuid;
begin
  select id into v_cid from public.customers where name = 'GPInfra Ingenieurgesellschaft PartG mbB' limit 1;
  if v_cid is null then
    insert into public.customers (name, branchen, theme, ort, plz, ansprechpartner, produkt, onboarding_status, ueber_uns)
    values ('GPInfra Ingenieurgesellschaft PartG mbB', '{Tiefbau}', 'tiefbau', 'Köln', '50827',
            'Andreas Papajewski', 'premium', 'live',
            'Ingenieurgesellschaft mit Schwerpunkt Infrastrukturplanung. Wir planen Verkehrsanlagen, Entwässerungs- sowie Außen- und Freianlagen für anspruchsvolle Projekte.')
    returning id into v_cid;
  end if;
  insert into public.stellenanzeigen
    (customer_id, titel, branche, ort, beschreibung, beschaeftigungsart, vertragsart, eintritt,
     aufgaben, profil, ansprechpartner, ansprechpartner_rolle, kontakt_telefon, slug, status, published_at)
  values (v_cid, 'Bauzeichner Tiefbau (m/w/d)', 'Tiefbau', 'Köln',
    'Die GPInfra Ingenieurgesellschaft sucht zur Verstärkung des Teams im Bereich Infrastrukturplanung einen Bauzeichner (m/w/d) für Infrastruktur- und Straßenplanung. In Ihrer Rolle als Bauzeichner:in erstellen Sie detaillierte 2D- und 3D-Pläne für Verkehrsanlagen, Entwässerungs- sowie Außen- und Freianlagen. Diese Position kann in Voll- oder Teilzeit angetreten werden.',
    'Voll-/ Teilzeit', 'Unbefristet', '01.05.2026',
    E'Erstellung von detaillierten 2D- und 3D-Plänen im Bereich Verkehrsanlagen, Entwässerung, Außen- und Freianlagen\nArbeiten mit verschiedenen Programmen wie BricsCad, Vestra und AutoTurn\nEnge Zusammenarbeit mit den Kolleg:innen aus den Bereichen Planung und Bauüberwachung\nUnterstützung in der erfolgreichen Abwicklung unserer Projekte\nEigenverantwortliches Arbeiten',
    E'Ausbildung zum Bauzeichner (w/m/d) oder vergleichbare Qualifikation\nErste Berufserfahrung in der Planung von Infrastruktur- und Verkehrsprojekten wie Straßen- oder Entwässerungsanlagen\nSicherer Umgang mit den CAD-Programmen BricsCad und AutoCad\nFlexibel, kreativ und aufgeschlossen für innovative Lösungen, übernimmt gerne Verantwortung',
    'Andreas Papajewski', 'Inhaber', '+49 221 42338231', 'bauzeichner-tiefbau-koeln', 'aktiv', now())
  on conflict (slug) do nothing;
end $$;

-- ---------------------------------------------------------
-- 5) Wilhelm Weier GmbH & Co. KG · Duisburg · PREMIUM
-- ---------------------------------------------------------
do $$
declare v_cid uuid;
begin
  select id into v_cid from public.customers where name = 'Wilhelm Weier GmbH & Co. KG' limit 1;
  if v_cid is null then
    insert into public.customers (name, branchen, theme, ort, plz, ansprechpartner, produkt, onboarding_status, ueber_uns)
    values ('Wilhelm Weier GmbH & Co. KG', '{Kanalbau}', 'tiefbau', 'Duisburg', '47249',
            'Wolfgang Krallmann', 'premium', 'live',
            'Erfahrenes Unternehmen im Straßen-, Tief- und Kanalbau. Wir bieten sichere Arbeitsplätze und Perspektiven inklusive interner Weiterbildung.')
    returning id into v_cid;
  end if;
  insert into public.stellenanzeigen
    (customer_id, titel, branche, ort, beschreibung, beschaeftigungsart, vertragsart, eintritt,
     aufgaben, profil, ansprechpartner, ansprechpartner_rolle, kontakt_telefon, slug, status, published_at)
  values (v_cid, 'Facharbeiter (m/w/d) – Straßen-, Tief- & Kanalbau', 'Kanalbau', 'Duisburg',
    'Facharbeiter (m/w/d) im Straßen-, Tief- & Kanalbau gesucht. Wir suchen Facharbeiter mit Erfahrung im Tiefbau oder Kanalbau, zuverlässig, mit Interesse an Weiterbildung und Führerschein min. Klasse B.',
    'Vollzeit', 'Unbefristet', '01.05.2026',
    E'Ausschachten von Gräben\nVerbau von Gräben\nEinrichten, Sichern und Räumen von Baustellen\nVerlegen von Rohren\nBetonarbeiten\nBedienung von Baumaschinen',
    E'Körperlich belastbar\nHandwerklich geschickt\nTeamfähig\nZuverlässig und eine selbstständige Arbeitsweise\nMotiviert (auch für eine interne Weiterbildung)\nErfahrung im Tief-, Straßen- oder Kanalbau',
    'Wolfgang Krallmann', 'Geschäftsführung', '+49 203 701710', 'facharbeiter-strassen-tief-kanalbau-duisburg', 'aktiv', now())
  on conflict (slug) do nothing;
end $$;

-- ---------------------------------------------------------
-- 6) Billstein jun. Bauunternehmen GmbH & Co. KG · Krefeld · SMART
-- ---------------------------------------------------------
do $$
declare v_cid uuid;
begin
  select id into v_cid from public.customers where name = 'Billstein jun. Bauunternehmen GmbH & Co. KG' limit 1;
  if v_cid is null then
    insert into public.customers (name, branchen, theme, ort, plz, ansprechpartner, produkt, onboarding_status, ueber_uns)
    values ('Billstein jun. Bauunternehmen GmbH & Co. KG', '{Tiefbau}', 'tiefbau', 'Krefeld', '47800',
            'Marc-Aurel Billstein', 'smart', 'live',
            'Familiäres Bauunternehmen mit kurzen Entscheidungswegen, modernen Maschinen und abwechslungsreichen Projekten im Tief- und Straßenbau in der Region. Bei uns kennt man sich persönlich und arbeitet auf Augenhöhe.')
    returning id into v_cid;
  end if;
  insert into public.stellenanzeigen
    (customer_id, titel, branche, ort, beschreibung, beschaeftigungsart, vertragsart, eintritt,
     aufgaben, profil, ansprechpartner, ansprechpartner_rolle, kontakt_telefon, slug, status, published_at)
  values (v_cid, 'Baggerfahrer (m/w/d)', 'Tiefbau', 'Krefeld',
    'Baggerfahrer / Baumaschinenführer mit LKW-Führerschein CE (m/w/d). Als Baggerfahrer bei Billstein Bau bist du Teil eines eingespielten Teams und arbeitest an abwechslungsreichen Projekten im Tief- und Straßenbau. Du bedienst moderne Baumaschinen, führst Erd- und Aushubarbeiten durch und transportierst bei Bedarf Maschinen und Materialien sicher zur Baustelle. Wir suchen keinen reinen Maschinenführer, sondern einen echten Teamplayer, der selbstständig arbeitet und Verantwortung übernimmt.',
    'Vollzeit', 'Unbefristet', '01.06.2026',
    E'Führen und Bedienen von Baggern und weiteren Baumaschinen\nDurchführung von Erd-, Aushub- und Tiefbauarbeiten\nTransport von Maschinen, Geräten und Materialien mit dem LKW\nUnterstützung des Teams bei allen anfallenden Arbeiten auf der Baustelle\nEigenverantwortliches Arbeiten und Mitwirken an der erfolgreichen Umsetzung unserer Bauprojekte',
    E'Erfahrung als Baggerfahrer oder Baumaschinenführer im Tief- und Straßenbau\nFührerschein Klasse CE (LKW mit Anhänger)\nSelbstständige, zuverlässige und verantwortungsbewusste Arbeitsweise\nBereitschaft, auch außerhalb der Maschine aktiv auf der Baustelle mitzuarbeiten\nTeamgeist, Engagement und Freude an abwechslungsreichen Bauprojekten',
    'Marc-Aurel Billstein', 'Geschäftsführer', '+49 2151 473739', 'baggerfahrer-krefeld', 'aktiv', now())
  on conflict (slug) do nothing;
end $$;

-- ---------------------------------------------------------
-- 7) Ackers GmbH · Kempen · PREMIUM
-- ---------------------------------------------------------
do $$
declare v_cid uuid;
begin
  select id into v_cid from public.customers where name = 'Ackers GmbH' limit 1;
  if v_cid is null then
    insert into public.customers (name, branchen, theme, ort, plz, ansprechpartner, produkt, onboarding_status, ueber_uns)
    values ('Ackers GmbH', '{Tiefbau}', 'tiefbau', 'Kempen', '47906',
            'Philip Ackers', 'premium', 'live',
            'Tiefbauunternehmen mit Klein- und Großbaustellen an wechselnden Standorten. Führungsstärke und Engagement tragen wesentlich zum Erfolg unserer Bauvorhaben bei. Quereinsteiger willkommen.')
    returning id into v_cid;
  end if;
  insert into public.stellenanzeigen
    (customer_id, titel, branche, ort, beschreibung, beschaeftigungsart, vertragsart, eintritt,
     aufgaben, profil, ansprechpartner, ansprechpartner_rolle, kontakt_telefon, slug, status, published_at)
  values (v_cid, 'Vorarbeiter (m/w/d) – Tiefbau', 'Tiefbau', 'Kempen',
    'Wir suchen einen Vorarbeiter im Bereich Tiefbau. Als zentraler Bestandteil unseres Unternehmens übernehmen Sie die Leitung eines Teams und sorgen für die reibungslose Durchführung von Klein- und Großbaustellen. Der Einsatz erfolgt an verschiedenen Standorten, je nach Projektanforderung. Es handelt sich um eine unbefristete Anstellung in Vollzeit. Quereinsteiger gerne gesehen.',
    'Vollzeit', 'Unbefristet', '11.05.2026',
    E'Teamführung\nZuverlässiges, selbständiges und wirtschaftliches Umsetzen der Projekte\nKommunikation mit Kunden, Bauleitung und Kollegen',
    E'Zuverlässig\nEigenständig\nLösungsorientiert',
    'Philip Ackers', 'Geschäftsführer', '+49 2152 2532', 'vorarbeiter-tiefbau-kempen', 'aktiv', now())
  on conflict (slug) do nothing;
end $$;

-- ---------------------------------------------------------
-- 8) Wieczorek Tief- und Pflasterbau GmbH · Prutting · SMART
-- ---------------------------------------------------------
do $$
declare v_cid uuid;
begin
  select id into v_cid from public.customers where name = 'Wieczorek Tief- und Pflasterbau GmbH' limit 1;
  if v_cid is null then
    insert into public.customers (name, branchen, theme, ort, plz, ansprechpartner, produkt, onboarding_status, ueber_uns)
    values ('Wieczorek Tief- und Pflasterbau GmbH', '{Tiefbau}', 'tiefbau', 'Prutting', '83134',
            'Isabell Müller', 'smart', 'live',
            'Modernes und leistungsstarkes Unternehmen im Bereich Tief-, Straßen- und Pflasterbau. Mit einem engagierten Team realisieren wir anspruchsvolle Projekte für öffentliche und private Auftraggeber.')
    returning id into v_cid;
  end if;
  insert into public.stellenanzeigen
    (customer_id, titel, branche, ort, beschreibung, beschaeftigungsart, vertragsart, eintritt,
     aufgaben, profil, ansprechpartner, ansprechpartner_rolle, kontakt_telefon, slug, status, published_at)
  values (v_cid, 'Abrechnung / Vermessung (m/w/d)', 'Tiefbau', 'Prutting',
    'Wir sind ein modernes und leistungsstarkes Unternehmen im Bereich Tief-, Straßen- und Pflasterbau. Mit einem engagierten Team realisieren wir anspruchsvolle Projekte für öffentliche und private Auftraggeber. Zur Verstärkung unseres Teams suchen wir zum nächstmöglichen Zeitpunkt einen zuverlässigen und motivierten Vermesser / Abrechner (m/w/d).',
    'Vollzeit', 'Unbefristet', '18.05.2026',
    E'Durchführung von Vermessungsarbeiten auf unseren Baustellen\nErstellung von Aufmaßen und Massenermittlungen\nUnterstützung bei der Abrechnung von Bauleistungen\nAuswertung und Dokumentation von Vermessungsdaten\nErstellung und Pflege von Bestands- und Abrechnungsunterlagen\nZusammenarbeit mit Bauleitung, Polieren und Auftraggebern\nKontrolle von Leistungen und Mengen gemäß Leistungsverzeichnis\nUnterstützung bei der Baustellendokumentation',
    E'Abgeschlossene Ausbildung als Vermessungstechniker, Bautechniker oder vergleichbare Qualifikation\nErfahrung im Tief-, Straßen- oder Pflasterbau von Vorteil\nSicherer Umgang mit Vermessungsgeräten und relevanter Software\nKenntnisse in der Bauabrechnung und Massenermittlung\nSelbstständige, strukturierte und zuverlässige Arbeitsweise\nTeamfähigkeit und Kommunikationsstärke\nFührerschein Klasse B',
    'Isabell Müller', 'Personalabteilung', '+49 8036 6740223', 'abrechnung-vermessung-prutting', 'aktiv', now())
  on conflict (slug) do nothing;
end $$;

-- ---------------------------------------------------------
-- Kontrolle: zeigt die importierten Firmen + Stellen
-- ---------------------------------------------------------
select c.name as firma, c.ort, c.plz, c.produkt, s.titel, s.branche, s.status
from public.stellenanzeigen s
join public.customers c on c.id = s.customer_id
where s.slug in (
  'facharbeiter-tiefbau-overath','kolonnenfuehrer-tiefbau-nuthetal',
  'facharbeiter-strassen-tiefbau-schwandorf','bauzeichner-tiefbau-koeln',
  'facharbeiter-strassen-tief-kanalbau-duisburg','baggerfahrer-krefeld',
  'vorarbeiter-tiefbau-kempen','abrechnung-vermessung-prutting')
order by c.name;
