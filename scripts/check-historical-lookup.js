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

async function main() {
  // Step 1: Find ASINs that need historical lookup (fee_source is null)
  console.log('=== ASINs Without Fee Data ===\n');

  const { data: nullItems } = await supabase
    .from('order_items')
    .select('asin, quantity_ordered, total_amazon_fees, fee_source')
    .eq('user_id', userId)
    .is('fee_source', null)
    .not('asin', 'is', null);

  const asinsNeedingFees = new Set();
  for (const item of nullItems || []) {
    if (item.asin && !item.total_amazon_fees) {
      asinsNeedingFees.add(item.asin);
    }
  }

  console.log(`Total items with fee_source=null: ${nullItems?.length || 0}`);
  console.log(`Unique ASINs needing historical lookup: ${asinsNeedingFees.size}`);
  console.log('ASINs:', Array.from(asinsNeedingFees));

  // Step 2: Check what historical data exists for these ASINs
  console.log('\n=== Historical Fee Data for These ASINs ===\n');

  if (asinsNeedingFees.size > 0) {
    const { data: historicalItems } = await supabase
      .from('order_items')
      .select('asin, quantity_ordered, total_amazon_fees, total_fba_fulfillment_fees, total_referral_fees, fee_source, created_at')
      .eq('user_id', userId)
      .in('asin', Array.from(asinsNeedingFees))
      .in('fee_source', ['api', 'settlement_report'])
      .gt('total_amazon_fees', 0)
      .order('created_at', { ascending: false });

    const asinHistory = {};
    for (const item of historicalItems || []) {
      if (item.asin && !asinHistory[item.asin]) {
        const qty = item.quantity_ordered || 1;
        asinHistory[item.asin] = {
          perUnitFee: (item.total_amazon_fees || 0) / qty,
          totalFee: item.total_amazon_fees,
          quantity: qty,
          feeSource: item.fee_source,
          date: item.created_at
        };
      }
    }

    console.log('Historical per-unit fees:');
    for (const [asin, history] of Object.entries(asinHistory)) {
      console.log(`  ${asin}: $${history.perUnitFee.toFixed(2)}/unit (from ${history.feeSource}, qty=${history.quantity}, total=$${history.totalFee.toFixed(2)})`);
    }

    // Step 3: Calculate what fees would be estimated
    console.log('\n=== Estimated Fees Using Historical Lookup ===\n');

    let totalEstimatedFees = 0;
    for (const item of nullItems || []) {
      if (item.asin && asinHistory[item.asin]) {
        const qty = item.quantity_ordered || 1;
        const perUnitFee = asinHistory[item.asin].perUnitFee;
        const estimatedFee = perUnitFee * qty;
        totalEstimatedFees += estimatedFee;
        console.log(`  ${item.asin}: ${qty} units × $${perUnitFee.toFixed(2)} = $${estimatedFee.toFixed(2)}`);
      } else if (item.asin) {
        console.log(`  ${item.asin}: NO HISTORICAL DATA (will be $0)`);
      }
    }

    console.log(`\nTotal estimated fees: $${totalEstimatedFees.toFixed(2)}`);
  }

  // Step 4: Compare with what API calculated
  console.log('\n=== Summary ===\n');

  // Get total real fees (api + settlement_report)
  const { data: realFeeItems } = await supabase
    .from('order_items')
    .select('total_amazon_fees')
    .eq('user_id', userId)
    .in('fee_source', ['api', 'settlement_report'])
    .gt('total_amazon_fees', 0);

  let totalRealFees = 0;
  for (const item of realFeeItems || []) {
    totalRealFees += item.total_amazon_fees;
  }

  console.log(`Total REAL fees (api+settlement): $${totalRealFees.toFixed(2)} (${realFeeItems?.length || 0} items)`);
  console.log(`Items needing estimation: ${nullItems?.length || 0}`);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
