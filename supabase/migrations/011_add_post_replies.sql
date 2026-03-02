-- Migration 011: Add parent_id to discussion_posts for threaded replies
-- Run this in the Supabase SQL Editor

-- Add parent_id column for thread replies
alter table public.discussion_posts add column if not exists parent_id uuid references public.discussion_posts(id) on delete cascade;

-- Index for efficiently fetching replies to a post
create index if not exists discussion_posts_parent_idx on public.discussion_posts (parent_id) where parent_id is not null;
