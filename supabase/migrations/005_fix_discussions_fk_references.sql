-- Fix: discussions tables need FK references to public.profiles, not auth.users
-- This is required so Supabase PostgREST joins (e.g. creator:creator_id(reader_name, avatar_url)) work correctly.

-- Also ensure library customization columns exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS shelf_accent_color TEXT DEFAULT 'gold';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS shelf_show_currently_reading BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS shelf_show_stats BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS shelf_bio_override TEXT;

-- Drop old tables (they have wrong FK refs to auth.users)
DROP TABLE IF EXISTS public.discussion_posts CASCADE;
DROP TABLE IF EXISTS public.discussion_members CASCADE;
DROP TABLE IF EXISTS public.discussions CASCADE;

-- Recreate with correct FK references to public.profiles(id)

-- Discussion Groups (Marginalia)
CREATE TABLE public.discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  book_title TEXT,
  book_author TEXT,
  book_cover_url TEXT,
  accent_color TEXT DEFAULT 'gold',
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.discussions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public discussions"
  ON public.discussions FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can create discussions"
  ON public.discussions FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update discussions"
  ON public.discussions FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete discussions"
  ON public.discussions FOR DELETE
  USING (auth.uid() = creator_id);

CREATE INDEX discussions_creator_idx ON public.discussions (creator_id);
CREATE INDEX discussions_created_at_idx ON public.discussions (created_at DESC);

-- Discussion Members
CREATE TABLE public.discussion_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID REFERENCES public.discussions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(discussion_id, user_id)
);

ALTER TABLE public.discussion_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view discussion members"
  ON public.discussion_members FOR SELECT
  USING (true);

CREATE POLICY "Users can join discussions"
  ON public.discussion_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave discussions"
  ON public.discussion_members FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX discussion_members_discussion_idx ON public.discussion_members (discussion_id);
CREATE INDEX discussion_members_user_idx ON public.discussion_members (user_id);

-- Discussion Posts
CREATE TABLE public.discussion_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID REFERENCES public.discussions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.discussion_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view discussion posts"
  ON public.discussion_posts FOR SELECT
  USING (true);

CREATE POLICY "Members can post in discussions"
  ON public.discussion_posts FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.discussion_members
      WHERE discussion_members.discussion_id = discussion_posts.discussion_id
      AND discussion_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own posts"
  ON public.discussion_posts FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX discussion_posts_discussion_idx ON public.discussion_posts (discussion_id);
CREATE INDEX discussion_posts_created_at_idx ON public.discussion_posts (created_at);
