-- Migration 016: Fix infinite recursion in discussions / discussion_members RLS policies
--
-- Problem: discussions SELECT policy queries discussion_members, whose SELECT policy
-- queries discussions back → infinite recursion.
--
-- Fix: use SECURITY DEFINER helper functions that bypass RLS for the cross-table
-- lookups, breaking the circular dependency.

-- 1. Helper: check if a user is a member of a given discussion (bypasses RLS)
create or replace function public.is_discussion_member(p_discussion_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.discussion_members
    where discussion_id = p_discussion_id
      and user_id = p_user_id
  );
$$;

-- 2. Helper: get discussion visibility info without triggering discussions RLS
create or replace function public.get_discussion_access(p_discussion_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.discussions
    where id = p_discussion_id
      and (
        is_public = true
        or creator_id = p_user_id
      )
  );
$$;

-- ============================================================
-- 3. Rewrite discussions SELECT policy (no more query to discussion_members directly)
-- ============================================================
drop policy if exists "Anyone can view public discussions" on public.discussions;
drop policy if exists "Users can view public or their private discussions" on public.discussions;

create policy "Users can view public or their private discussions"
  on public.discussions for select
  using (
    is_public = true
    or creator_id = auth.uid()
    or public.is_discussion_member(id, auth.uid())
  );

-- ============================================================
-- 4. Rewrite discussion_members SELECT policy (no more query to discussions directly)
-- ============================================================
drop policy if exists "Anyone can view discussion members" on public.discussion_members;
drop policy if exists "Members can view discussion members" on public.discussion_members;

create policy "Members can view discussion members"
  on public.discussion_members for select
  using (
    public.get_discussion_access(discussion_id, auth.uid())
    or public.is_discussion_member(discussion_id, auth.uid())
  );

-- ============================================================
-- 5. Rewrite discussion_posts SELECT policy (use helpers)
-- ============================================================
drop policy if exists "Anyone can view discussion posts" on public.discussion_posts;
drop policy if exists "Members can view discussion posts" on public.discussion_posts;

create policy "Members can view discussion posts"
  on public.discussion_posts for select
  using (
    public.get_discussion_access(discussion_id, auth.uid())
    or public.is_discussion_member(discussion_id, auth.uid())
  );

-- ============================================================
-- 6. Rewrite post_reactions SELECT policy (use helpers)
-- ============================================================
drop policy if exists "Anyone can view reactions" on public.post_reactions;
drop policy if exists "Members can view reactions" on public.post_reactions;

create policy "Members can view reactions"
  on public.post_reactions for select
  using (
    exists (
      select 1 from public.discussion_posts
      where discussion_posts.id = post_reactions.post_id
        and (
          public.get_discussion_access(discussion_posts.discussion_id, auth.uid())
          or public.is_discussion_member(discussion_posts.discussion_id, auth.uid())
        )
    )
  );

-- ============================================================
-- 7. Rewrite discussion_members INSERT policy (use helper for discussions check)
-- ============================================================
drop policy if exists "Users can join or be added to discussions" on public.discussion_members;
drop policy if exists "Users can join discussions" on public.discussion_members;
drop policy if exists "Users can join public or be invited to private" on public.discussion_members;

create policy "Users can join public or be invited to private"
  on public.discussion_members for insert
  with check (
    -- Self-join: only allowed for public discussions
    (
      auth.uid() = user_id
      and exists (
        select 1 from public.discussions
        where discussions.id = discussion_id
          and discussions.is_public = true
      )
    )
    -- Creator can invite anyone
    or exists (
      select 1 from public.discussions
      where discussions.id = discussion_id
        and discussions.creator_id = auth.uid()
    )
  );

-- ============================================================
-- 8. Rewrite discussion_posts INSERT policy (use helper)
-- ============================================================
drop policy if exists "Members can post in discussions" on public.discussion_posts;

create policy "Members can post in discussions"
  on public.discussion_posts for insert
  with check (
    auth.uid() = user_id
    and public.is_discussion_member(discussion_id, auth.uid())
  );
