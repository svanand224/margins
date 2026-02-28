-- Migration: create dms table and RLS policies

create table if not exists public.dms (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references public.profiles(id) on delete cascade not null,
  recipient_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now()
);

alter table public.dms enable row level security;

-- Only sender or recipient can select messages
drop policy if exists "select_dms_for_participants" on public.dms;
create policy "select_dms_for_participants"
  on public.dms for select
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

-- Only authenticated user may insert messages where sender_id = auth.uid()
drop policy if exists "insert_dms_by_sender" on public.dms;
create policy "insert_dms_by_sender"
  on public.dms for insert
  with check (auth.uid() = sender_id and sender_id != recipient_id);

-- Users can delete messages they sent
drop policy if exists "delete_own_dms" on public.dms;
create policy "delete_own_dms"
  on public.dms for delete
  using (auth.uid() = sender_id);

create index if not exists dms_sender_idx on public.dms (sender_id);
create index if not exists dms_recipient_idx on public.dms (recipient_id);
create index if not exists dms_created_at_idx on public.dms (created_at);
