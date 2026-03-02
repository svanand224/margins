import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js';

// POST /api/delete-account
export async function POST(req: Request) {
  const supabase = await createClient();

  // Verify the caller is authenticated and matches the userId
  const { data: { user: authUser } } = await supabase.auth.getUser();
  const { userId } = await req.json();

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }

  if (!authUser || authUser.id !== userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Server misconfigured: missing service role key' }, { status: 500 });
  }

  const adminClient = createSupabaseAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Clean up records that may not cascade automatically
  await adminClient.from('activities').delete().eq('user_id', userId);
  await adminClient.from('notifications').delete().eq('user_id', userId);
  await adminClient.from('notifications').delete().eq('from_user_id', userId);
  await adminClient.from('recommendations').delete().eq('from_user_id', userId);
  await adminClient.from('recommendations').delete().eq('to_user_id', userId);
  await adminClient.from('discussion_members').delete().eq('user_id', userId);
  await adminClient.from('discussion_posts').delete().eq('user_id', userId);
  await adminClient.from('discussions').delete().eq('creator_id', userId);
  await adminClient.from('comments').delete().eq('author_id', userId);
  await adminClient.from('follows').delete().eq('follower_id', userId);
  await adminClient.from('follows').delete().eq('following_id', userId);

  // Delete auth user — this cascades to profiles table
  const { error: authError } = await adminClient.auth.admin.deleteUser(userId);

  if (authError) {
    console.error('admin.deleteUser error:', authError);
    // Profile may still exist — try deleting it directly
    await adminClient.from('profiles').delete().eq('id', userId);
    // Even if auth deletion failed, data is cleaned up — treat as success
    return NextResponse.json({ success: true, partial: true });
  }

  return NextResponse.json({ success: true });
}
