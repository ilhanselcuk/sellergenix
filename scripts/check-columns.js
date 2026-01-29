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
  // Get 1 row with all columns
  const { data, error } = await supabase
    .from('order_items')
    .select('*')
    .limit(3);

  if (error) {
    console.log('Error:', error.message);
    return;
  }

  if (data && data.length > 0) {
    console.log('=== Sample row columns (non-null values) ===');
    const row = data[0];
    for (const [key, value] of Object.entries(row)) {
      if (value !== null && value !== undefined) {
        console.log(key + ': ' + JSON.stringify(value));
      }
    }

    console.log('\n=== Checking fee-related columns across all rows ===');
    const feeColumns = [
      'total_amazon_fees', 'fee_source', 'estimated_amazon_fee',
      'total_fba_fulfillment_fees', 'total_referral_fees', 'total_storage_fees',
      'fee_fba_per_unit', 'fee_referral', 'fee_storage'
    ];

    for (const col of feeColumns) {
      let hasValue = 0;
      let sampleValue = null;
      for (const row of data) {
        if (row[col]) {
          hasValue++;
          if (!sampleValue) sampleValue = row[col];
        }
      }
      console.log(col + ': ' + hasValue + ' rows have values' + (sampleValue ? ' (e.g., ' + sampleValue + ')' : ''));
    }
  }

  // Check if there's any row with fee data at all
  console.log('\n=== Checking for ANY fee data in entire table ===');

  const { data: withFees, count } = await supabase
    .from('order_items')
    .select('id', { count: 'exact' })
    .gt('total_amazon_fees', 0);

  console.log('Rows with total_amazon_fees > 0:', count || 0);

  const { data: withFeeSource } = await supabase
    .from('order_items')
    .select('fee_source')
    .not('fee_source', 'is', null)
    .limit(10);

  console.log('Rows with fee_source not null:', withFeeSource ? withFeeSource.length : 0);
  if (withFeeSource && withFeeSource.length > 0) {
    console.log('Sample fee_source values:', withFeeSource.map(r => r.fee_source));
  }
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
