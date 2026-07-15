-- Verlaufs-Tabelle für Zeitraum-Wertentwicklung (7T/30T/YTD/1J/…).
-- Ein Eintrag pro Instrument und Tag (EUR-Kurs). Wird von der App täglich
-- fortgeschrieben; Krypto wird einmalig aus CoinGecko rückbefüllt.

create table if not exists public.price_history (
  instrument_id uuid not null references public.instruments (id) on delete cascade,
  as_of         date not null,
  price_eur     numeric not null,
  primary key (instrument_id, as_of)
);

create index if not exists price_history_as_of_idx
  on public.price_history (as_of);

alter table public.price_history enable row level security;

-- Sichtbar/änderbar, wenn das zugehörige Instrument dem Nutzer gehört.
drop policy if exists "price_history_select" on public.price_history;
create policy "price_history_select" on public.price_history for select
  using (exists (select 1 from public.instruments i
                 where i.id = price_history.instrument_id and i.user_id = auth.uid()));

drop policy if exists "price_history_write" on public.price_history;
create policy "price_history_write" on public.price_history for all
  using (exists (select 1 from public.instruments i
                 where i.id = price_history.instrument_id and i.user_id = auth.uid()))
  with check (exists (select 1 from public.instruments i
                 where i.id = price_history.instrument_id and i.user_id = auth.uid()));
