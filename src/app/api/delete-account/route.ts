import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/delete-account
export async function POST(req: Request) {
  const supabase = await createClient();
  const { userId } = await req.json();

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }

  // Delete from Supabase Auth (requires service role key)
  // This is a placeholder: you must use Supabase Admin API or call from server with elevated privileges
  // await supabase.auth.admin.deleteUser(userId);

  // Delete related records
  const tables = [
    'profiles',
    'follows',
    // 'comments' table removed
    'recommendations',
    'notifications',
    // add more tables if needed
  ];

  for (const table of tables) {
    await supabase.from(table).delete().eq('user_id', userId);
    // Comments deletion logic removed
    // For follows, delete both follower and following
    if (table === 'follows') {
      await supabase.from('follows').delete().eq('follower_id', userId);
      await supabase.from('follows').delete().eq('following_id', userId);
    }
    // For recommendations, delete by from_user_id and to_user_id
    if (table === 'recommendations') {
      await supabase.from('recommendations').delete().eq('from_user_id', userId);
      await supabase.from('recommendations').delete().eq('to_user_id', userId);
    }
    // For notifications, delete by from_user_id
    if (table === 'notifications') {
      await supabase.from('notifications').delete().eq('from_user_id', userId);
    }
  }

  return NextResponse.json({ success: true });
}
