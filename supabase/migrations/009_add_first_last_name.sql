-- Migration 009: Add first_name and last_name columns to profiles
-- Run this in the Supabase SQL Editor

-- 1. Add first_name and last_name columns
alter table public.profiles add column if not exists first_name text not null default '';
alter table public.profiles add column if not exists last_name text not null default '';

-- 2. Backfill from existing reader_name
-- Sets first_name to everything before the first space, last_name to the rest
update public.profiles
set
  first_name = case
    when reader_name like '% %' then split_part(reader_name, ' ', 1)
    else reader_name
  end,
  last_name = case
    when reader_name like '% %' then trim(substring(reader_name from position(' ' in reader_name) + 1))
    else ''
  end
where first_name = '' and reader_name != '';

-- 3. Update the handle_new_user trigger to store first_name and last_name
create or replace function public.handle_new_user()
returns trigger as $$
declare
  full_name text;
  fname text;
  lname text;
begin
  full_name := coalesce(
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );

  -- Extract first and last name
  fname := coalesce(new.raw_user_meta_data->>'first_name', '');
  lname := coalesce(new.raw_user_meta_data->>'last_name', '');

  -- If first/last name not provided separately, split the full name
  if fname = '' then
    if full_name like '% %' then
      fname := split_part(full_name, ' ', 1);
      lname := trim(substring(full_name from position(' ' in full_name) + 1));
    else
      fname := full_name;
      lname := '';
    end if;
  end if;

  insert into public.profiles (id, reader_name, first_name, last_name, email, username)
  values (
    new.id,
    trim(fname || ' ' || lname),
    fname,
    lname,
    new.email,
    coalesce(
      nullif(new.raw_user_meta_data->>'username', ''),
      lower(regexp_replace(
        coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
        '[^a-z0-9_]', '_', 'gi'
      )) || '_' || substr(new.id::text, 1, 4)
    )
  );
  return new;
end;
$$ language plpgsql security definer;
