-- Migration 010: Add reactions and pinned messages to discussions
-- Run this in the Supabase SQL Editor

-- 1. Post reactions table (heart, upvote, downvote)
create table if not exists public.post_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.discussion_posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  reaction_type text not null check (reaction_type in ('heart', 'upvote', 'downvote')),
  created_at timestamptz default now(),
  unique(post_id, user_id, reaction_type)
);

alter table public.post_reactions enable row level security;

-- Anyone can view reactions
drop policy if exists "Anyone can view reactions" on public.post_reactions;
create policy "Anyone can view reactions"
  on public.post_reactions for select
  using (true);

-- Authenticated users can add reactions
drop policy if exists "Users can add reactions" on public.post_reactions;
create policy "Users can add reactions"
  on public.post_reactions for insert
  with check (auth.uid() = user_id);

-- Users can remove their own reactions
drop policy if exists "Users can remove own reactions" on public.post_reactions;
create policy "Users can remove own reactions"
  on public.post_reactions for delete
  using (auth.uid() = user_id);

create index if not exists post_reactions_post_idx on public.post_reactions (post_id);
create index if not exists post_reactions_user_idx on public.post_reactions (user_id);

-- 2. Add is_pinned column to discussion_posts
alter table public.discussion_posts add column if not exists is_pinned boolean not null default false;
alter table public.discussion_posts add column if not exists pinned_at timestamptz;
alter table public.discussion_posts add column if not exists pinned_by uuid references public.profiles(id);

-- Index for efficiently fetching pinned posts
create index if not exists discussion_posts_pinned_idx on public.discussion_posts (discussion_id, is_pinned) where is_pinned = true;

-- Enable realtime on discussion_posts (skip if already enabled)
-- Run this only if you haven't already: alter publication supabase_realtime add table public.discussion_posts;
