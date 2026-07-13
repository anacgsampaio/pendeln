-- pendeln item bank: same shape as pipeline bank.json (doc 07 — swappable store).
-- The laptop pipeline pushes items; the web app reads them and owns SRS state.

create table public.weeks (
  user_id uuid not null references auth.users (id) on delete cascade,
  label text not null,
  ingested_at timestamptz not null default now(),
  themes jsonb not null default '[]',
  primary key (user_id, label)
);

create table public.items (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null, -- "vocab:die umwelt" / "grammar:gp_konjunktiv2"
  kind text not null check (kind in ('vocab', 'grammar')),
  week text not null,
  vocab jsonb,
  grammar jsonb,
  exercises jsonb not null default '[]',
  srs jsonb not null,
  recent_fails int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create index items_week_idx on public.items (user_id, week);

alter table public.weeks enable row level security;
alter table public.items enable row level security;

create policy "own weeks" on public.weeks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own items" on public.items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
