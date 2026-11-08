-- A coller dans Supabase > SQL Editor > Run

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  weekly_goal int not null default 3
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  text text not null,
  platforms text[] not null default '{}',
  status text not null default 'todo' check (status in ('todo','done')),
  created_at timestamptz not null default now(),
  posted_at timestamptz,
  published jsonb not null default '{}'::jsonb
);

-- profil cree automatiquement a l'inscription
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''));
  return new;
end $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.posts enable row level security;

-- tout utilisateur connecte lit tout (vous deux), n'ecrit que le sien
create policy "profiles read" on public.profiles for select to authenticated using (true);
create policy "profiles update own" on public.profiles for update to authenticated using (id = auth.uid());

create policy "posts read" on public.posts for select to authenticated using (true);
create policy "posts insert own" on public.posts for insert to authenticated with check (user_id = auth.uid());
create policy "posts update own" on public.posts for update to authenticated using (user_id = auth.uid());
create policy "posts delete own" on public.posts for delete to authenticated using (user_id = auth.uid());

-- temps reel
alter publication supabase_realtime add table public.posts;
