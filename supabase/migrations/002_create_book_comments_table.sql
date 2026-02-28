-- Book comments table removed

-- Auto-update timestamp for book_comments
drop trigger if exists on_book_comment_updated on public.book_comments;
create trigger on_book_comment_updated
  before update on public.book_comments
  for each row execute procedure public.handle_updated_at();
