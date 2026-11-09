-- A coller dans Supabase > SQL Editor > Run (relancable sans risque)

create table if not exists public.duo_settings (
  id int primary key default 1 check (id = 1),
  weekly_target int not null default 5 check (weekly_target between 1 and 60)
);

insert into public.duo_settings (id, weekly_target) values (1, 5) on conflict (id) do nothing;

alter table public.duo_settings enable row level security;

drop policy if exists "duo read" on public.duo_settings;
create policy "duo read" on public.duo_settings for select to authenticated using (true);
drop policy if exists "duo update" on public.duo_settings;
create policy "duo update" on public.duo_settings for update to authenticated using (true) with check (true);
drop policy if exists "duo insert" on public.duo_settings;
create policy "duo insert" on public.duo_settings for insert to authenticated with check (id = 1);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'duo_settings'
  ) then
    alter publication supabase_realtime add table public.duo_settings;
  end if;
end $$;
