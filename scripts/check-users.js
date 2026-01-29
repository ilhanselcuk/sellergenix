const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
    }
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  console.log('=== All Amazon Connections ===');
  const { data: connections } = await supabase
    .from('amazon_connections')
    .select('user_id, seller_id, is_active, created_at, updated_at');

  if (connections) {
    for (const conn of connections) {
      console.log('\nConnection:');
      console.log('  user_id:', conn.user_id);
      console.log('  seller_id:', conn.seller_id);
      console.log('  is_active:', conn.is_active);
      console.log('  created:', conn.created_at);
    }
  }

  console.log('\n=== Order Items with Fees by User ===');

  // Get unique users with fee data
  const { data: usersWithFees } = await supabase
    .from('order_items')
    .select('user_id')
    .gt('total_amazon_fees', 0);

  const userCounts = {};
  for (const row of usersWithFees || []) {
    userCounts[row.user_id] = (userCounts[row.user_id] || 0) + 1;
  }

  for (const [userId, count] of Object.entries(userCounts)) {
    console.log('\nUser:', userId);
    console.log('  Items with fees:', count);

    // Check if this user has connection
    const { data: userConn } = await supabase
      .from('amazon_connections')
      .select('is_active')
      .eq('user_id', userId)
      .single();

    console.log('  Has connection:', userConn ? 'Yes (active=' + userConn.is_active + ')' : 'No');
  }

  console.log('\n=== User 1a61010e-2e22-4b51-b45a-cbc55dc4cada (active connection) ===');
  const userId1 = '1a61010e-2e22-4b51-b45a-cbc55dc4cada';

  const { count: orderCount1 } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId1);
  console.log('Orders:', orderCount1);

  const { count: itemCount1 } = await supabase
    .from('order_items')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId1);
  console.log('Order Items:', itemCount1);

  const { count: feeCount1 } = await supabase
    .from('order_items')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId1)
    .gt('total_amazon_fees', 0);
  console.log('Order Items with fees:', feeCount1);

  console.log('\n=== User 98ca1a19-eb67-47b6-8479-509fff13e698 (has fee data) ===');
  const userId2 = '98ca1a19-eb67-47b6-8479-509fff13e698';

  const { count: orderCount2 } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId2);
  console.log('Orders:', orderCount2);

  const { count: itemCount2 } = await supabase
    .from('order_items')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId2);
  console.log('Order Items:', itemCount2);

  const { count: feeCount2 } = await supabase
    .from('order_items')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId2)
    .gt('total_amazon_fees', 0);
  console.log('Order Items with fees:', feeCount2);
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
