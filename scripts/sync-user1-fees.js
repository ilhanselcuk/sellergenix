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

const userId = '1a61010e-2e22-4b51-b45a-cbc55dc4cada';

async function check() {
  console.log('=== User 1 Order Date Range ===');

  // Get earliest and latest order
  const { data: earliest } = await supabase
    .from('orders')
    .select('purchase_date')
    .eq('user_id', userId)
    .order('purchase_date', { ascending: true })
    .limit(1)
    .single();

  const { data: latest } = await supabase
    .from('orders')
    .select('purchase_date')
    .eq('user_id', userId)
    .order('purchase_date', { ascending: false })
    .limit(1)
    .single();

  if (earliest && latest) {
    console.log('Earliest order:', earliest.purchase_date);
    console.log('Latest order:', latest.purchase_date);

    const startDate = new Date(earliest.purchase_date).toISOString().split('T')[0];
    const endDate = new Date(latest.purchase_date).toISOString().split('T')[0];
    console.log('\nBulk sync command:');
    console.log(`curl -X POST "http://localhost:3001/api/sync/fees?userId=${userId}&type=bulk&startDate=${startDate}&endDate=${endDate}"`);
  }

  // Get order status distribution
  console.log('\n=== Order Status Distribution ===');
  const { data: orders } = await supabase
    .from('orders')
    .select('order_status')
    .eq('user_id', userId);

  const statusCounts = {};
  for (const order of orders || []) {
    const status = order.order_status || 'Unknown';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  }
  console.log(statusCounts);
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
