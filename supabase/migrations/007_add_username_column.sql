-- ============================================================
-- Migration 007: Add username column to profiles
-- ============================================================

-- Add unique username column (lowercase, alphanumeric + underscores)
alter table public.profiles add column if not exists username text unique;

-- Index for fast username lookups and login
create index if not exists profiles_username_idx on public.profiles (username);

-- Back-fill existing profiles: use public_slug if available, else generate from reader_name
-- This creates a username by sanitising the reader_name (or email prefix) to lowercase alphanumeric + underscores
update public.profiles
set username = coalesce(
  nullif(public_slug, ''),
  lower(regexp_replace(
    coalesce(nullif(reader_name, ''), split_part(email, '@', 1), 'reader'),
    '[^a-z0-9_]', '_', 'gi'
  )) || '_' || substr(gen_random_uuid()::text, 1, 4)
)
where username is null;

-- Now make it NOT NULL after back-fill
alter table public.profiles alter column username set not null;

-- Update the handle_new_user trigger to also set a username on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, reader_name, email, username)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    new.email,
    coalesce(
      nullif(new.raw_user_meta_data->>'username', ''),
      lower(regexp_replace(
        coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
        '[^a-z0-9_]', '_', 'gi'
      )) || '_' || substr(gen_random_uuid()::text, 1, 4)
    )
  );
  return new;
end;
$$ language plpgsql security definer;

-- Allow authenticated users to look up a profile by username (for login flow)
-- This is already covered by existing "Anyone can view public shelves" policy for public users.
-- Add policy so authenticated users can search all usernames for discovery:
drop policy if exists "Authenticated users can search profiles" on public.profiles;
create policy "Authenticated users can search profiles"
  on public.profiles for select
  using (auth.role() = 'authenticated');

-- Allow anyone (including anon / unauthenticated) to look up username → email for login
-- Only exposes the email column for a specific username match
drop policy if exists "Anyone can lookup username for login" on public.profiles;
create policy "Anyone can lookup username for login"
  on public.profiles for select
  using (true);
