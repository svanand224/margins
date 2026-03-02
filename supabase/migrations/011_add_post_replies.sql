-- Add parent_id column for threaded replies
alter table public.discussion_posts
  add column if not exists parent_id uuid references public.discussion_posts(id) on delete cascade;

-- Index for fetching replies by parent
create index if not exists idx_discussion_posts_parent_id
  on public.discussion_posts(parent_id)
  where parent_id is not null;