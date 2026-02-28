import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js';

// POST /api/delete-account
export async function POST(req: Request) {
  const supabase = await createClient();
  const { userId } = await req.json();

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }

  // Delete user from Supabase Auth using service role key
  const adminClient = createSupabaseAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { error: adminError } = await adminClient.auth.admin.deleteUser(userId);
  if (adminError) {
    return NextResponse.json({ error: 'Failed to delete user from auth', details: adminError.message }, { status: 500 });
  }

  // Delete related records
  const tables = [
    'profiles',
    'follows',
    'recommendations',
    'notifications',
  ];

  for (const table of tables) {
    await supabase.from(table).delete().eq('user_id', userId);
    if (table === 'follows') {
      await supabase.from('follows').delete().eq('follower_id', userId);
      await supabase.from('follows').delete().eq('following_id', userId);
    }
    if (table === 'recommendations') {
      await supabase.from('recommendations').delete().eq('from_user_id', userId);
      await supabase.from('recommendations').delete().eq('to_user_id', userId);
    }
    if (table === 'notifications') {
      await supabase.from('notifications').delete().eq('from_user_id', userId);
    }
  }

  return NextResponse.json({ success: true });
}
