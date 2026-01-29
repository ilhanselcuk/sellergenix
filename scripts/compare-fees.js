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

const userId = '98ca1a19-eb67-47b6-8479-509fff13e698';

// Use EXACT same PST ranges as the API
const periods = [
  {
    name: 'This Week',
    pstStart: '2026-01-25T08:00:00.000Z',
    pstEnd: '2026-01-27T07:59:59.999Z',
    apiReported: { fees: 42.10, orders: 8 }
  },
  {
    name: 'Last Week',
    pstStart: '2026-01-18T08:00:00.000Z',
    pstEnd: '2026-01-25T07:59:59.999Z',
    apiReported: { fees: 159.08, orders: 35 }
  },
  {
    name: '2 Weeks Ago',
    pstStart: '2026-01-11T08:00:00.000Z',
    pstEnd: '2026-01-18T07:59:59.999Z',
    apiReported: { fees: 353.50, orders: 72 }
  },
  {
    name: '4 Weeks Ago',
    pstStart: '2025-12-28T08:00:00.000Z',
    pstEnd: '2026-01-04T07:59:59.999Z',
    apiReported: { fees: 97.95, orders: 20 }
  }
];

async function checkPeriod(period) {
  console.log(`\n=== ${period.name} ===`);
  console.log(`PST Range: ${period.pstStart} to ${period.pstEnd}`);
  console.log(`API Reported: ${period.apiReported.orders} orders, $${period.apiReported.fees.toFixed(2)} fees`);

  // Get orders in this range
  const { data: orders, error: orderError } = await supabase
    .from('orders')
    .select('amazon_order_id, purchase_date, order_status')
    .eq('user_id', userId)
    .gte('purchase_date', period.pstStart)
    .lte('purchase_date', period.pstEnd);

  if (orderError) {
    console.log('Order query error:', orderError.message);
    return;
  }

  console.log(`\nDB Orders Found: ${orders ? orders.length : 0}`);
  if (orders) {
    const shipped = orders.filter(o => o.order_status === 'Shipped').length;
    const pending = orders.filter(o => o.order_status === 'Pending').length;
    console.log(`  Shipped: ${shipped}, Pending: ${pending}`);
  }

  if (!orders || orders.length === 0) return;

  // Get order items
  const orderIds = orders.map(o => o.amazon_order_id);
  const { data: items, error: itemError } = await supabase
    .from('order_items')
    .select('amazon_order_id, fee_source, total_amazon_fees, quantity_ordered, asin')
    .eq('user_id', userId)
    .in('amazon_order_id', orderIds);

  if (itemError) {
    console.log('Item query error:', itemError.message);
    return;
  }

  console.log(`\nDB Items Found: ${items ? items.length : 0}`);

  // Calculate fees by source
  let realFees = 0;  // api + settlement_report
  let nullFees = 0;  // fee_source is null
  let countBySource = { api: 0, settlement_report: 0, null: 0 };

  for (const item of items || []) {
    const source = item.fee_source || 'null';
    countBySource[source] = (countBySource[source] || 0) + 1;

    if (item.total_amazon_fees && item.total_amazon_fees > 0) {
      if (source === 'api' || source === 'settlement_report') {
        realFees += item.total_amazon_fees;
      } else {
        nullFees += item.total_amazon_fees;
      }
    }
  }

  console.log(`\nFee Source Distribution:`);
  console.log(`  api: ${countBySource.api}`);
  console.log(`  settlement_report: ${countBySource.settlement_report}`);
  console.log(`  null: ${countBySource.null}`);

  console.log(`\nFee Calculation:`);
  console.log(`  Real fees (api+settlement): $${realFees.toFixed(2)}`);
  console.log(`  Null source fees: $${nullFees.toFixed(2)}`);

  // Compare
  const diff = Math.abs(realFees - period.apiReported.fees);
  if (diff < 0.01) {
    console.log(`\n✅ MATCH! API and DB agree: $${realFees.toFixed(2)}`);
  } else {
    console.log(`\n❌ MISMATCH!`);
    console.log(`   API: $${period.apiReported.fees.toFixed(2)}`);
    console.log(`   DB:  $${realFees.toFixed(2)}`);
    console.log(`   Diff: $${diff.toFixed(2)}`);
  }
}

async function main() {
  for (const period of periods) {
    await checkPeriod(period);
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
