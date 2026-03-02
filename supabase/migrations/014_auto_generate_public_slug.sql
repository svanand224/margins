-- Auto-generate public_slug from username for all users at signup
-- and backfill existing users who have null public_slug

-- 1. Backfill existing users: set public_slug = username where it's currently null
update public.profiles
set public_slug = username
where public_slug is null and username is not null;

-- 2. Update handle_new_user to auto-generate public_slug from username
create or replace function public.handle_new_user()
returns trigger as $$
declare
  full_name text;
  fname text;
  lname text;
  uname text;
begin
  full_name := coalesce(
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );

  fname := coalesce(new.raw_user_meta_data->>'first_name', '');
  lname := coalesce(new.raw_user_meta_data->>'last_name', '');

  if fname = '' then
    if full_name like '% %' then
      fname := split_part(full_name, ' ', 1);
      lname := trim(substring(full_name from position(' ' in full_name) + 1));
    else
      fname := full_name;
      lname := '';
    end if;
  end if;

  uname := coalesce(
    nullif(new.raw_user_meta_data->>'username', ''),
    lower(regexp_replace(
      coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
      '[^a-z0-9_]', '_', 'gi'
    )) || '_' || substr(gen_random_uuid()::text, 1, 4)
  );

  insert into public.profiles (id, reader_name, first_name, last_name, email, username, shelf_public, public_slug)
  values (
    new.id,
    trim(fname || ' ' || lname),
    fname,
    lname,
    new.email,
    uname,
    true,
    uname
  );
  return new;
end;
$$ language plpgsql security definer;
