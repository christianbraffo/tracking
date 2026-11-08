-- A coller dans Supabase > SQL Editor > Run (une seule fois)

alter table public.posts
  add column if not exists theme text;
