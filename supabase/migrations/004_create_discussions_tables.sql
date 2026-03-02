-- Migration: Create discussions, discussion_members, discussion_posts tables

-- Discussion Groups (Marginalia)
create table if not exists public.discussions (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  book_title text,
  book_author text,
  book_cover_url text,
  accent_color text default 'gold',
  is_public boolean default true,
  created_at timestamptz default now()
);

alter table public.discussions enable row level security;

drop policy if exists "Anyone can view public discussions" on public.discussions;
create policy "Anyone can view public discussions"
  on public.discussions for select
  using (is_public = true);

drop policy if exists "Users can create discussions" on public.discussions;
create policy "Users can create discussions"
  on public.discussions for insert
  with check (auth.uid() = creator_id);

drop policy if exists "Creators can update discussions" on public.discussions;
create policy "Creators can update discussions"
  on public.discussions for update
  using (auth.uid() = creator_id);

drop policy if exists "Creators can delete discussions" on public.discussions;
create policy "Creators can delete discussions"
  on public.discussions for delete
  using (auth.uid() = creator_id);

create index if not exists discussions_creator_idx on public.discussions (creator_id);
create index if not exists discussions_created_at_idx on public.discussions (created_at desc);

-- Discussion Members
create table if not exists public.discussion_members (
  id uuid primary key default gen_random_uuid(),
  discussion_id uuid references public.discussions(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  joined_at timestamptz default now(),
  unique(discussion_id, user_id)
);

alter table public.discussion_members enable row level security;

drop policy if exists "Anyone can view discussion members" on public.discussion_members;
create policy "Anyone can view discussion members"
  on public.discussion_members for select
  using (true);

drop policy if exists "Users can join discussions" on public.discussion_members;
create policy "Users can join discussions"
  on public.discussion_members for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can leave discussions" on public.discussion_members;
create policy "Users can leave discussions"
  on public.discussion_members for delete
  using (auth.uid() = user_id);

create index if not exists discussion_members_discussion_idx on public.discussion_members (discussion_id);
create index if not exists discussion_members_user_idx on public.discussion_members (user_id);

-- Discussion Posts
create table if not exists public.discussion_posts (
  id uuid primary key default gen_random_uuid(),
  discussion_id uuid references public.discussions(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now()
);

alter table public.discussion_posts enable row level security;

drop policy if exists "Anyone can view discussion posts" on public.discussion_posts;
create policy "Anyone can view discussion posts"
  on public.discussion_posts for select
  using (true);

drop policy if exists "Members can post in discussions" on public.discussion_posts;
create policy "Members can post in discussions"
  on public.discussion_posts for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.discussion_members
      where discussion_members.discussion_id = discussion_posts.discussion_id
      and discussion_members.user_id = auth.uid()
    )
  );

drop policy if exists "Users can delete own posts" on public.discussion_posts;
create policy "Users can delete own posts"
  on public.discussion_posts for delete
  using (auth.uid() = user_id);

create index if not exists discussion_posts_discussion_idx on public.discussion_posts (discussion_id);
create index if not exists discussion_posts_created_at_idx on public.discussion_posts (created_at);
