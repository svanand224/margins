-- Discussion threads (book club / collab threads)
CREATE TABLE IF NOT EXISTS discussions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  book_title TEXT,
  book_author TEXT,
  book_cover_url TEXT,
  accent_color TEXT DEFAULT 'gold',
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Discussion replies / posts
CREATE TABLE IF NOT EXISTS discussion_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  discussion_id UUID NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Discussion members
CREATE TABLE IF NOT EXISTS discussion_members (
  discussion_id UUID NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (discussion_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_discussions_creator ON discussions(creator_id);
CREATE INDEX IF NOT EXISTS idx_discussion_posts_discussion ON discussion_posts(discussion_id);
CREATE INDEX IF NOT EXISTS idx_discussion_members_user ON discussion_members(user_id);

-- RLS
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_members ENABLE ROW LEVEL SECURITY;

-- Discussions: public ones readable by all, own ones editable
CREATE POLICY "Public discussions are viewable by everyone"
  ON discussions FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can create discussions"
  ON discussions FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update own discussions"
  ON discussions FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete own discussions"
  ON discussions FOR DELETE
  USING (auth.uid() = creator_id);

-- Posts: viewable if discussion is public, insertable by members
CREATE POLICY "Posts in public discussions are viewable"
  ON discussion_posts FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM discussions d WHERE d.id = discussion_id AND d.is_public = true)
  );

CREATE POLICY "Members can create posts"
  ON discussion_posts FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM discussion_members dm WHERE dm.discussion_id = discussion_posts.discussion_id AND dm.user_id = auth.uid())
  );

CREATE POLICY "Users can delete own posts"
  ON discussion_posts FOR DELETE
  USING (auth.uid() = user_id);

-- Members
CREATE POLICY "Members viewable by all"
  ON discussion_members FOR SELECT
  USING (true);

CREATE POLICY "Users can join public discussions"
  ON discussion_members FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM discussions d WHERE d.id = discussion_id AND d.is_public = true)
  );

CREATE POLICY "Users can leave discussions"
  ON discussion_members FOR DELETE
  USING (auth.uid() = user_id);
