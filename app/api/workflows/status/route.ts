
    
     import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  const supabase = createClient(
    'https://fivmliegmqukdshfduld.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpdm1saWVnbXF1a2RzaGZkdWxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNDgwMzksImV4cCI6MjA4MTYyNDAzOX0.qYq45QDRfC2iiQC8XNxPTjr3bsE47LmGQN4QmcOTZdg'
  );

  const { count, error } = await supabase
    .from('workflows')
    .select('*', { count: 'exact', head: true });

  return NextResponse.json({
    count,
    error: error?.message ?? null,
    status: error ? 'FAIL' : 'SUCCESS',
  });
}
