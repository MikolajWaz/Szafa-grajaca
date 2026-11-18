-- Wklej do Supabase: SQL Editor -> New query -> Run
create table if not exists settings (
  key text primary key,
  value text not null
);
insert into settings (key, value) values ('active', 'false')
  on conflict (key) do nothing;
alter table settings enable row level security;
grant all on table public.settings to service_role;
