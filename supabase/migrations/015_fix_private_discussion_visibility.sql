-- Migration 015: Fix private discussion visibility
-- Private discussion posts, members, and reactions should only be visible
-- to members/creators. Only public discussions are searchable by everyone.

-- 1. Fix discussion_members visibility: only show members of public discussions,
--    or private discussions the user is part of
drop policy if exists "Anyone can view discussion members" on public.discussion_members;
drop policy if exists "Members can view discussion members" on public.discussion_members;
create policy "Members can view discussion members"
  on public.discussion_members for select
  using (
    exists (
      select 1 from public.discussions
      where discussions.id = discussion_members.discussion_id
      and discussions.is_public = true
    )
    or exists (
      select 1 from public.discussion_members as dm
      where dm.discussion_id = discussion_members.discussion_id
      and dm.user_id = auth.uid()
    )
    or exists (
      select 1 from public.discussions
      where discussions.id = discussion_members.discussion_id
      and discussions.creator_id = auth.uid()
    )
  );

-- 2. Fix discussion_posts visibility: only show posts from public discussions,
--    or private discussions the user is a member of
drop policy if exists "Anyone can view discussion posts" on public.discussion_posts;
drop policy if exists "Members can view discussion posts" on public.discussion_posts;
create policy "Members can view discussion posts"
  on public.discussion_posts for select
  using (
    exists (
      select 1 from public.discussions
      where discussions.id = discussion_posts.discussion_id
      and discussions.is_public = true
    )
    or exists (
      select 1 from public.discussion_members
      where discussion_members.discussion_id = discussion_posts.discussion_id
      and discussion_members.user_id = auth.uid()
    )
    or exists (
      select 1 from public.discussions
      where discussions.id = discussion_posts.discussion_id
      and discussions.creator_id = auth.uid()
    )
  );

-- 3. Fix post_reactions visibility: only show reactions from posts in
--    public discussions or private discussions the user is part of
drop policy if exists "Anyone can view reactions" on public.post_reactions;
drop policy if exists "Members can view reactions" on public.post_reactions;
create policy "Members can view reactions"
  on public.post_reactions for select
  using (
    exists (
      select 1 from public.discussion_posts
      join public.discussions on discussions.id = discussion_posts.discussion_id
      where discussion_posts.id = post_reactions.post_id
      and (
        discussions.is_public = true
        or discussions.creator_id = auth.uid()
        or exists (
          select 1 from public.discussion_members
          where discussion_members.discussion_id = discussions.id
          and discussion_members.user_id = auth.uid()
        )
      )
    )
  );

-- 4. Restrict self-joining: users can only self-join PUBLIC discussions.
--    For private discussions, only the creator can add members (invite).
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
    -- Creator can add (invite) anyone to their discussions
    or exists (
      select 1 from public.discussions
      where discussions.id = discussion_id
      and discussions.creator_id = auth.uid()
    )
  );
