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

async function main() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in .env.local');
    process.exit(1);
  }

  const { data: profiles } = await supabase.from('profiles').select('id, email');
  console.log('Profiles:', JSON.stringify(profiles, null, 2));

  const { data: conns } = await supabase.from('amazon_connections').select('user_id, seller_id, is_active');
  console.log('Connections:', JSON.stringify(conns, null, 2));
}

main();
