-- ============================================================
-- Follow Requests (for private accounts)
-- ============================================================

create table if not exists public.follow_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid references public.profiles(id) on delete cascade not null,
  target_id uuid references public.profiles(id) on delete cascade not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz default now(),
  unique(requester_id, target_id)
);

alter table public.follow_requests enable row level security;

-- Users can view their own sent or received requests
drop policy if exists "Users can view own follow requests" on public.follow_requests;
create policy "Users can view own follow requests"
  on public.follow_requests for select
  using (auth.uid() = requester_id or auth.uid() = target_id);

-- Authenticated users can send follow requests
drop policy if exists "Users can send follow requests" on public.follow_requests;
create policy "Users can send follow requests"
  on public.follow_requests for insert
  with check (
    auth.uid() = requester_id
    and requester_id != target_id
  );

-- Target user can update (accept/reject) the request
drop policy if exists "Target can respond to follow requests" on public.follow_requests;
create policy "Target can respond to follow requests"
  on public.follow_requests for update
  using (auth.uid() = target_id);

-- Users can delete their own sent requests (cancel) or received requests
drop policy if exists "Users can delete follow requests" on public.follow_requests;
create policy "Users can delete follow requests"
  on public.follow_requests for delete
  using (auth.uid() = requester_id or auth.uid() = target_id);

create index if not exists follow_requests_requester_idx on public.follow_requests (requester_id);
create index if not exists follow_requests_target_idx on public.follow_requests (target_id);
create index if not exists follow_requests_pending_idx on public.follow_requests (target_id, status) where status = 'pending';

-- ============================================================
-- Update follows policy to allow following private users who accepted
-- ============================================================

-- Drop the old restrictive follow policy
drop policy if exists "Users can follow" on public.follows;

-- New policy: can follow public profiles directly, OR private profiles if they accepted a follow request
create policy "Users can follow"
  on public.follows for insert
  with check (
    auth.uid() = follower_id
    and follower_id != following_id
    and (
      -- Public profiles can be followed directly
      exists (
        select 1 from public.profiles
        where profiles.id = following_id
        and profiles.shelf_public = true
      )
      or
      -- Private profiles where a follow request was accepted
      exists (
        select 1 from public.follow_requests
        where follow_requests.requester_id = follower_id
        and follow_requests.target_id = following_id
        and follow_requests.status = 'accepted'
      )
    )
  );
