-- Wklej do Supabase: SQL Editor -> New query -> Run
-- Przygotowuje bazę na głosy ze Spotify i dodaje przełącznik "ukryj explicit dla gości".
-- Można uruchomić bezpiecznie kilka razy.

alter table votes add column if not exists source text not null default 'youtube';
alter table votes add column if not exists artist text;
alter table votes add column if not exists explicit boolean;
alter table votes add column if not exists spotify_url text;

insert into settings (key, value) values ('hide_explicit', 'true')
  on conflict (key) do nothing;

-- stare wyniki wyszukiwania z YouTube nie są już potrzebne
delete from search_cache where query not like 'sp:%';
