-- A coller dans Supabase > SQL Editor > Run (une seule fois)

alter table public.profiles
  add column if not exists emoji text not null default '😊';
