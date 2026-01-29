import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://vdsjtskfzmydqajltdmm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkc2p0c2tmem15ZHFhamx0ZG1tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM5Njc0NywiZXhwIjoyMDc1OTcyNzQ3fQ.Wt8tuUc20JrwZE8c7kfPWy3pFfXfkhjCjr0OoDEYc-Y'
);

async function main() {
  const { data: profiles } = await supabase.from('profiles').select('id, email');
  console.log('Profiles:', JSON.stringify(profiles, null, 2));

  const { data: conns } = await supabase.from('amazon_connections').select('user_id, seller_id, is_active');
  console.log('Connections:', JSON.stringify(conns, null, 2));
}

main();
