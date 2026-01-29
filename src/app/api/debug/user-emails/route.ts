import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Get all amazon connections with user info
    const { data: connections, error: connError } = await supabase
      .from('amazon_connections')
      .select('user_id, seller_id, is_active, created_at')
      .eq('is_active', true);

    if (connError) {
      return NextResponse.json({ error: connError.message }, { status: 500 });
    }

    const users = [];

    for (const conn of connections || []) {
      // Get profile/email
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', conn.user_id)
        .single();

      // Count orders for Nov 12 (UTC range and PST range)
      const { count: ordersUTC } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', conn.user_id)
        .gte('purchase_date', '2025-11-12T00:00:00Z')
        .lt('purchase_date', '2025-11-13T00:00:00Z');

      const { count: ordersPST } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', conn.user_id)
        .gte('purchase_date', '2025-11-12T08:00:00Z')
        .lt('purchase_date', '2025-11-13T08:00:00Z');

      // Get Nov 12 orders detail
      const { data: nov12Orders } = await supabase
        .from('orders')
        .select('amazon_order_id, purchase_date, order_total, order_status')
        .eq('user_id', conn.user_id)
        .gte('purchase_date', '2025-11-12T08:00:00Z')
        .lt('purchase_date', '2025-11-13T08:00:00Z')
        .limit(10);

      // Sum total
      let totalSales = 0;
      (nov12Orders || []).forEach((o: any) => {
        totalSales += parseFloat(o.order_total || 0);
      });

      users.push({
        userId: conn.user_id,
        email: profile?.email || 'Unknown',
        fullName: profile?.full_name || '',
        sellerId: conn.seller_id,
        nov12Stats: {
          ordersUTC: ordersUTC || 0,
          ordersPST: ordersPST || 0,
          totalSales: totalSales.toFixed(2),
          orders: nov12Orders || []
        }
      });
    }

    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
