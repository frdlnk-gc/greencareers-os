-- AUTOMATISCH GENERIERT von scripts/gen-seed.mjs — nicht direkt bearbeiten.
-- Startdaten (Depots, Instrumente, Transaktionen, Startkurse, FX).

do $$
declare
  uid uuid;
  acc_tr uuid;
  acc_captrader uuid;
  acc_flatex uuid;
  acc_projectx uuid;
  acc_krypto uuid;
  inst uuid;
begin
  select id into uid from auth.users where email = 'frederik.linke@greenfield-digital.de' limit 1;
  if uid is null then
    raise exception 'Kein Auth-Nutzer mit dieser E-Mail gefunden. Bitte zuerst anlegen.';
  end if;

  -- Idempotent: vorhandene Startdaten dieses Nutzers entfernen.
  delete from public.transactions where user_id = uid;
  delete from public.instruments where user_id = uid;
  delete from public.accounts where user_id = uid;

  insert into public.accounts (user_id, name, type, currency, sort_order)
    values (uid, 'Trade Republic', 'broker', 'EUR', 0)
    returning id into acc_tr;
  insert into public.accounts (user_id, name, type, currency, sort_order)
    values (uid, 'CapTrader', 'broker', 'EUR', 1)
    returning id into acc_captrader;
  insert into public.accounts (user_id, name, type, currency, sort_order)
    values (uid, 'Flatex', 'broker', 'EUR', 2)
    returning id into acc_flatex;
  insert into public.accounts (user_id, name, type, currency, sort_order)
    values (uid, 'Project X', 'broker', 'EUR', 3)
    returning id into acc_projectx;
  insert into public.accounts (user_id, name, type, currency, sort_order)
    values (uid, 'Krypto', 'crypto', 'EUR', 4)
    returning id into acc_krypto;

  insert into public.instruments (user_id, kind, name, display_symbol, yahoo_symbol, currency)
    values (uid, 'stock', 'ASML Holding', 'ASML', 'ASML.AS', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_tr, inst, 'buy', date '2023-01-02', 10, 623.690519, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 1555.796000, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, yahoo_symbol, currency)
    values (uid, 'stock', 'Alphabet Inc. Class A', 'GOOGL', 'GOOGL', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_tr, inst, 'buy', date '2023-01-02', 39.97, 111.102056, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 306.675006, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, yahoo_symbol, currency)
    values (uid, 'stock', 'Cloudflare', 'NET', 'NET', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_tr, inst, 'buy', date '2023-01-02', 50, 63.326797, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 229.300000, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, yahoo_symbol, currency)
    values (uid, 'stock', 'BE Semiconductor Industries', 'BESI', 'BESI.AS', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_tr, inst, 'buy', date '2023-01-02', 45, 96.300556, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 251.200000, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, yahoo_symbol, currency)
    values (uid, 'stock', 'Lotus Bakeries', 'LOTB', 'LOTB.BR', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_tr, inst, 'buy', date '2023-01-02', 1, 8628.562431, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 10960.000000, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, yahoo_symbol, currency)
    values (uid, 'stock', 'Novo Nordisk B', 'NOVO B', 'NOVO-B.CO', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_tr, inst, 'buy', date '2023-01-02', 250, 48.201441, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 42.812520, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, yahoo_symbol, currency)
    values (uid, 'stock', 'Merck & Co.', 'MRK', 'MRK', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_tr, inst, 'buy', date '2023-01-02', 77, 131.972789, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 138.571429, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, yahoo_symbol, currency)
    values (uid, 'stock', 'MercadoLibre', 'MELI', 'MELI', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_tr, inst, 'buy', date '2023-01-02', 6, 1759.100293, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 1618.900000, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, yahoo_symbol, currency)
    values (uid, 'stock', 'Constellation Software', 'CSU', 'CSU.TO', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_tr, inst, 'buy', date '2023-01-02', 5, 1686.151079, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 1687.500000, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, yahoo_symbol, currency)
    values (uid, 'stock', 'Moderna', 'MRNA', 'MRNA', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_tr, inst, 'buy', date '2023-01-02', 130, 33.697627, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 59.355000, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, yahoo_symbol, currency)
    values (uid, 'stock', 'PepsiCo', 'PEP', 'PEP', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_tr, inst, 'buy', date '2023-01-02', 60, 130.300097, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 121.140000, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, yahoo_symbol, currency)
    values (uid, 'stock', 'Techtronic Industries', '669', '0669.HK', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_tr, inst, 'buy', date '2023-01-02', 500, 10.930414, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 13.980000, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, yahoo_symbol, currency)
    values (uid, 'stock', 'Medpace Holdings', 'MEDP', 'MEDP', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_tr, inst, 'buy', date '2023-01-02', 15, 264.466572, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 464.800000, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, yahoo_symbol, currency)
    values (uid, 'stock', 'HubSpot', 'HUBS', 'HUBS', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_tr, inst, 'buy', date '2023-01-02', 40, 220.522909, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 173.750000, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, yahoo_symbol, currency)
    values (uid, 'stock', 'Automatic Data Processing', 'ADP', 'ADP', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_tr, inst, 'buy', date '2023-01-02', 30, 153.619679, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 215.666667, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, yahoo_symbol, currency)
    values (uid, 'stock', 'First Financial Bankshares', 'FFIN', 'FFIN', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_captrader, inst, 'buy', date '2023-01-02', 210, 27.969454, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 30.400000, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, yahoo_symbol, currency)
    values (uid, 'stock', 'ServiceNow', 'NOW', 'NOW', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_captrader, inst, 'buy', date '2023-01-02', 70, 96.457999, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 90.140000, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, yahoo_symbol, currency)
    values (uid, 'stock', 'Nurix Therapeutics', 'NRIX', 'NRIX', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_captrader, inst, 'buy', date '2023-01-02', 300, 14.366390, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 19.919000, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, yahoo_symbol, currency)
    values (uid, 'stock', 'Carlisle Companies', 'CSL', 'CSL', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_captrader, inst, 'buy', date '2023-01-02', 20, 308.447730, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 292.100000, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, yahoo_symbol, currency)
    values (uid, 'stock', 'Anta Sports Products', '2020', '2020.HK', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_captrader, inst, 'buy', date '2023-01-02', 700, 9.615429, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 8.301000, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, yahoo_symbol, currency)
    values (uid, 'stock', 'Public Storage', 'PSA', 'PSA', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_captrader, inst, 'buy', date '2023-01-02', 20, 270.584265, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 280.650000, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, yahoo_symbol, currency)
    values (uid, 'stock', 'Shin-Etsu Chemical', '4063', '4063.T', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_captrader, inst, 'buy', date '2023-01-02', 130, 24.679783, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 40.652538, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, yahoo_symbol, currency)
    values (uid, 'stock', 'Microsoft', 'MSFT', 'MSFT', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_captrader, inst, 'buy', date '2023-01-02', 15.9, 279.016005, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 332.168553, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, yahoo_symbol, currency)
    values (uid, 'stock', 'California Water Service', 'CWT', 'CWT', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_captrader, inst, 'buy', date '2023-01-02', 120, 42.313916, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 43.583333, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, yahoo_symbol, currency)
    values (uid, 'stock', 'Reddit', 'RDDT', 'RDDT', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_captrader, inst, 'buy', date '2023-01-02', 30, 144.775493, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 172.500000, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, yahoo_symbol, currency)
    values (uid, 'stock', 'Gorilla Technology Group', 'GRRR', 'GRRR', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_captrader, inst, 'buy', date '2023-01-02', 350, 12.277953, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 14.463429, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, yahoo_symbol, currency)
    values (uid, 'stock', 'Procter & Gamble', 'PG', 'PG', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_captrader, inst, 'buy', date '2023-01-02', 38, 136.091014, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 129.790000, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, yahoo_symbol, currency)
    values (uid, 'stock', 'United Parcel Service', 'UPS', 'UPS', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_captrader, inst, 'buy', date '2023-01-02', 50, 83.483127, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 98.460000, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, yahoo_symbol, currency)
    values (uid, 'stock', 'Hermès International', 'RMS', 'RMS.PA', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_captrader, inst, 'buy', date '2023-01-02', 3, 2255.023397, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 1638.500000, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, yahoo_symbol, currency)
    values (uid, 'stock', 'Diploma', 'DPLM', 'DPLM.L', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_captrader, inst, 'buy', date '2023-01-02', 60, 34.899793, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 80.800000, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, yahoo_symbol, currency)
    values (uid, 'stock', 'LVMH', 'MC', 'MC.PA', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_captrader, inst, 'buy', date '2023-01-02', 10, 517.135372, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 483.625000, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, yahoo_symbol, currency)
    values (uid, 'stock', 'SoFi Technologies', 'SOFI', 'SOFI', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_captrader, inst, 'buy', date '2023-01-02', 300, 15.721305, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 15.998000, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, yahoo_symbol, currency)
    values (uid, 'stock', 'McDonald''s', 'MCD', 'MCD', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_captrader, inst, 'buy', date '2023-01-02', 20, 212.053571, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 237.500000, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, yahoo_symbol, currency)
    values (uid, 'stock', 'Kesko B', 'KESKOB', 'KESKOB.HE', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_captrader, inst, 'buy', date '2023-01-02', 240, 19.043007, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 19.660000, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, yahoo_symbol, currency)
    values (uid, 'stock', 'London Stock Exchange Group', 'LSEG', 'LSEG.L', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_captrader, inst, 'buy', date '2023-01-02', 45, 104.212805, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 103.775111, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, yahoo_symbol, currency)
    values (uid, 'stock', 'DHL Group', 'DHL', 'DHL.DE', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_captrader, inst, 'buy', date '2023-01-02', 80, 43.542238, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 57.110000, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, yahoo_symbol, currency)
    values (uid, 'stock', 'Rivian Automotive', 'RIVN', 'RIVN', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_captrader, inst, 'buy', date '2023-01-02', 300, 14.556548, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 15.149000, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, yahoo_symbol, currency)
    values (uid, 'stock', 'BlackRock', 'BLK', 'BLK', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_captrader, inst, 'buy', date '2023-01-02', 5, 836.522385, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 900.600000, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, yahoo_symbol, currency)
    values (uid, 'stock', 'Bonesupport Holding', 'BONEX', 'BONEX.ST', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_captrader, inst, 'buy', date '2023-01-02', 200, 21.277453, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 21.120000, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, yahoo_symbol, currency)
    values (uid, 'stock', 'Balchem', 'BCPC', 'BCPC', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_captrader, inst, 'buy', date '2023-01-02', 30, 137.049659, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 140.750000, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, yahoo_symbol, currency)
    values (uid, 'stock', '3M', 'MMM', 'MMM', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_captrader, inst, 'buy', date '2023-01-02', 30, 94.936492, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 138.275000, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, yahoo_symbol, currency)
    values (uid, 'stock', 'Colgate-Palmolive', 'CL', 'CL', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_projectx, inst, 'buy', date '2023-01-02', 50, 77.523810, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 81.400000, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, yahoo_symbol, currency)
    values (uid, 'stock', 'Adobe', 'ADBE', 'ADBE', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_projectx, inst, 'buy', date '2023-01-02', 20, 323.755310, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 190.530000, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, yahoo_symbol, currency)
    values (uid, 'stock', 'Synopsys', 'SNPS', 'SNPS', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_projectx, inst, 'buy', date '2023-01-02', 10, 360.461704, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 368.500000, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, yahoo_symbol, currency)
    values (uid, 'stock', 'Hershey', 'HSY', 'HSY', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_projectx, inst, 'buy', date '2023-01-02', 23, 175.953585, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 153.150000, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, yahoo_symbol, currency)
    values (uid, 'stock', 'Mainfreight', 'MFT', 'MFT.NZ', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_projectx, inst, 'buy', date '2023-01-02', 105, 33.020833, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 31.700000, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, yahoo_symbol, currency)
    values (uid, 'stock', 'Joby Aviation', 'JOBY', 'JOBY', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_projectx, inst, 'buy', date '2023-01-02', 500, 8.918955, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 6.625000, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, yahoo_symbol, currency)
    values (uid, 'stock', 'Costco Wholesale', 'COST', 'COST', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_projectx, inst, 'buy', date '2023-01-02', 4, 484.237602, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 809.500000, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, yahoo_symbol, currency)
    values (uid, 'stock', 'Air Products & Chemicals', 'APD', 'APD', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_projectx, inst, 'buy', date '2023-01-02', 12, 253.557008, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 263.750000, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, yahoo_symbol, currency)
    values (uid, 'stock', 'Chugai Pharmaceutical', '4519', '4519.T', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_projectx, inst, 'buy', date '2023-01-02', 80, 25.299613, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 39.265000, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, yahoo_symbol, currency)
    values (uid, 'stock', 'Waste Connections', 'WCN', 'WCN', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_projectx, inst, 'buy', date '2023-01-02', 20, 135.000000, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 148.500000, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, yahoo_symbol, currency)
    values (uid, 'stock', 'Mid-America Apartment Communities', 'MAA', 'MAA', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_flatex, inst, 'buy', date '2023-01-02', 25, 125.809878, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 118.450000, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, yahoo_symbol, currency)
    values (uid, 'stock', 'British American Tobacco', 'BATS', 'BATS.L', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_flatex, inst, 'buy', date '2023-01-02', 49, 37.730331, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 51.600000, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, yahoo_symbol, currency)
    values (uid, 'stock', 'BKW', 'BKW', 'BKW.SW', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_flatex, inst, 'buy', date '2023-01-02', 17, 143.335302, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 145.600000, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, yahoo_symbol, currency)
    values (uid, 'stock', 'Abbott Laboratories', 'ABT', 'ABT', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_flatex, inst, 'buy', date '2023-01-02', 30, 100.415303, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 79.790000, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, yahoo_symbol, currency)
    values (uid, 'stock', 'Wolters Kluwer', 'WKL', 'WKL.AS', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_flatex, inst, 'buy', date '2023-01-02', 21, 152.249747, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 60.230000, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, yahoo_symbol, currency)
    values (uid, 'stock', 'Virgin Galactic', 'SPCE', 'SPCE', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_flatex, inst, 'buy', date '2023-01-02', 500, 4.134377, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 2.166000, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, coingecko_id, currency)
    values (uid, 'crypto', 'Bitcoin', 'BTC', 'bitcoin', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_krypto, inst, 'buy', date '2023-01-02', 0.688, 35232.292034, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 55807.950581, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, coingecko_id, currency)
    values (uid, 'crypto', 'Ethereum', 'ETH', 'ethereum', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_krypto, inst, 'buy', date '2023-01-02', 5.636, 1750.009210, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 1625.058552, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, coingecko_id, currency)
    values (uid, 'crypto', 'Cardano', 'ADA', 'cardano', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_krypto, inst, 'buy', date '2023-01-02', 7018.04, 0.680114, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 0.141668, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, coingecko_id, currency)
    values (uid, 'crypto', 'Aave', 'AAVE', 'aave', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_krypto, inst, 'buy', date '2023-01-02', 8, 148.307785, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 86.107500, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, coingecko_id, currency)
    values (uid, 'crypto', 'Hedera', 'HBAR', 'hedera-hashgraph', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_krypto, inst, 'buy', date '2023-01-02', 10503.99, 0.147563, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 0.059025, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, coingecko_id, currency)
    values (uid, 'crypto', 'Chainlink', 'LINK', 'chainlink', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_krypto, inst, 'buy', date '2023-01-02', 70, 15.757633, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 7.166571, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, coingecko_id, currency)
    values (uid, 'crypto', 'Ocean Protocol', 'OCEAN', 'ocean-protocol', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_krypto, inst, 'buy', date '2023-01-02', 4187.88, 0.478960, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 0.096175, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, coingecko_id, currency)
    values (uid, 'crypto', 'Quant', 'QNT', 'quant-network', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_krypto, inst, 'buy', date '2023-01-02', 6.518, 147.802541, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 56.460571, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, coingecko_id, currency)
    values (uid, 'crypto', 'Avalanche', 'AVAX', 'avalanche-2', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_krypto, inst, 'buy', date '2023-01-02', 57.11, 31.073273, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 5.748555, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, coingecko_id, currency)
    values (uid, 'crypto', 'Uniswap', 'UNI', 'uniswap', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_krypto, inst, 'buy', date '2023-01-02', 66, 13.367729, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 3.226970, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, coingecko_id, currency)
    values (uid, 'crypto', 'The Sandbox', 'SAND', 'the-sandbox', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_krypto, inst, 'buy', date '2023-01-02', 3047.71, 0.409014, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 0.041556, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, coingecko_id, currency)
    values (uid, 'crypto', 'Polkadot', 'DOT', 'polkadot', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_krypto, inst, 'buy', date '2023-01-02', 123.71, 11.436914, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 0.738825, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, coingecko_id, currency)
    values (uid, 'crypto', 'Axie Infinity', 'AXS', 'axie-infinity', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_krypto, inst, 'buy', date '2023-01-02', 98.53, 5.859357, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 0.857810, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, coingecko_id, currency)
    values (uid, 'crypto', 'Kusama', 'KSM', 'kusama', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_krypto, inst, 'buy', date '2023-01-02', 25.08, 38.950627, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 2.897927, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, coingecko_id, currency)
    values (uid, 'crypto', 'Internet Computer', 'ICP', 'internet-computer', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_krypto, inst, 'buy', date '2023-01-02', 33.18, 11.520015, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 1.938819, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, coingecko_id, currency)
    values (uid, 'crypto', 'Cronos', 'CRO', 'crypto-com-chain', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_krypto, inst, 'buy', date '2023-01-02', 1210.1, 0.485207, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 0.048327, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, coingecko_id, currency)
    values (uid, 'crypto', 'Moonriver', 'MOVR', 'moonriver', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_krypto, inst, 'buy', date '2023-01-02', 43.78, 31.557638, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 1.148698, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, coingecko_id, currency)
    values (uid, 'crypto', 'Lisk', 'LSK', 'lisk', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_krypto, inst, 'buy', date '2023-01-02', 660.84, 0.873082, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 0.075434, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, coingecko_id, currency)
    values (uid, 'crypto', 'Band Protocol', 'BAND', 'band-protocol', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_krypto, inst, 'buy', date '2023-01-02', 295.32, 1.500506, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 0.149600, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, coingecko_id, currency)
    values (uid, 'crypto', 'Celestia', 'TIA', 'celestia', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_krypto, inst, 'buy', date '2023-01-02', 120.9, 4.778473, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 0.351696, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, coingecko_id, currency)
    values (uid, 'crypto', 'Polygon (POL)', 'MATIC', 'matic-network', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_krypto, inst, 'buy', date '2023-01-02', 250, 1.600000, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 0.160000, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, coingecko_id, currency)
    values (uid, 'crypto', 'Trias Token', 'TRIAS', 'trias-token', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_krypto, inst, 'buy', date '2023-01-02', 78.64, 10.622275, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 0.300610, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, coingecko_id, currency)
    values (uid, 'crypto', 'Ronin', 'RON', 'ronin', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_krypto, inst, 'buy', date '2023-01-02', 334, 1.732729, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 0.046437, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, coingecko_id, currency)
    values (uid, 'crypto', 'Constellation', 'DAG', 'constellation-labs', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_krypto, inst, 'buy', date '2023-01-02', 2179.8, 0.277431, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 0.007019, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, coingecko_id, currency)
    values (uid, 'crypto', 'Harmony', 'ONE', 'harmony', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_krypto, inst, 'buy', date '2023-01-02', 14638.41, 0.026133, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 0.001004, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, coingecko_id, currency)
    values (uid, 'crypto', 'xMoney (Utrust)', 'UTK', 'utrust', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_krypto, inst, 'buy', date '2023-01-02', 10054, 0.063358, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 0.001267, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, coingecko_id, currency)
    values (uid, 'crypto', 'Aurora', 'AURORA', 'aurora-near', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_krypto, inst, 'buy', date '2023-01-02', 716.21, 0.264862, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 0.017481, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, coingecko_id, currency)
    values (uid, 'crypto', 'Aleph.im', 'ALEPH', 'aleph', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_krypto, inst, 'buy', date '2023-01-02', 1272.52, 0.479533, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 0.008919, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, coingecko_id, currency)
    values (uid, 'crypto', 'Boba Network', 'BOBA', 'boba-network', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_krypto, inst, 'buy', date '2023-01-02', 617.82, 0.305798, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 0.017400, 'EUR', 0, 'seed');
  insert into public.instruments (user_id, kind, name, display_symbol, coingecko_id, currency)
    values (uid, 'crypto', 'Renzo', 'REZ', 'renzo', 'EUR')
    returning id into inst;
  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)
    values (uid, acc_krypto, inst, 'buy', date '2023-01-02', 4392.95, 0.058845, 'EUR');
  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)
    values (inst, 0.002124, 'EUR', 0, 'seed');
end $$;

-- Wechselkurs-Startwerte (1 EUR = rate * Währung).
insert into public.fx_rates (quote, rate) values
  ('USD', 1.08),
  ('HKD', 8.45),
  ('JPY', 170),
  ('DKK', 7.46),
  ('SEK', 11.2),
  ('GBP', 0.85),
  ('CAD', 1.47),
  ('CHF', 0.94)
on conflict (quote) do update set rate = excluded.rate, as_of = now();
