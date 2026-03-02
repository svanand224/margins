-- Default new users to public profiles (better social experience)
alter table public.profiles alter column shelf_public set default true;

-- Update handle_new_user to set shelf_public = true explicitly
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

  insert into public.profiles (id, reader_name, first_name, last_name, email, username, shelf_public)
  values (
    new.id,
    trim(fname || ' ' || lname),
    fname,
    lname,
    new.email,
    coalesce(
      nullif(new.raw_user_meta_data->>'username', ''),
      lower(regexp_replace(
        coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
        '[^a-z0-9_]', '_', 'gi'
      )) || '_' || substr(gen_random_uuid()::text, 1, 4)
    ),
    true
  );
  return new;
end;
$$ language plpgsql security definer;

-- Allow all profiles to be discoverable in explore (basic info only enforced by app)
-- This lets private users appear in search results
drop policy if exists "Anyone can view all profiles for discovery" on public.profiles;
create policy "Anyone can view all profiles for discovery"
  on public.profiles for select
  using (true);
