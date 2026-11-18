-- Wklej całość do Supabase: SQL Editor -> New query -> Run

-- Głosy oddane przez gości (jeden wiersz = jeden głos)
create table if not exists votes (
  id bigint generated always as identity primary key,
  video_id text not null,
  title text not null,
  channel text,
  thumbnail_url text,
  created_at timestamptz not null default now()
);
create index if not exists votes_video_id_idx on votes (video_id);

-- Pamięć podręczna wyników wyszukiwania (oszczędza limit YouTube)
create table if not exists search_cache (
  query text primary key,
  results jsonb not null,
  created_at timestamptz not null default now()
);

-- Zamknięcie tabel dla świata: dostęp ma tylko klucz service_role
-- (używany po stronie serwera i w Twoim skrypcie lokalnym).
alter table votes enable row level security;
alter table search_cache enable row level security;
