/**
 * Check if settlement reports have prices for $0 orders
 */
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  const userId = '98ca1a19-eb67-47b6-8479-509fff13e698';

  // $0 order IDs from previous analysis
  const zeroOrderIds = [
    '114-3438084-0351464',
    '112-3971393-4921867',
    '111-5210095-5122651',
    '112-2389704-5765063',
    '113-1577403-4642639',
    '113-1359663-0825028',
    '113-2115380-3667454'
  ];

  console.log('=== CHECKING $0 ORDERS IN ORDER_ITEMS ===\n');

  // Check each order
  for (const orderId of zeroOrderIds) {
    const { data: items } = await supabase
      .from('order_items')
      .select('*')
      .eq('user_id', userId)
      .eq('amazon_order_id', orderId);

    if (items && items.length > 0) {
      const item = items[0];
      console.log('Order: ' + orderId);
      console.log('  ASIN: ' + item.asin);
      console.log('  item_price: $' + (item.item_price || 0));
      console.log('  fee_source: ' + (item.fee_source || 'null'));
      console.log('  total_amazon_fees: $' + (item.total_amazon_fees || 0));
      console.log('  fee_fba_per_unit: $' + (item.fee_fba_per_unit || 0));
      console.log('  fee_referral: $' + (item.fee_referral || 0));
      console.log('');
    }
  }

  // Check if orders table has order_total
  console.log('=== CHECKING ORDERS TABLE ===\n');
  for (const orderId of zeroOrderIds) {
    const { data: order } = await supabase
      .from('orders')
      .select('amazon_order_id, order_status, order_total')
      .eq('user_id', userId)
      .eq('amazon_order_id', orderId)
      .single();

    if (order) {
      console.log(orderId + ': status=' + order.order_status + ', total=$' + (order.order_total || 0));
    }
  }
})();
