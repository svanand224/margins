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

  // Debug: log service role key presence and value length
  console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'present' : 'missing', 'length:', process.env.SUPABASE_SERVICE_ROLE_KEY?.length);

  // Delete user from Supabase Auth using service role key
  const adminClient = createSupabaseAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { error: adminError } = await adminClient.auth.admin.deleteUser(userId);
  if (adminError) {
    console.error('admin.deleteUser error:', adminError);
    return NextResponse.json({ error: 'Failed to delete user from auth', details: adminError.message }, { status: 500 });
  }

  // Delete related records
  const tables = [
    'profiles',
    'follows',
  ];

  for (const table of tables) {
    await supabase.from(table).delete().eq('user_id', userId);
    if (table === 'follows') {
      await supabase.from('follows').delete().eq('follower_id', userId);
      await supabase.from('follows').delete().eq('following_id', userId);
    }
    // recommendations and notifications logic removed
  }

  return NextResponse.json({ success: true });
}
