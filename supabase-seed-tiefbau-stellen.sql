-- =========================================================
-- GreenCareers OS · Seed — Tiefbau-Stellenanzeigen Portal (strassen-tiefbau)
-- Einmal komplett in den Supabase SQL Editor einfuegen + "Run". IDEMPOTENT.
--
-- WARUM:
--  Das Portal strassen-tiefbau.green-careers.de zeigt nur Stellen mit
--  status='aktiv' (public_jobs-View). Bisher war nur 1 Stelle live. Dieses
--  Skript legt die 9 echten Tiefbau-/Strassenbau-Betriebe + je 1 passende
--  Stellenanzeige an — 1:1 uebernommen aus green-careers.de/jobs (Filter
--  Tiefbau + Strassenbau). Quelle: oeffentliche green-careers.de API.
--
-- IDEMPOTENZ:
--  - customers werden per NAME geguarded (IDH existiert bereits -> kein Dup).
--  - stellenanzeigen werden per SLUG geguarded (mehrfaches Run = no-op).
--  - Felder, die die oeffentliche API NICHT liefert (aufgaben/profil/benefits/
--    gehalt/ansprechpartner), bleiben leer und koennen im Backend ergaenzt werden.
--    beschreibung enthaelt den vollstaendigen Anzeigentext aus dem Portal.
-- =========================================================

