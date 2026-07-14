-- dialogue scenarios: a third item kind with its own jsonb payload
alter table public.items drop constraint items_kind_check;
alter table public.items add constraint items_kind_check check (kind in ('vocab', 'grammar', 'dialog'));
alter table public.items add column if not exists dialog jsonb;
