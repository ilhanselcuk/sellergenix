const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load .env.local manually
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
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkFeeData() {
  // Get user ID
  const { data: connections } = await supabase
    .from('amazon_connections')
    .select('user_id')
    .eq('is_active', true)
    .limit(1);

  if (!connections || connections.length === 0) {
    console.log('No active connection found');
    return;
  }

  const userId = connections[0].user_id;
  console.log('User ID:', userId);

  // Check overall fee_source distribution
  const { data: allItems } = await supabase
    .from('order_items')
    .select('fee_source, total_amazon_fees, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(500);

  if (!allItems) {
    console.log('No items found');
    return;
  }

  console.log('\nTotal items (last 500):', allItems.length);

  // Count by fee_source
  const counts = { 'null': 0, 'api': 0, 'settlement_report': 0 };
  const withFees = { 'null': 0, 'api': 0, 'settlement_report': 0 };
  const feesBySource = { 'null': 0, 'api': 0, 'settlement_report': 0 };

  for (const item of allItems) {
    const source = item.fee_source || 'null';
    if (counts[source] !== undefined) {
      counts[source]++;
      if (item.total_amazon_fees && item.total_amazon_fees > 0) {
        withFees[source]++;
        feesBySource[source] += item.total_amazon_fees;
      }
    }
  }

  console.log('\nItems by fee_source:');
  console.log('  - null:', counts['null']);
  console.log('  - api:', counts['api']);
  console.log('  - settlement_report:', counts['settlement_report']);

  console.log('\nItems with fees > 0:');
  console.log('  - null:', withFees['null']);
  console.log('  - api:', withFees['api']);
  console.log('  - settlement_report:', withFees['settlement_report']);

  console.log('\nTotal fees by source:');
  console.log('  - null: $' + feesBySource['null'].toFixed(2));
  console.log('  - api: $' + feesBySource['api'].toFixed(2));
  console.log('  - settlement_report: $' + feesBySource['settlement_report'].toFixed(2));

  // Check date ranges for fee_source
  console.log('\n=== Checking fee_source by date ===');

  const now = new Date();
  const periods = [
    { name: 'Last 7 days', days: 7 },
    { name: 'Last 30 days', days: 30 },
    { name: 'Last 90 days', days: 90 },
    { name: 'Last 180 days', days: 180 }
  ];

  for (const period of periods) {
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - period.days);

    const { data: items } = await supabase
      .from('order_items')
      .select('fee_source, total_amazon_fees')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString());

    const pCounts = { 'null': 0, 'api': 0, 'settlement_report': 0 };
    const pFees = { 'null': 0, 'api': 0, 'settlement_report': 0 };

    for (const item of items || []) {
      const source = item.fee_source || 'null';
      if (pCounts[source] !== undefined) {
        pCounts[source]++;
        if (item.total_amazon_fees) pFees[source] += item.total_amazon_fees;
      }
    }

    console.log('\n' + period.name + ':');
    console.log('  Items: null=' + pCounts['null'] + ', api=' + pCounts['api'] + ', settlement=' + pCounts['settlement_report']);
    console.log('  Fees: null=$' + pFees['null'].toFixed(2) + ', api=$' + pFees['api'].toFixed(2) + ', settlement=$' + pFees['settlement_report'].toFixed(2));
  }
}

checkFeeData().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
