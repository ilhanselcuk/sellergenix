import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkYesterdayData() {
  // Get yesterday's date in PST
  const now = new Date();
  const pstOffset = -8 * 60;
  const pstNow = new Date(now.getTime() + (pstOffset - now.getTimezoneOffset()) * 60000);
  const yesterday = new Date(pstNow);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  console.log('=== Checking data for:', yesterdayStr, '===\n');

  // 1. Check daily_metrics
  const { data: metrics } = await supabase
    .from('daily_metrics')
    .select('*')
    .eq('date', yesterdayStr);
  
  console.log('📊 DAILY_METRICS:');
  if (metrics && metrics.length > 0) {
    metrics.forEach(m => {
      console.log(`  Sales: $${m.sales}, Units: ${m.units_sold}, Amazon Fees: $${m.amazon_fees}, Refunds: $${m.refunds}`);
    });
  } else {
    console.log('  No daily_metrics for yesterday (Finance API may not have run yet)');
  }

  // 2. Check orders for yesterday
  const { data: orders } = await supabase
    .from('orders')
    .select('amazon_order_id, purchase_date, order_status, order_total')
    .gte('purchase_date', yesterdayStr + 'T00:00:00')
    .lt('purchase_date', new Date(new Date(yesterdayStr).getTime() + 86400000).toISOString().split('T')[0] + 'T00:00:00');

  console.log('\n📦 ORDERS for yesterday:');
  if (orders && orders.length > 0) {
    orders.forEach(o => {
      console.log(`  ${o.amazon_order_id} | Status: ${o.order_status} | Total: $${o.order_total} | Date: ${o.purchase_date}`);
    });
    console.log(`  TOTAL: ${orders.length} orders`);
  } else {
    console.log('  No orders for yesterday');
  }

  // 3. Check order_items
  if (orders && orders.length > 0) {
    const orderIds = orders.map(o => o.amazon_order_id);
    const { data: items } = await supabase
      .from('order_items')
      .select('*')
      .in('amazon_order_id', orderIds);

    console.log('\n🛒 ORDER_ITEMS:');
    if (items && items.length > 0) {
      let totalSales = 0;
      let totalQty = 0;
      items.forEach(item => {
        console.log(`  ${item.amazon_order_id} | ASIN: ${item.asin} | Qty: ${item.quantity_ordered} | Price: $${item.item_price}`);
        totalSales += parseFloat(item.item_price) || 0;
        totalQty += item.quantity_ordered || 0;
      });
      console.log(`  TOTAL: ${items.length} items, ${totalQty} units, $${totalSales.toFixed(2)} sales`);
      
      // Calculate what fees should be (15% estimate)
      console.log(`\n💰 FEE ESTIMATES (if no dimensions):`);
      console.log(`  15% estimate: $${(totalSales * 0.15).toFixed(2)}`);
    } else {
      console.log('  No order_items found');
    }
  }

  // 4. Check products for dimensions
  const { data: products } = await supabase
    .from('products')
    .select('asin, title, weight_lbs, length_inches, width_inches, height_inches, cogs, price')
    .limit(10);

  console.log('\n📐 PRODUCTS (dimensions):');
  if (products && products.length > 0) {
    let withDims = 0;
    products.forEach(p => {
      const hasDims = p.weight_lbs && p.length_inches;
      if (hasDims) withDims++;
      console.log(`  ${p.asin}: Weight=${p.weight_lbs || 'NULL'}lbs, L=${p.length_inches || 'NULL'}", COGS=$${p.cogs || 'NULL'}`);
    });
    console.log(`  Summary: ${withDims}/${products.length} have dimensions`);
  }
}

checkYesterdayData().catch(console.error);
