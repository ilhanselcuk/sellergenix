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

const userId = '98ca1a19-eb67-47b6-8479-509fff13e698';  // User with fee data

async function checkPeriod(name, startDate, endDate) {
  console.log(`\n=== ${name} ===`);
  console.log(`Range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);

  // Get orders in range
  const { data: orders } = await supabase
    .from('orders')
    .select('amazon_order_id, purchase_date, order_status')
    .eq('user_id', userId)
    .gte('purchase_date', startDate.toISOString())
    .lte('purchase_date', endDate.toISOString());

  if (!orders || orders.length === 0) {
    console.log('No orders found');
    return;
  }

  console.log('Total orders:', orders.length);
  console.log('Shipped:', orders.filter(o => o.order_status === 'Shipped').length);
  console.log('Pending:', orders.filter(o => o.order_status === 'Pending').length);

  // Get order items with fees
  const orderIds = orders.map(o => o.amazon_order_id);
  const { data: items } = await supabase
    .from('order_items')
    .select('amazon_order_id, fee_source, total_amazon_fees, quantity_ordered')
    .eq('user_id', userId)
    .in('amazon_order_id', orderIds);

  if (!items) {
    console.log('No items found');
    return;
  }

  console.log('Total items:', items.length);

  // Calculate fees
  let feesBySource = { api: 0, settlement_report: 0, null: 0 };
  let countBySource = { api: 0, settlement_report: 0, null: 0 };

  for (const item of items) {
    const source = item.fee_source || 'null';
    countBySource[source] = (countBySource[source] || 0) + 1;
    if (item.total_amazon_fees) {
      feesBySource[source] = (feesBySource[source] || 0) + item.total_amazon_fees;
    }
  }

  console.log('Items by source:', JSON.stringify(countBySource));
  console.log('Fees by source:', JSON.stringify({
    api: '$' + feesBySource.api.toFixed(2),
    settlement_report: '$' + feesBySource.settlement_report.toFixed(2),
    null: '$' + feesBySource.null.toFixed(2)
  }));
  console.log('Total fees (api+settlement):', '$' + (feesBySource.api + feesBySource.settlement_report).toFixed(2));
}

async function main() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // This Week (Mon-Sun)
  const dayOfWeek = today.getDay();
  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  const thisWeekEnd = new Date(thisWeekStart);
  thisWeekEnd.setDate(thisWeekStart.getDate() + 6);
  thisWeekEnd.setHours(23, 59, 59, 999);

  // Last Week
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(thisWeekStart.getDate() - 7);
  const lastWeekEnd = new Date(thisWeekStart);
  lastWeekEnd.setDate(thisWeekStart.getDate() - 1);
  lastWeekEnd.setHours(23, 59, 59, 999);

  // This Month
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  // Last Month
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  await checkPeriod('This Week', thisWeekStart, thisWeekEnd);
  await checkPeriod('Last Week', lastWeekStart, lastWeekEnd);
  await checkPeriod('This Month', thisMonthStart, thisMonthEnd);
  await checkPeriod('Last Month', lastMonthStart, lastMonthEnd);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
