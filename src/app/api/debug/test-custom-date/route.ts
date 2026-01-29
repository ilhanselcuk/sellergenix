import { NextResponse } from 'next/server';
import { getCustomRangeMetrics } from '@/lib/ai/context';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateStr = searchParams.get('date') || '2025-11-12';
  const userEmail = searchParams.get('user') || 'gizem'; // 'gizem' or 'seritaine'

  // Use service role for testing
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get user by email pattern
  const emailFilter = userEmail === 'gizem' ? 'zyraamazon@gmail.com' : 'seritaine@gmail.com';

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('email', emailFilter)
    .single();

  if (!profile) {
    return NextResponse.json({ error: `User not found: ${emailFilter}` }, { status: 400 });
  }

  const userId = profile.id;

  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧪 Testing custom date: ${dateStr}`);
  console.log(`${'='.repeat(60)}`);

  try {
    // Test single day
    const result = await getCustomRangeMetrics(userId, dateStr, dateStr);

    console.log('📊 Result:', JSON.stringify(result, null, 2));

    return NextResponse.json({
      testDate: dateStr,
      result,
      debug: {
        userId: userId,
        startDateInput: dateStr,
        endDateInput: dateStr,
      }
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
