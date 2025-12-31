import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkSection8() {
  const { data } = await supabase
    .from('documents')
    .select('content')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!data) return;

  // Find Section 8
  const sections = data.content.split(/\n## /);
  const section8 = sections.find(s => s.startsWith('8.'));

  console.log('Section 8 found:', !!section8);
  if (section8) {
    console.log('\nSection 8 header:', section8.substring(0, 100));
    console.log('\nSection 8 length:', section8.length);
  }

  // Test the split regex from DocumentClient
  const contentParts = data.content.split(/## 8\. ALCHEMY SECTION.*?\n/);
  console.log('\n=== Split Test ===');
  console.log('Parts found:', contentParts.length);
  console.log('Part 1 length:', contentParts[0]?.length);
  console.log('Part 2 length:', contentParts[1]?.length);
  console.log('Part 2 preview:', contentParts[1]?.substring(0, 200));
}

checkSection8();
