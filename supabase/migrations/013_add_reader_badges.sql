-- ============================================================
-- 013: Reader Badges (Top Reader of the Week, Confetti, etc.)
-- ============================================================

-- Add badges column to profiles (JSONB array of earned badges)
-- Each badge: { id, type, label, week, awarded_at, awarded_by? }
alter table public.profiles add column if not exists badges jsonb not null default '[]'::jsonb;

-- Example badge structure:
-- [
--   {
--     "id": "top-reader-2026-W09",
--     "type": "top_reader",
--     "label": "Top 5 Reader of the Week",
--     "rank": 1,
--     "week": "2026-W09",
--     "awarded_at": "2026-03-02T00:00:00Z"
--   },
--   {
--     "id": "confetti-abc123",
--     "type": "confetti",
--     "label": "Confetti from Sasha",
--     "from_user_name": "Sasha",
--     "from_user_id": "uuid...",
--     "awarded_at": "2026-03-02T00:00:00Z"
--   }
-- ]