do $$
declare cid uuid;
begin

  -- Gebr. Donhauser Bau GmbH & Co.KG · Facharbeiter Straßen- und Tiefbau (92421 Schwandorf) · premium
  select id into cid from public.customers where name = 'Gebr. Donhauser Bau GmbH & Co.KG' limit 1;
  if cid is null then
    insert into public.customers (name, ort, plz, strasse, branchen, theme, produkt, logo_url)
    values ('Gebr. Donhauser Bau GmbH & Co.KG', 'Schwandorf', '92421', 'Ettmannsdorfer Str. 47', array['tiefbau'], 'tiefbau', 'premium', 'https://www.green-careers.de/storage/media/a15e574a-ac4c-439d-b1ae-b8569b069a3c/Pd31C1ckyr0zThfu72wY83tGd5nI666cpgWDuFpU.jpg')
    returning id into cid;
  end if;
  if not exists (select 1 from public.stellenanzeigen where slug = 'vollzeit-facharbeiter-strassen-und-tiefbau-unbefristet-in-schwandorf') then
    insert into public.stellenanzeigen
      (customer_id, titel, branche, ort, status, beschreibung, beschaeftigungsart, vertragsart, slug, published_at)
    values
      (cid, 'Facharbeiter Straßen- und Tiefbau', 'Tiefbau', 'Schwandorf', 'aktiv', 'Als Facharbeiter im Straßen und Tiefbau arbeitest du mit unserem Team regional an Bauprojekten in den Bereichen Erschließung, Wasserleitungsbau, Kanalbau und Straßenbau.', 'Vollzeit', 'Unbefristet', 'vollzeit-facharbeiter-strassen-und-tiefbau-unbefristet-in-schwandorf', now());
  end if;

  -- IDH-Innovative Dienstleistungen Habers GmbH · Facharbeiter Tiefbau (51491 Overath) · premium
  select id into cid from public.customers where name = 'IDH-Innovative Dienstleistungen Habers GmbH' limit 1;
  if cid is null then
    insert into public.customers (name, ort, plz, strasse, branchen, theme, produkt, logo_url)
    values ('IDH-Innovative Dienstleistungen Habers GmbH', 'Overath', '51491', 'Klef 4', array['tiefbau'], 'tiefbau', 'premium', 'https://www.green-careers.de/storage/media/a1625be9-2446-42ba-a53a-c275e1c6c62e/Cwlw89sHbxYVHsX2Aa84PulhFKHThjaMyB78vSAe.jpg')
    returning id into cid;
  end if;
  -- IDH hatte bereits eine manuell gepflegte (vollstaendige) Stelle -> per Titel guarden,
  -- damit kein leeres Duplikat entsteht (egal welcher Slug).
  if not exists (select 1 from public.stellenanzeigen where customer_id = cid and titel = 'Facharbeiter Tiefbau') then
    insert into public.stellenanzeigen
      (customer_id, titel, branche, ort, status, beschreibung, beschaeftigungsart, vertragsart, slug, published_at)
    values
      (cid, 'Facharbeiter Tiefbau', 'Tiefbau', 'Overath', 'aktiv', 'Straßen- und Tiefbauer (m/w/d) für ein wachsendes Tiefbauunternehmen in Overath gesucht. Einsatz in abwechslungsreichen Projekten im Straßen-, Kanal- und Leitungsbau mit modernen Maschinen und einem eingespielten, familiären Team. Zu den Aufgaben gehören Erdarbeiten, das Verlegen von Leitungen sowie die Baustellenvorbereitung. Geboten werden ein sicherer Arbeitsplatz, faire Bezahlung inklusive Fahrtzeit, (Lager-Baustelle-Lager) moderne Ausstattung und ein kollegiales Arbeitsumfeld mit kurzen Entscheidungswegen.', 'Vollzeit', 'Unbefristet', 'vollzeit-facharbeiter-tiefbau-unbefristet-in-overath', now());
  end if;

  -- Wilhelm Weier GmbH & Co. KG · Facharbeiter (47249 Duisburg) · premium
  select id into cid from public.customers where name = 'Wilhelm Weier GmbH & Co. KG' limit 1;
  if cid is null then
    insert into public.customers (name, ort, plz, strasse, branchen, theme, produkt, logo_url)
    values ('Wilhelm Weier GmbH & Co. KG', 'Duisburg', '47249', 'Sittardsberger Allee 45', array['tiefbau'], 'tiefbau', 'premium', 'https://www.green-careers.de/storage/media/a1984aab-bedf-4554-9ecc-d6e8b6d140bc/TQi67MwceugJtBDpl4egJkBMHWQvNnUPB0Pw08vl.jpg')
    returning id into cid;
  end if;
  if not exists (select 1 from public.stellenanzeigen where slug = 'vollzeit-facharbeiter-unbefristet-in-duisburg') then
    insert into public.stellenanzeigen
      (customer_id, titel, branche, ort, status, beschreibung, beschaeftigungsart, vertragsart, slug, published_at)
    values
      (cid, 'Facharbeiter', 'Tiefbau', 'Duisburg', 'aktiv', 'Facharbeiter (m/w/d) im Straßen-, Tief- & Kanalbau gesucht
- Facharbeiter mit Erfahrung im Tiefbau oder Kanalbau
- Zuverlässig und Interesse an Weiterbildung
- Führerschein min. Klasse B vorhanden', 'Vollzeit', 'Unbefristet', 'vollzeit-facharbeiter-unbefristet-in-duisburg', now());
  end if;

  -- Ackers GmbH · Vorarbeiter (47906 Kempen) · premium
  select id into cid from public.customers where name = 'Ackers GmbH' limit 1;
  if cid is null then
    insert into public.customers (name, ort, plz, strasse, branchen, theme, produkt, logo_url)
    values ('Ackers GmbH', 'Kempen', '47906', 'Stimmesweg 1', array['tiefbau'], 'tiefbau', 'premium', 'https://www.green-careers.de/storage/media/a1c0c4e4-74bc-48fd-8643-ff521cb5c617/UAY2vV2H9NyRmwoIrVKyLeLDPwahunWujbO2sc0l.jpg')
    returning id into cid;
  end if;
  if not exists (select 1 from public.stellenanzeigen where slug = 'vollzeit-vorarbeiter-unbefristet-in-kempen') then
    insert into public.stellenanzeigen
      (customer_id, titel, branche, ort, status, beschreibung, beschaeftigungsart, vertragsart, slug, published_at)
    values
      (cid, 'Vorarbeiter', 'Tiefbau', 'Kempen', 'aktiv', 'Wir suchen einen Vorarbeiter im Bereich Tiefbau. Als zentraler Bestandteil unseres Unternehmens übernehmen Sie die Leitung eines Teams und sorgen für die reibungslose Durchführung von Klein- und Großbaustellen. 

Ihre Hauptaufgaben umfassen die Organisation und Umsetzung von- Klein und Großbaustellen. Sie sind verantwortlich für ein kleines Team und koordinieren die täglichen Arbeitsabläufe. 

Diese Position ist in Vollzeit angesetzt und der Einsatz erfolgt an verschiedenen Standorten, je nach Projektanforderung. Es handelt sich um eine unbefristete Anstellung. Ihr Engagement und Ihre Führungsstärke tragen wesentlich zum Erfolg unserer Bauvorhaben bei.

Quereinsteiger gerne gesehen.', 'Vollzeit', 'Unbefristet', 'vollzeit-vorarbeiter-unbefristet-in-kempen', now());
  end if;

  -- GPInfra Ingenieurgesellschaft PartG mbB · Bauzeichner Tiefbau (50827 Köln) · premium
  select id into cid from public.customers where name = 'GPInfra Ingenieurgesellschaft PartG mbB' limit 1;
  if cid is null then
    insert into public.customers (name, ort, plz, strasse, branchen, theme, produkt, logo_url)
    values ('GPInfra Ingenieurgesellschaft PartG mbB', 'Köln', '50827', 'Köhlstraße 10', array['tiefbau'], 'tiefbau', 'premium', 'https://www.green-careers.de/storage/media/a1c280bb-ac66-42dc-a5b3-92c7f5b6e9ea/tZkRrYSX3SRNg3h3OZnRIWRMTNsUbLQZlCXc3M0R.png')
    returning id into cid;
  end if;
  if not exists (select 1 from public.stellenanzeigen where slug = 'voll-teilzeit-bauzeichner-tiefbau-unbefristet-in-koln') then
    insert into public.stellenanzeigen
      (customer_id, titel, branche, ort, status, beschreibung, beschaeftigungsart, vertragsart, slug, published_at)
    values
      (cid, 'Bauzeichner Tiefbau', 'Tiefbau', 'Köln', 'aktiv', 'Die GPInfra Ingenieurgesellschaft sucht zur Verstärkung des Teams im Bereich Infrastrukturplanung einen Bauzeichner (m/w/d) für Infrastruktur- und Straßenplanung.
In Ihrer Rolle als Bauzeichner:In erstellen Sie detaillierte 2D- und 3D-Pläne für Verkehrsanlagen, Entwässerungs- sowie Außen- und Freianlagen. Sie arbeiten mit verschiedenen spezialisierten Programmen wie BricsCad, Vestra und AutoTurn. Es gibt eine enge Zusammenarbeit mit Kollegen aus der Planung und Bauüberwachung zur Unterstützung bei der erfolgreichen Abwicklung unserer Projekte. Eigenverantwortliches Arbeiten ist ein fester Bestandteils in Ihrer Tätigkeit.

Diese Position kann in Voll- oder Teilzeit angetreten werden.', 'Voll-/ Teilzeit', 'Unbefristet', 'voll-teilzeit-bauzeichner-tiefbau-unbefristet-in-koln', now());
  end if;

  -- Wieczorek Tief- und Pflasterbau GmbH · Abrechnung / Vermessung (83134 Prutting) · smart
  select id into cid from public.customers where name = 'Wieczorek Tief- und Pflasterbau GmbH' limit 1;
  if cid is null then
    insert into public.customers (name, ort, plz, strasse, branchen, theme, produkt, logo_url)
    values ('Wieczorek Tief- und Pflasterbau GmbH', 'Prutting', '83134', 'Finkenweg 3', array['tiefbau'], 'tiefbau', 'smart', 'https://www.green-careers.de/storage/media/a18ed5e1-b4d7-41a7-9aac-003026e2bc8d/GMtJRiEisg5eKhiCym0swPJ8ZThSF9AXgBPgcVbv.png')
    returning id into cid;
  end if;
  if not exists (select 1 from public.stellenanzeigen where slug = 'vollzeit-abrechnung-vermessung-unbefristet-in-prutting-4') then
    insert into public.stellenanzeigen
      (customer_id, titel, branche, ort, status, beschreibung, beschaeftigungsart, vertragsart, slug, published_at)
    values
      (cid, 'Abrechnung / Vermessung', 'Tiefbau', 'Prutting', 'aktiv', 'Wir sind ein modernes und leistungsstarkes Unternehmen im Bereich Tief-, Straßen- und Pflasterbau. Mit einem engagierten Team realisieren wir anspruchsvolle Projekte für öffentliche und private Auftraggeber. Zur Verstärkung unseres Teams suchen wir zum nächstmöglichen Zeitpunkt einen zuverlässigen und motivierten Vermesser / Abrechner (m/w/d).', 'Vollzeit', 'Unbefristet', 'vollzeit-abrechnung-vermessung-unbefristet-in-prutting-4', now());
  end if;

  -- Billstein jun. Bauunternehmen GmbH & Co. KG · Baggerfahrer (47800 Krefeld) · smart
  select id into cid from public.customers where name = 'Billstein jun. Bauunternehmen GmbH & Co. KG' limit 1;
  if cid is null then
    insert into public.customers (name, ort, plz, strasse, branchen, theme, produkt, logo_url)
    values ('Billstein jun. Bauunternehmen GmbH & Co. KG', 'Krefeld', '47800', 'Emil- Schäfer-Str.71', array['tiefbau'], 'tiefbau', 'smart', 'https://www.green-careers.de/storage/media/a1ef1a2d-de1b-45b6-9232-9bea4b51e96e/mgpwUk1HL5hBytOCmFHMA1EhE48eaeGhiJqI1GVP.png')
    returning id into cid;
  end if;
  if not exists (select 1 from public.stellenanzeigen where slug = 'vollzeit-baggerfahrer-unbefristet-in-krefeld') then
    insert into public.stellenanzeigen
      (customer_id, titel, branche, ort, status, beschreibung, beschaeftigungsart, vertragsart, slug, published_at)
    values
      (cid, 'Baggerfahrer', 'Tiefbau', 'Krefeld', 'aktiv', 'Baggerfahrer / Baumaschinenführer mit LKW-Führerschein CE (m/w/d)

Du sitzt nicht nur gerne auf dem Bagger, sondern packst auch mit an, wenn es auf der Baustelle darauf ankommt? Dann bist du bei uns genau richtig.

Als Baggerfahrer bei Billstein Bau bist du Teil eines eingespielten Teams und arbeitest an abwechslungsreichen Projekten im Tief- und Straßenbau. Du bedienst moderne Baumaschinen, führst Erd- und Aushubarbeiten durch und sorgst dafür, dass unsere Baustellen reibungslos laufen. Dank deines Führerscheins der Klasse CE transportierst du bei Bedarf Maschinen, Materialien oder Geräte sicher zur Baustelle.

Dabei suchen wir keinen reinen Maschinenführer, sondern einen echten Teamplayer, der selbstständig arbeitet, Verantwortung übernimmt und auch mal vom Bagger steigt, um das Team bei anfallenden Arbeiten auf der Baustelle zu unterstützen.

Was dich erwartet? Ein familiäres Bauunternehmen mit kurzen Entscheidungswegen, modernen Maschinen und abwechslungsreichen Projekten in der Region. Bei uns kennt man sich persönlich, arbeitet auf Augenhöhe und kann sich aufeinander verlassen.

Wenn du Erfahrung im Tief- und Straßenbau mitbringst, gerne eigenverantwortlich arbeitest und einen Arbeitsplatz suchst, an dem deine Leistung geschätzt wird, dann freuen wir uns darauf, dich kennenzulernen.

Bewirb dich jetzt und werde Teil unseres Teams!', 'Vollzeit', 'Unbefristet', 'vollzeit-baggerfahrer-unbefristet-in-krefeld', now());
  end if;

  -- Verkehrstechnik Potsdam GmbH · Kolonnenführer Tiefbau (14558 Nuthetal) · premium
  select id into cid from public.customers where name = 'Verkehrstechnik Potsdam GmbH' limit 1;
  if cid is null then
    insert into public.customers (name, ort, plz, strasse, branchen, theme, produkt, logo_url)
    values ('Verkehrstechnik Potsdam GmbH', 'Nuthetal', '14558', 'Schlüterstr. 6', array['tiefbau'], 'tiefbau', 'premium', 'https://www.green-careers.de/storage/media/a2077f65-7e80-4205-823b-600a93cf80cf/ESzlshZkGTLhQecDHhRjlAtIqtCyQZMRdWbiEkxG.jpg')
    returning id into cid;
  end if;
  if not exists (select 1 from public.stellenanzeigen where slug = 'vollzeit-kolonnenfuhrer-tiefbau-unbefristet-in-nuthetal') then
    insert into public.stellenanzeigen
      (customer_id, titel, branche, ort, status, beschreibung, beschaeftigungsart, vertragsart, slug, published_at)
    values
      (cid, 'Kolonnenführer Tiefbau', 'Tiefbau', 'Nuthetal', 'aktiv', 'Deine Aufgaben bei uns:
- Führung der Kolonne: Du leitest dein Team auf der Baustelle an und teilst 
   die tägliche Arbeit ein.
- Baustellen abwickeln: Du organisierst den Ablauf im Tiefbau
- Pläne umsetzen: Du liest Baupläne und setzt diese mit deinem Team 
   genau um.

Du bringst mit:
- Erfahrung im Tiefbau: Du hast eine Ausbildung als Tiefbaufacharbeiter 
   oder Betonbauer
- Führungskraft: Du hast idealerweise schon als Vorarbeiter oder 
   Kolonnenführer gearbeitet.
- Durchblick: Du kannst Baupläne sicher lesen und verstehen.
- Führerschein: Du besitzt mindestens den Führerschein der Klasse B 
   (Klasse BE oder C1E ist noch besser)
- Teamgeist: Du bist zuverlässig, packst selbst mit an und motivierst deine 
    Kollegen

Das bieten wir dir:
- Gutes Geld: Eine attraktive Vergütung und Zusatzleistungen
- Sicherer Job: Vollzeit, unbefristetes Arbeitsverhältnis
- spannende Projekte im regionalen Umfeld
- Moderner Fuhrpark: Du arbeitest mit modernen Maschinen, Baggern und 
   Werkzeugen. Firmenfahrzeug, auch zur privaten Nutzung.
- Bildung: Weiterbildungsmöglichkeiten und Entwicklungsperspektiven
- Team: Ein eingespieltes und motiviertes Team, das zusammenhält.', 'Vollzeit', 'Unbefristet', 'vollzeit-kolonnenfuhrer-tiefbau-unbefristet-in-nuthetal', now());
  end if;

  -- Uwe Jahns GmbH Straßen und Tiefbau · Meister/ Techniker / Ingenieur (66914 Waldmohr) · premium
  select id into cid from public.customers where name = 'Uwe Jahns GmbH Straßen und Tiefbau' limit 1;
  if cid is null then
    insert into public.customers (name, ort, plz, strasse, branchen, theme, produkt, logo_url)
    values ('Uwe Jahns GmbH Straßen und Tiefbau', 'Waldmohr', '66914', 'Industriestraße 15', array['strassenbau'], 'tiefbau', 'premium', 'https://www.green-careers.de/storage/media/a1ff5c75-82f6-4bd6-809d-1ad4d956528b/JFyzLPe9FvOIjWV7fkrgQxuWUdRA8mt05eCNzJ77.png')
    returning id into cid;
  end if;
  if not exists (select 1 from public.stellenanzeigen where slug = 'vollzeit-meister-techniker-ingenieur-unbefristet-in-waldmohr') then
    insert into public.stellenanzeigen
      (customer_id, titel, branche, ort, status, beschreibung, beschaeftigungsart, vertragsart, slug, published_at)
    values
      (cid, 'Meister/ Techniker / Ingenieur', 'Straßenbau', 'Waldmohr', 'aktiv', 'Wir suchen einen qualifizierten, Meister Techniker oder Ingenieur im Bereich Straßenbau. In dieser Rolle übernehmen Sie eine zentrale Funktion bei der Planung und Umsetzung unserer Bauprojekte. Sie sind verantwortlich für das Erstellen von Angeboten und Massenermittlungen, sowie für die Überwachung der Baustellen. Darüber hinaus arbeiten Sie eng mit Vorgesetzten und Kollegen zusammen, um einen reibungslosen Projektablauf sicherzustellen.

Zu Ihren Hauptaufgaben zählen die Materialbestellung, die Aufmaßer undstellung die Abrechnung von Projekten. Die effektive Kommunikation mit Auftraggebern, Behörden und Lieferanten ist ebenfalls ein wesentlicher Bestandteil Ihrer Arbeit.

Diese Position ist in Vollzeit zu besetzen und bietet die Möglichkeit, Ihre  Fachkenntnisse in einem dynamischen Umfeld zu nutzen und weiterzuentwickeln. Der genaue Vertragsrahmen wird individuell und in Absprache festgelegt.', 'Vollzeit', 'Unbefristet', 'vollzeit-meister-techniker-ingenieur-unbefristet-in-waldmohr', now());
  end if;

end $$;
