-- A coller dans Supabase > SQL Editor > Run (une seule fois)

alter table public.posts add column if not exists scheduled_for date;

create table if not exists public.reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  unique (post_id, user_id, emoji)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

alter table public.reactions enable row level security;
alter table public.comments enable row level security;
alter table public.ideas enable row level security;

create policy "reactions read" on public.reactions for select to authenticated using (true);
create policy "reactions insert own" on public.reactions for insert to authenticated with check (user_id = auth.uid());
create policy "reactions delete own" on public.reactions for delete to authenticated using (user_id = auth.uid());

create policy "comments read" on public.comments for select to authenticated using (true);
create policy "comments insert own" on public.comments for insert to authenticated with check (user_id = auth.uid());
create policy "comments delete own" on public.comments for delete to authenticated using (user_id = auth.uid());

create policy "ideas read" on public.ideas for select to authenticated using (true);
create policy "ideas insert own" on public.ideas for insert to authenticated with check (user_id = auth.uid());
create policy "ideas delete own" on public.ideas for delete to authenticated using (user_id = auth.uid());

alter publication supabase_realtime add table public.reactions;
alter publication supabase_realtime add table public.comments;
alter publication supabase_realtime add table public.ideas;
