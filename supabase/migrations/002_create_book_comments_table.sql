-- Migration: create book_comments table for in-book discussions

create table if not exists public.book_comments (
  id uuid primary key default gen_random_uuid(),
  book_id text not null,
  author_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.book_comments enable row level security;

-- Anyone can view book comments
drop policy if exists "Anyone can view book comments" on public.book_comments;
create policy "Anyone can view book comments"
  on public.book_comments for select
  using (true);

-- Authenticated users can post comments as themselves
drop policy if exists "Users can post book comments" on public.book_comments;
create policy "Users can post book comments"
  on public.book_comments for insert
  with check (auth.uid() = author_id);

-- Users can update their own comments
drop policy if exists "Users can update own book comments" on public.book_comments;
create policy "Users can update own book comments"
  on public.book_comments for update
  using (auth.uid() = author_id)
  with check (author_id = auth.uid());

-- Users can delete their own comments
drop policy if exists "Users can delete own book comments" on public.book_comments;
create policy "Users can delete own book comments"
  on public.book_comments for delete
  using (auth.uid() = author_id);

create index if not exists book_comments_book_id_idx on public.book_comments (book_id);
create index if not exists book_comments_author_id_idx on public.book_comments (author_id);

-- Auto-update timestamp for book_comments
drop trigger if exists on_book_comment_updated on public.book_comments;
create trigger on_book_comment_updated
  before update on public.book_comments
  for each row execute procedure public.handle_updated_at();
