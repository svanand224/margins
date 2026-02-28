-- ============================================================
-- Margins — Reading Tracker: Supabase Database Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. Profiles table (extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  reader_name text not null default '',
  email text,
  avatar_url text,
  bio text default '',
  favorite_genre text default '',
  -- Store the full reading data as JSONB for simple sync
  -- This contains: { books, goals, dailyLogs, threads }
  reading_data jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Enable Row Level Security
alter table public.profiles enable row level security;

-- 3. RLS Policies: users can only access their own profile
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "Users can delete own profile" on public.profiles;
create policy "Users can delete own profile"
  on public.profiles for delete
  using (auth.uid() = id);

-- 4. Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, reader_name, email)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

-- Drop existing trigger if it exists, then create
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. Auto-update the updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_profile_updated on public.profiles;
create trigger on_profile_updated
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- 6. Create index for faster lookups
create index if not exists profiles_email_idx on public.profiles (email);

-- 7. Public bookshelves
-- Add public_slug column for shareable profile URLs
alter table public.profiles add column if not exists public_slug text unique;
alter table public.profiles add column if not exists shelf_public boolean default false;

create index if not exists profiles_public_slug_idx on public.profiles (public_slug);

-- Allow anyone to view profiles that have shelf_public = true (for public bookshelves)
drop policy if exists "Anyone can view public shelves" on public.profiles;
create policy "Anyone can view public shelves"
  on public.profiles for select
  using (shelf_public = true);

-- 8. Supabase Storage bucket for avatars
-- NOTE: You must create the 'avatars' bucket manually in the Supabase Dashboard:
--   1. Go to Storage in your Supabase dashboard
--   2. Click "New bucket"
--   3. Name it "avatars"
--   4. Check "Public bucket"
--   5. Click "Create bucket"
-- Then run the policies below:

-- Allow authenticated users to upload their own avatar
drop policy if exists "Users can upload own avatar" on storage.objects;
create policy "Users can upload own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to update (overwrite) their own avatar
drop policy if exists "Users can update own avatar" on storage.objects;
create policy "Users can update own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow anyone to view avatars (public bucket)
drop policy if exists "Anyone can view avatars" on storage.objects;
create policy "Anyone can view avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- ============================================================
-- 9. Comments / Discussions on public shelves
-- ============================================================

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade not null,  -- whose shelf this is on
  author_id uuid references public.profiles(id) on delete cascade not null,   -- who wrote the comment
  content text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.comments enable row level security;

-- Anyone can view comments on public shelves
drop policy if exists "Anyone can view comments on public shelves" on public.comments;
create policy "Anyone can view comments on public shelves"
  on public.comments for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = comments.profile_id
      and profiles.shelf_public = true
    )
  );

-- Authenticated users can post comments on public shelves
drop policy if exists "Users can post comments" on public.comments;
create policy "Users can post comments"
  on public.comments for insert
  with check (
    auth.uid() = author_id
    and exists (
      select 1 from public.profiles
      where profiles.id = profile_id
      and profiles.shelf_public = true
    )
  );

-- Users can update their own comments
drop policy if exists "Users can update own comments" on public.comments;
create policy "Users can update own comments"
  on public.comments for update
  using (auth.uid() = author_id);

-- Users can delete their own comments, or profile owner can delete comments on their shelf
drop policy if exists "Users can delete comments" on public.comments;
create policy "Users can delete comments"
  on public.comments for delete
  using (auth.uid() = author_id or auth.uid() = profile_id);

-- Index for faster comment lookups
create index if not exists comments_profile_id_idx on public.comments (profile_id);
create index if not exists comments_author_id_idx on public.comments (author_id);

-- Auto-update timestamp for comments
drop trigger if exists on_comment_updated on public.comments;
create trigger on_comment_updated
  before update on public.comments
  for each row execute procedure public.handle_updated_at();

-- ============================================================
-- 10. Follow System (Instagram-like)
-- ============================================================

create table if not exists public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid references public.profiles(id) on delete cascade not null,
  following_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(follower_id, following_id)
);

alter table public.follows enable row level security;

-- Anyone can see follow relationships for public profiles
drop policy if exists "Anyone can view follows" on public.follows;
create policy "Anyone can view follows"
  on public.follows for select
  using (true);

