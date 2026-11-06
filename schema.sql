-- Maidan cloud career saves (optional). Run in the Supabase SQL Editor.
-- This table stores one active career save per authenticated user.
create table if not exists public.player_saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  save_data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.player_saves enable row level security;

-- Users can only read and modify their own career save.
drop policy if exists "Players can read their own Maidan save" on public.player_saves;
create policy "Players can read their own Maidan save"
  on public.player_saves for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Players can insert their own Maidan save" on public.player_saves;
create policy "Players can insert their own Maidan save"
  on public.player_saves for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Players can update their own Maidan save" on public.player_saves;
create policy "Players can update their own Maidan save"
  on public.player_saves for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- No public/anonymous access is granted by these policies.
