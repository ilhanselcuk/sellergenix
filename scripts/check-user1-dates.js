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
  // Get order date range for User 1
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

  console.log('=== User 1 Order Date Range ===');
  console.log('Earliest:', earliest?.purchase_date);
  console.log('Latest:', latest?.purchase_date);

  // Check orders in specific ranges
  const ranges = [
    { name: 'This Week (Jan 19-26)', start: '2026-01-19T08:00:00.000Z', end: '2026-01-27T07:59:59.999Z' },
    { name: 'Last Week (Jan 12-18)', start: '2026-01-12T08:00:00.000Z', end: '2026-01-19T07:59:59.999Z' },
    { name: 'Last 30 Days', start: '2025-12-27T08:00:00.000Z', end: '2026-01-27T07:59:59.999Z' }
  ];

  console.log('\n=== Orders by Period ===');
  for (const r of ranges) {
    const { count } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('purchase_date', r.start)
      .lte('purchase_date', r.end);
    console.log(`${r.name}: ${count} orders`);
  }

  // Total orders
  const { count: total } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  console.log(`\nTotal orders: ${total}`);
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
