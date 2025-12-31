import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkDocument() {
  const { data: documents } = await supabase
    .from('documents')
    .select('id, title, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  console.log('Recent documents:');
  documents?.forEach((doc, i) => {
    console.log(`${i + 1}. ${doc.title} (${doc.id})`);
  });

  if (documents && documents.length > 0) {
    const latestId = documents[0].id;
    const { data: doc } = await supabase
      .from('documents')
      .select('*')
      .eq('id', latestId)
      .single();

    console.log('\n=== Latest Document Content ===');
    console.log('Has Alchemy content:', doc?.content?.includes('ALCHEMY SECTION'));
    console.log('Has Section 8:', doc?.content?.includes('## 8.'));
    console.log('\nFirst 500 chars:', doc?.content?.substring(0, 500));
    console.log('\nLast 500 chars:', doc?.content?.substring(doc?.content?.length - 500));
  }
}

checkDocument();
