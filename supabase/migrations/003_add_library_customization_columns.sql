-- Add library customization columns to profiles
alter table public.profiles add column if not exists shelf_accent_color text default 'gold';
alter table public.profiles add column if not exists shelf_show_currently_reading boolean default true;
alter table public.profiles add column if not exists shelf_show_stats boolean default true;
alter table public.profiles add column if not exists shelf_bio_override text;
