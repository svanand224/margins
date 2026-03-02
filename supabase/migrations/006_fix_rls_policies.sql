-- Fix: Allow discussion members to SELECT their private discussions
DROP POLICY IF EXISTS "Anyone can view public discussions" ON public.discussions;
DROP POLICY IF EXISTS "Users can view public or their private discussions" ON public.discussions;
CREATE POLICY "Users can view public or their private discussions"
  ON public.discussions FOR SELECT
  USING (
    is_public = true
    OR creator_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.discussion_members
      WHERE discussion_members.discussion_id = discussions.id
      AND discussion_members.user_id = auth.uid()
    )
  );

-- Fix: Allow discussion creators to add members (not just self-join)
DROP POLICY IF EXISTS "Users can join discussions" ON public.discussion_members;
DROP POLICY IF EXISTS "Users can join or be added to discussions" ON public.discussion_members;
CREATE POLICY "Users can join or be added to discussions"
  ON public.discussion_members FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.discussions
      WHERE discussions.id = discussion_id
      AND discussions.creator_id = auth.uid()
    )
  );

-- Fix: Allow following any user regardless of shelf_public
DROP POLICY IF EXISTS "Users can follow others" ON public.follows;
DROP POLICY IF EXISTS "Users can follow others" ON public.follows;
CREATE POLICY "Users can follow others"
  ON public.follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id AND follower_id != following_id);
