// Check which users have Amazon connections and compare their data
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUsers() {
  console.log('='.repeat(60));
  console.log('Checking all users with Amazon connections');
  console.log('='.repeat(60));

  // Get all active connections with user emails
  const { data: connections, error } = await supabase
    .from('amazon_connections')
    .select(`
      id,
      user_id,
      seller_id,
      is_active,
      created_at
    `)
    .eq('is_active', true);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`\nFound ${connections?.length || 0} active connections:\n`);

  for (const conn of connections || []) {
    // Get user email from auth.users via profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', conn.user_id)
      .single();

    console.log(`👤 User ID: ${conn.user_id}`);
    console.log(`   Email: ${profile?.email || 'Unknown'}`);
    console.log(`   Seller ID: ${conn.seller_id}`);
    console.log(`   Created: ${conn.created_at}`);

    // Count orders for Nov 12, 2025 for this user
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('amazon_order_id, purchase_date, order_total')
      .eq('user_id', conn.user_id)
      .gte('purchase_date', '2025-11-12T00:00:00Z')
      .lt('purchase_date', '2025-11-13T00:00:00Z');

    // Also check with PST conversion (Nov 12 PST = Nov 12 08:00 UTC to Nov 13 08:00 UTC)
    const { data: ordersPST } = await supabase
      .from('orders')
      .select('amazon_order_id, purchase_date, order_total')
      .eq('user_id', conn.user_id)
      .gte('purchase_date', '2025-11-12T08:00:00Z')
      .lt('purchase_date', '2025-11-13T08:00:00Z');

    console.log(`   Orders (Nov 12 UTC): ${orders?.length || 0}`);
    console.log(`   Orders (Nov 12 PST): ${ordersPST?.length || 0}`);

    if (orders && orders.length > 0) {
      let total = 0;
      orders.forEach(o => {
        total += parseFloat(o.order_total || 0);
        console.log(`     - ${o.amazon_order_id}: $${o.order_total}`);
      });
      console.log(`   Total: $${total.toFixed(2)}`);
    }
    console.log('');
  }
}

checkUsers().catch(console.error);
