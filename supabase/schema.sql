-- Run this file in Supabase Dashboard → SQL Editor.
-- Sentence data is readable only after sign-in. page_views is intentionally
-- public so the assignment can demonstrate how different RLS policies work.

create extension if not exists vector;

create table if not exists public.sentence_embeddings (
    id uuid primary key default gen_random_uuid(),
    talk_id uuid not null,
    title text not null,
    speaker text,
    calling text,
    year integer,
    season text,
    url text,
    sentence_num integer,
    text text not null,
    embedding vector(1536),
    created_at timestamptz default now()
);

create index if not exists sentence_embeddings_talk_id_idx
    on public.sentence_embeddings(talk_id);

alter table public.sentence_embeddings enable row level security;

drop policy if exists "Allow authenticated users to read" on public.sentence_embeddings;
create policy "Allow authenticated users to read"
    on public.sentence_embeddings for select
    to authenticated
    using (true);

create table if not exists public.page_views (
    id uuid primary key default gen_random_uuid(),
    visited_at timestamptz default now(),
    page_url text,
    user_agent text
);

alter table public.page_views enable row level security;

drop policy if exists "Allow public inserts" on public.page_views;
create policy "Allow public inserts"
    on public.page_views for insert
    to anon, authenticated
    with check (true);

drop policy if exists "Allow public reads" on public.page_views;
create policy "Allow public reads"
    on public.page_views for select
    to anon, authenticated
    using (true);

create or replace function public.match_sentences(
    query_embedding vector(1536),
    match_count integer default 20
)
returns table (
    id uuid,
    talk_id uuid,
    title text,
    speaker text,
    url text,
    text text,
    similarity double precision
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
    select
        s.id,
        s.talk_id,
        s.title,
        s.speaker,
        s.url,
        s.text,
        1 - (s.embedding <=> query_embedding) as similarity
    from public.sentence_embeddings as s
    where s.embedding is not null
    order by s.embedding <=> query_embedding
    limit least(greatest(match_count, 1), 100);
$$;

grant select on public.sentence_embeddings to authenticated;
grant select, insert, update, delete on public.sentence_embeddings to service_role;
grant select, insert on public.page_views to anon, authenticated;
revoke all on function public.match_sentences(vector, integer) from public, anon;
grant execute on function public.match_sentences(vector, integer) to authenticated;
