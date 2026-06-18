-- =========================================================
-- GreenCareers OS · Seed-Bilder Tiefbau-Portal (Cover + Logo)
-- In den Supabase SQL Editor + Run. Idempotent. Reines UPDATE per Firmenname.
-- titelbild = Karten-Cover im Portal. coalesce -> vorhandene Bilder (z.B. IDH,
-- manuell gepflegt) werden NICHT ueberschrieben.
-- =========================================================

update public.customers set
  titelbild = coalesce(nullif(titelbild,''), 'https://www.green-careers.de/storage/media/a15e574a-ea1f-4b08-b5c5-eebaabb237ee/cSLsj0Z2fo9QiEp8GaxI7wvfXIECLoOnrBvli4A4.png'),
  unternehmensbilder = case when coalesce(array_length(unternehmensbilder,1),0)=0 then array['https://www.green-careers.de/storage/media/a15e574a-ea1f-4b08-b5c5-eebaabb237ee/cSLsj0Z2fo9QiEp8GaxI7wvfXIECLoOnrBvli4A4.png'] else unternehmensbilder end,
  logo_url = coalesce(nullif(logo_url,''), 'https://www.green-careers.de/storage/media/a15e574a-ac4c-439d-b1ae-b8569b069a3c/Pd31C1ckyr0zThfu72wY83tGd5nI666cpgWDuFpU.jpg')
where name = 'Gebr. Donhauser Bau GmbH & Co.KG';
update public.customers set
  titelbild = coalesce(nullif(titelbild,''), 'https://www.green-careers.de/storage/media/a1625beb-dbf2-4384-9681-e595ba99c32d/MTHXU8odUfdxRTj5vOCOFWM9GZlUfL6LDFY56PYh.jpg'),
  unternehmensbilder = case when coalesce(array_length(unternehmensbilder,1),0)=0 then array['https://www.green-careers.de/storage/media/a1625beb-dbf2-4384-9681-e595ba99c32d/MTHXU8odUfdxRTj5vOCOFWM9GZlUfL6LDFY56PYh.jpg'] else unternehmensbilder end,
  logo_url = coalesce(nullif(logo_url,''), 'https://www.green-careers.de/storage/media/a1625be9-2446-42ba-a53a-c275e1c6c62e/Cwlw89sHbxYVHsX2Aa84PulhFKHThjaMyB78vSAe.jpg')
where name = 'IDH-Innovative Dienstleistungen Habers GmbH';
update public.customers set
  titelbild = coalesce(nullif(titelbild,''), 'https://www.green-careers.de/storage/media/a1984aad-59a8-4ba9-ba3b-577f869de7f8/izTTO6r3NghFeF8ovb3nSv9jz62TlWBUX1OdwBSB.jpg'),
  unternehmensbilder = case when coalesce(array_length(unternehmensbilder,1),0)=0 then array['https://www.green-careers.de/storage/media/a1984aad-59a8-4ba9-ba3b-577f869de7f8/izTTO6r3NghFeF8ovb3nSv9jz62TlWBUX1OdwBSB.jpg'] else unternehmensbilder end,
  logo_url = coalesce(nullif(logo_url,''), 'https://www.green-careers.de/storage/media/a1984aab-bedf-4554-9ecc-d6e8b6d140bc/TQi67MwceugJtBDpl4egJkBMHWQvNnUPB0Pw08vl.jpg')
where name = 'Wilhelm Weier GmbH & Co. KG';
update public.customers set
  titelbild = coalesce(nullif(titelbild,''), 'https://www.green-careers.de/storage/media/a1c0c4e6-2b95-41f0-81a5-08bd8e23e34e/aY8XUcyz6vnxSN5nxUOnDgGGYnj60Dl2WEzfSxX1.jpg'),
  unternehmensbilder = case when coalesce(array_length(unternehmensbilder,1),0)=0 then array['https://www.green-careers.de/storage/media/a1c0c4e6-2b95-41f0-81a5-08bd8e23e34e/aY8XUcyz6vnxSN5nxUOnDgGGYnj60Dl2WEzfSxX1.jpg'] else unternehmensbilder end,
  logo_url = coalesce(nullif(logo_url,''), 'https://www.green-careers.de/storage/media/a1c0c4e4-74bc-48fd-8643-ff521cb5c617/UAY2vV2H9NyRmwoIrVKyLeLDPwahunWujbO2sc0l.jpg')
