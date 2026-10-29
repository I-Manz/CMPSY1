-- À coller dans Supabase > SQL Editor > Run (une seule fois)
create table public.sessions (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id bigint not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);
alter table public.sessions enable row level security;
create policy "mes sessions" on public.sessions
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
