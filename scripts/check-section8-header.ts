import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkHeader() {
  const { data } = await supabase
    .from('documents')
    .select('content')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!data) return;

  // Find the section 8 header and surrounding context
  const idx = data.content.indexOf('ALCHEMY SECTION');
  if (idx !== -1) {
    console.log('Context around ALCHEMY SECTION:');
    console.log(data.content.substring(idx - 50, idx + 100));
    console.log('\n\n=== Escaped version ===');
    console.log(JSON.stringify(data.content.substring(idx - 50, idx + 100)));
  }
}

checkHeader();
