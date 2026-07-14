-- Wealth Tracker — Grundschema (Phase 1)
-- Alle Tabellen sind pro Nutzer (user_id) via Row Level Security abgesichert.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Depots / Konten
-- ---------------------------------------------------------------------------
create table if not exists public.accounts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  type        text not null default 'broker'
              check (type in ('broker', 'crypto', 'cash', 'other')),
  currency    text not null default 'EUR',
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Instrumente (Aktien, ETFs, Krypto, Bargeld)
-- Ein Instrument gehört dem Nutzer; das eindeutige Kurs-Symbol steckt in
-- yahoo_symbol (Aktien/ETF) bzw. coingecko_id (Krypto).
-- ---------------------------------------------------------------------------
create table if not exists public.instruments (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  kind           text not null check (kind in ('stock', 'etf', 'crypto', 'cash')),
  name           text not null,
  display_symbol text,          -- Ticker wie im Broker (z. B. "669", "NOVO B")
  yahoo_symbol   text,          -- eindeutiges Yahoo-Symbol (z. B. "0669.HK")
  coingecko_id   text,          -- eindeutige CoinGecko-ID (z. B. "bitcoin")
  currency       text not null default 'EUR',
  exchange       text,
  logo_url       text,
  created_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Transaktionen — die einzige Wahrheitsquelle für Positionen.
-- Positionen werden IMMER aus Transaktionen berechnet, nie fest gespeichert.
-- ---------------------------------------------------------------------------
create table if not exists public.transactions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  account_id    uuid not null references public.accounts (id) on delete cascade,
  instrument_id uuid references public.instruments (id) on delete set null,
  type          text not null
                check (type in ('buy', 'sell', 'dividend', 'deposit', 'withdrawal', 'fee')),
  trade_date    date not null,
  quantity      numeric,        -- Stückzahl (buy/sell)
  price         numeric,        -- Kurs je Stück in instrument.currency
  amount        numeric,        -- Gesamtbetrag (Dividende, Ein-/Auszahlung)
  fees          numeric not null default 0,
  currency      text not null default 'EUR',
  note          text,
  created_at    timestamptz not null default now()
);

create index if not exists transactions_account_idx    on public.transactions (account_id);
create index if not exists transactions_instrument_idx on public.transactions (instrument_id);

-- ---------------------------------------------------------------------------
-- Letzter bekannter Kurs je Instrument (wird in Phase 2 automatisch befüllt).
-- ---------------------------------------------------------------------------
create table if not exists public.prices (
  instrument_id uuid primary key references public.instruments (id) on delete cascade,
  price         numeric not null,
  currency      text not null default 'EUR',
  change_pct_1d numeric,        -- Tagesveränderung in %
  as_of         timestamptz not null default now(),
  source        text
);

-- ---------------------------------------------------------------------------
-- Wechselkurse relativ zu EUR (Basis immer EUR).
-- rate = wie viele Einheiten der Fremdwährung 1 EUR entsprechen.
-- ---------------------------------------------------------------------------
create table if not exists public.fx_rates (
  quote  text primary key,      -- z. B. 'USD', 'HKD', 'JPY'
  rate   numeric not null,      -- 1 EUR = rate * quote
  as_of  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row Level Security: jeder sieht ausschließlich seine eigenen Daten.
-- ---------------------------------------------------------------------------
alter table public.accounts     enable row level security;
alter table public.instruments  enable row level security;
alter table public.transactions enable row level security;
alter table public.prices       enable row level security;
alter table public.fx_rates     enable row level security;

-- accounts
create policy "accounts_select" on public.accounts for select using (auth.uid() = user_id);
create policy "accounts_insert" on public.accounts for insert with check (auth.uid() = user_id);
create policy "accounts_update" on public.accounts for update using (auth.uid() = user_id);
create policy "accounts_delete" on public.accounts for delete using (auth.uid() = user_id);

-- instruments
create policy "instruments_select" on public.instruments for select using (auth.uid() = user_id);
create policy "instruments_insert" on public.instruments for insert with check (auth.uid() = user_id);
create policy "instruments_update" on public.instruments for update using (auth.uid() = user_id);
create policy "instruments_delete" on public.instruments for delete using (auth.uid() = user_id);

-- transactions
create policy "transactions_select" on public.transactions for select using (auth.uid() = user_id);
create policy "transactions_insert" on public.transactions for insert with check (auth.uid() = user_id);
create policy "transactions_update" on public.transactions for update using (auth.uid() = user_id);
create policy "transactions_delete" on public.transactions for delete using (auth.uid() = user_id);

-- prices: sichtbar/änderbar, wenn das zugehörige Instrument dem Nutzer gehört
create policy "prices_select" on public.prices for select
  using (exists (select 1 from public.instruments i
                 where i.id = prices.instrument_id and i.user_id = auth.uid()));
create policy "prices_write" on public.prices for all
  using (exists (select 1 from public.instruments i
                 where i.id = prices.instrument_id and i.user_id = auth.uid()))
  with check (exists (select 1 from public.instruments i
                 where i.id = prices.instrument_id and i.user_id = auth.uid()));

-- fx_rates: für alle angemeldeten Nutzer lesbar (globale Marktdaten)
create policy "fx_rates_select" on public.fx_rates for select using (auth.role() = 'authenticated');