-- Authenticated users can follow public profiles
drop policy if exists "Users can follow" on public.follows;
create policy "Users can follow"
  on public.follows for insert
  with check (
    auth.uid() = follower_id
    and follower_id != following_id
    and exists (
      select 1 from public.profiles
      where profiles.id = following_id
      and profiles.shelf_public = true
    )
  );

-- Users can unfollow
drop policy if exists "Users can unfollow" on public.follows;
create policy "Users can unfollow"
  on public.follows for delete
  using (auth.uid() = follower_id);

create index if not exists follows_follower_idx on public.follows (follower_id);
create index if not exists follows_following_idx on public.follows (following_id);

-- ============================================================
-- 11. Book Recommendations (Letterboxd-style)
-- ============================================================

create table if not exists public.recommendations (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid references public.profiles(id) on delete cascade not null,
  to_user_id uuid references public.profiles(id) on delete cascade not null,
  book_title text not null,
  book_author text,
  book_cover_url text,
  book_isbn text,
  message text,  -- "I think you'd love this because..."
  status text default 'pending',  -- pending, accepted, dismissed
  created_at timestamptz default now()
);

alter table public.recommendations enable row level security;

-- Users can see recommendations they sent or received
drop policy if exists "Users can view own recommendations" on public.recommendations;
create policy "Users can view own recommendations"
  on public.recommendations for select
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);

-- Users can send recommendations
drop policy if exists "Users can send recommendations" on public.recommendations;
create policy "Users can send recommendations"
  on public.recommendations for insert
  with check (auth.uid() = from_user_id and from_user_id != to_user_id);

-- Recipients can update status (accept/dismiss)
drop policy if exists "Recipients can update recommendations" on public.recommendations;
create policy "Recipients can update recommendations"
  on public.recommendations for update
  using (auth.uid() = to_user_id);

-- Users can delete recommendations they sent
drop policy if exists "Users can delete sent recommendations" on public.recommendations;
create policy "Users can delete sent recommendations"
  on public.recommendations for delete
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);

create index if not exists recommendations_to_user_idx on public.recommendations (to_user_id);
create index if not exists recommendations_from_user_idx on public.recommendations (from_user_id);

-- ============================================================
-- 12. Activity Feed (for social features)
-- ============================================================

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null,  -- 'started_reading', 'finished_book', 'rated_book', 'followed', 'recommended'
  data jsonb not null default '{}',  -- flexible data storage for different activity types
  created_at timestamptz default now()
);

alter table public.activities enable row level security;

-- Anyone can view activities of public profiles
drop policy if exists "Anyone can view public activities" on public.activities;
create policy "Anyone can view public activities"
  on public.activities for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = activities.user_id
      and profiles.shelf_public = true
    )
    or auth.uid() = user_id
  );

-- Users can create their own activities
drop policy if exists "Users can create activities" on public.activities;
create policy "Users can create activities"
  on public.activities for insert
  with check (auth.uid() = user_id);

-- Users can delete their own activities
drop policy if exists "Users can delete own activities" on public.activities;
create policy "Users can delete own activities"
  on public.activities for delete
  using (auth.uid() = user_id);

create index if not exists activities_user_id_idx on public.activities (user_id);
create index if not exists activities_created_at_idx on public.activities (created_at desc);

-- ============================================================
-- 13. Notifications
-- ============================================================

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null,  -- 'new_follower', 'new_recommendation', 'new_comment'
  from_user_id uuid references public.profiles(id) on delete cascade,
  data jsonb not null default '{}',
  read boolean default false,
  created_at timestamptz default now()
);

alter table public.notifications enable row level security;

-- Users can only see their own notifications
drop policy if exists "Users can view own notifications" on public.notifications;
create policy "Users can view own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

-- System/other users can create notifications
drop policy if exists "Anyone can create notifications" on public.notifications;
create policy "Anyone can create notifications"
  on public.notifications for insert
  with check (true);

-- Users can update (mark as read) their own notifications
drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

-- Users can delete their own notifications
drop policy if exists "Users can delete own notifications" on public.notifications;
create policy "Users can delete own notifications"
  on public.notifications for delete
  using (auth.uid() = user_id);

create index if not exists notifications_user_id_idx on public.notifications (user_id);
create index if not exists notifications_unread_idx on public.notifications (user_id, read) where read = false;
