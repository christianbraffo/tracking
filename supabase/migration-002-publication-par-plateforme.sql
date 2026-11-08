-- A coller dans Supabase > SQL Editor > Run (une seule fois)

alter table public.posts
  add column if not exists published jsonb not null default '{}'::jsonb;

-- reprise des posts deja publies : toutes leurs plateformes comptent comme publiees
update public.posts
set published = (
  select coalesce(jsonb_object_agg(p, coalesce(posted_at, created_at)), '{}'::jsonb)
  from unnest(platforms) as p
)
where status = 'done' and published = '{}'::jsonb;
