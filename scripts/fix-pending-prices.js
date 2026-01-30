/**
 * Fix Pending order item prices using product listing price
 *
 * Amazon Orders API returns $0 for Pending orders.
 * This script updates item_price using the product's listing price.
 */
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  const userId = '98ca1a19-eb67-47b6-8479-509fff13e698';

  console.log('=== FIX PENDING ORDER PRICES ===\n');

  // Get product prices
  const { data: products } = await supabase
    .from('products')
    .select('asin, price')
    .eq('user_id', userId);

  const priceMap = new Map(products.map(p => [p.asin, p.price]));
  console.log('Product prices loaded:', priceMap.size, 'products');
  priceMap.forEach((price, asin) => console.log('  ' + asin + ': $' + price));

  // Get Pending orders
  const { data: pendingOrders } = await supabase
    .from('orders')
    .select('amazon_order_id')
    .eq('user_id', userId)
    .eq('order_status', 'Pending');

  const pendingOrderIds = new Set(pendingOrders.map(o => o.amazon_order_id));
  console.log('\nPending orders:', pendingOrderIds.size);

  // Get order items with $0 price for Pending orders
  const { data: items } = await supabase
    .from('order_items')
    .select('order_item_id, amazon_order_id, asin, item_price, quantity_ordered')
    .eq('user_id', userId);

  const zeroPendingItems = items.filter(i =>
    pendingOrderIds.has(i.amazon_order_id) &&
    (i.item_price === 0 || i.item_price === null)
  );

  console.log('Pending items with $0 price:', zeroPendingItems.length);

  // Update each item
  let updated = 0;
  let skipped = 0;

  for (const item of zeroPendingItems) {
    const productPrice = priceMap.get(item.asin);

    if (!productPrice) {
      console.log('  ⚠️ No price for ASIN ' + item.asin + ' - skipping');
      skipped++;
      continue;
    }

    console.log('  Updating ' + item.order_item_id + ' (' + item.asin + '): $0 → $' + productPrice);

    const { error } = await supabase
      .from('order_items')
      .update({
        item_price: productPrice,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('order_item_id', item.order_item_id);

    if (error) {
      console.log('    ❌ Error: ' + error.message);
    } else {
      updated++;
    }
  }

  console.log('\n=== SUMMARY ===');
  console.log('Updated:', updated);
  console.log('Skipped:', skipped);

  // Verify final totals
  console.log('\n=== VERIFICATION ===');

  const startPST = new Date('2026-01-01T08:00:00Z');
  const endPST = new Date('2026-02-01T07:59:59.999Z');

  const { data: janOrders } = await supabase
    .from('orders')
    .select('amazon_order_id')
    .eq('user_id', userId)
    .neq('order_status', 'Canceled')
    .gte('purchase_date', startPST.toISOString())
    .lte('purchase_date', endPST.toISOString());

  const janOrderIds = new Set(janOrders.map(o => o.amazon_order_id));

  const { data: allItems } = await supabase
    .from('order_items')
    .select('amazon_order_id, asin, quantity_ordered, item_price')
    .eq('user_id', userId);

  const janItems = allItems.filter(i => janOrderIds.has(i.amazon_order_id));

  let totalUnits = 0;
  let totalSales = 0;
  const byAsin = {};

  janItems.forEach(item => {
    const units = item.quantity_ordered || 0;
    const price = item.item_price || 0;
    totalUnits += units;
    totalSales += price;

    if (!byAsin[item.asin]) byAsin[item.asin] = { units: 0, sales: 0 };
    byAsin[item.asin].units += units;
    byAsin[item.asin].sales += price;
  });

  console.log('\nOur totals (after fix):');
  console.log('  Units:', totalUnits);
  console.log('  Sales: $' + totalSales.toFixed(2));

  console.log('\nBy ASIN:');
  ['B0FP57MKF9', 'B0F1CTW639', 'B0F1CTMVGB'].forEach(asin => {
    const d = byAsin[asin] || { units: 0, sales: 0 };
    console.log('  ' + asin + ': ' + d.units + ' units, $' + d.sales.toFixed(2));
  });

  console.log('\nSellerboard target:');
  console.log('  Units: 152');
  console.log('  Sales: $1,837.98');
  console.log('  B0FP57MKF9: 64 units, $959.36');
  console.log('  B0F1CTW639: 11 units, $109.89');
  console.log('  B0F1CTMVGB: 77 units, $768.73');
})();
