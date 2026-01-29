import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testFBA() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in .env.local');
    process.exit(1);
  }

  const userId = process.argv[2];

  if (!userId) {
    console.log('Usage: node test-fba-new-user.mjs <userId>');
    console.log('');
    console.log('Finding available users...');
    const { data: conns } = await supabase
      .from('amazon_connections')
      .select('user_id, seller_id, is_active');
    console.log('Available connections:', JSON.stringify(conns, null, 2));
    return;
  }

  // Get connection
  const { data: conn } = await supabase
    .from('amazon_connections')
    .select('refresh_token, seller_id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();

  if (!conn) {
    console.log('No connection found for user:', userId);
    return;
  }

  console.log('Seller ID:', conn.seller_id);

  // Get access token
  const tokenRes = await fetch('https://api.amazon.com/auth/o2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: conn.refresh_token,
      client_id: process.env.AMAZON_SP_API_CLIENT_ID,
      client_secret: process.env.AMAZON_SP_API_CLIENT_SECRET
    })
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    console.log('Token error:', tokenData);
    return;
  }

  console.log('Access token obtained ✓');

  // Test FBA Inventory API
  const marketplaceId = 'ATVPDKIKX0DER';
  const fbaUrl = `https://sellingpartnerapi-na.amazon.com/fba/inventory/v1/summaries?granularityType=Marketplace&granularityId=${marketplaceId}&marketplaceIds=${marketplaceId}&details=true`;

  console.log('');
  console.log('Testing FBA Inventory API...');
  console.log('URL:', fbaUrl);

  const fbaRes = await fetch(fbaUrl, {
    method: 'GET',
    headers: {
      'x-amz-access-token': tokenData.access_token,
      'Content-Type': 'application/json'
    }
  });

  const fbaData = await fbaRes.json();

  console.log('');
  console.log('=== FBA INVENTORY API RESULT ===');
  console.log('Status:', fbaRes.status);

  if (fbaRes.status === 200) {
    console.log('✅ FBA Inventory API WORKING!');
    console.log('Inventory items:', fbaData.payload?.inventorySummaries?.length || 0);
    if (fbaData.payload?.inventorySummaries?.length > 0) {
      console.log('Sample:', JSON.stringify(fbaData.payload.inventorySummaries[0], null, 2));
    }
  } else {
    console.log('❌ FBA Error');
    console.log('Code:', fbaData.errors?.[0]?.code);
    console.log('Message:', fbaData.errors?.[0]?.message);
    console.log('Full response:', JSON.stringify(fbaData, null, 2));
  }

  // Also test Sellers API for comparison
  console.log('');
  console.log('=== SELLERS API (comparison) ===');
  const sellersRes = await fetch('https://sellingpartnerapi-na.amazon.com/sellers/v1/marketplaceParticipations', {
    headers: { 'x-amz-access-token': tokenData.access_token }
  });
  console.log('Status:', sellersRes.status, sellersRes.status === 200 ? '✓' : '✗');
}

testFBA().catch(console.error);