where name = 'Ackers GmbH';
update public.customers set
  titelbild = coalesce(nullif(titelbild,''), 'https://www.green-careers.de/storage/media/a19cc20d-8249-45d2-961f-401ab75cd984/ZejVSFcSTtmlHU9IioQo4ZlSs8TYHvbNgN5vlxVX.jpg'),
  unternehmensbilder = case when coalesce(array_length(unternehmensbilder,1),0)=0 then array['https://www.green-careers.de/storage/media/a19cc20d-8249-45d2-961f-401ab75cd984/ZejVSFcSTtmlHU9IioQo4ZlSs8TYHvbNgN5vlxVX.jpg'] else unternehmensbilder end,
  logo_url = coalesce(nullif(logo_url,''), 'https://www.green-careers.de/storage/media/a1c280bb-ac66-42dc-a5b3-92c7f5b6e9ea/tZkRrYSX3SRNg3h3OZnRIWRMTNsUbLQZlCXc3M0R.png')
where name = 'GPInfra Ingenieurgesellschaft PartG mbB';
update public.customers set
  titelbild = coalesce(nullif(titelbild,''), 'https://www.green-careers.de/storage/media/a1aa9e7a-4250-479a-bcdd-62fdb81c2b0a/z6jEfthnqS8yFfVjqkOT1r4lrUQvJsa8CZSQJk0x.png'),
  unternehmensbilder = case when coalesce(array_length(unternehmensbilder,1),0)=0 then array['https://www.green-careers.de/storage/media/a1aa9e7a-4250-479a-bcdd-62fdb81c2b0a/z6jEfthnqS8yFfVjqkOT1r4lrUQvJsa8CZSQJk0x.png'] else unternehmensbilder end,
  logo_url = coalesce(nullif(logo_url,''), 'https://www.green-careers.de/storage/media/a18ed5e1-b4d7-41a7-9aac-003026e2bc8d/GMtJRiEisg5eKhiCym0swPJ8ZThSF9AXgBPgcVbv.png')
where name = 'Wieczorek Tief- und Pflasterbau GmbH';
update public.customers set
  titelbild = coalesce(nullif(titelbild,''), 'https://www.green-careers.de/storage/media/a1ef1a2e-bb7d-4156-bd1f-38eaedf94a8b/1ITOkuVGwCzJJJs43mbG2itr2gl4jKX1MWOBMFhN.jpg'),
  unternehmensbilder = case when coalesce(array_length(unternehmensbilder,1),0)=0 then array['https://www.green-careers.de/storage/media/a1ef1a2e-bb7d-4156-bd1f-38eaedf94a8b/1ITOkuVGwCzJJJs43mbG2itr2gl4jKX1MWOBMFhN.jpg'] else unternehmensbilder end,
  logo_url = coalesce(nullif(logo_url,''), 'https://www.green-careers.de/storage/media/a1ef1a2d-de1b-45b6-9232-9bea4b51e96e/mgpwUk1HL5hBytOCmFHMA1EhE48eaeGhiJqI1GVP.png')
where name = 'Billstein jun. Bauunternehmen GmbH & Co. KG';
update public.customers set
  titelbild = coalesce(nullif(titelbild,''), 'https://www.green-careers.de/storage/media/a2078729-f69e-4c8a-8b89-27bfb29937ec/r8ueW9BQv557uruk5CNOketTza7pe9fqnRNCfEz6.jpg'),
  unternehmensbilder = case when coalesce(array_length(unternehmensbilder,1),0)=0 then array['https://www.green-careers.de/storage/media/a2078729-f69e-4c8a-8b89-27bfb29937ec/r8ueW9BQv557uruk5CNOketTza7pe9fqnRNCfEz6.jpg'] else unternehmensbilder end,
  logo_url = coalesce(nullif(logo_url,''), 'https://www.green-careers.de/storage/media/a2077f65-7e80-4205-823b-600a93cf80cf/ESzlshZkGTLhQecDHhRjlAtIqtCyQZMRdWbiEkxG.jpg')
where name = 'Verkehrstechnik Potsdam GmbH';
update public.customers set
  titelbild = coalesce(nullif(titelbild,''), 'https://www.green-careers.de/storage/media/a1f92578-38a8-4464-a5ca-ba61bcd17cd5/ySGKOOVtoFINPFhXLHGWKQGZ9lxc8aydVfyQCTEs.png'),
  unternehmensbilder = case when coalesce(array_length(unternehmensbilder,1),0)=0 then array['https://www.green-careers.de/storage/media/a1f92578-38a8-4464-a5ca-ba61bcd17cd5/ySGKOOVtoFINPFhXLHGWKQGZ9lxc8aydVfyQCTEs.png'] else unternehmensbilder end,
  logo_url = coalesce(nullif(logo_url,''), 'https://www.green-careers.de/storage/media/a1ff5c75-82f6-4bd6-809d-1ad4d956528b/JFyzLPe9FvOIjWV7fkrgQxuWUdRA8mt05eCNzJ77.png')
where name = 'Uwe Jahns GmbH Straßen und Tiefbau';
