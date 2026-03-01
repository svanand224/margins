-- Add shelf customization columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS shelf_accent_color TEXT DEFAULT 'gold';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS shelf_show_currently_reading BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS shelf_show_stats BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS shelf_featured_book_ids TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS shelf_bio_override TEXT;
