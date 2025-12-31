import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedPaymentStats() {
  console.log('Seeding payment_stats table...');

  // Check if data already exists
  const { data: existing, error: checkError } = await supabase
    .from('payment_stats')
    .select('*');

  if (checkError) {
    console.error('Error checking existing data:', checkError);
    return;
  }

  if (existing && existing.length > 0) {
    console.log('Payment stats already exist:');
    console.table(existing);
    console.log('\nSkipping seed. Delete existing records first if you want to re-seed.');
    return;
  }

  // Seed initial payment stats
  const initialStats = [
    {
      segment: 'solopreneur',
      average_payment: 50.00,
      median_payment: 45.00,
      payment_count: 0,
    },
    {
      segment: 'small_business',
      average_payment: 100.00,
      median_payment: 90.00,
      payment_count: 0,
    },
    {
      segment: 'manager',
      average_payment: 150.00,
      median_payment: 140.00,
      payment_count: 0,
    },
    {
      segment: 'ceo',
      average_payment: 250.00,
      median_payment: 225.00,
      payment_count: 0,
    },
  ];

  const { data, error } = await supabase
    .from('payment_stats')
    .insert(initialStats)
    .select();

  if (error) {
    console.error('Error seeding payment_stats:', error);
    return;
  }

  console.log('✅ Successfully seeded payment_stats:');
  console.table(data);
}

seedPaymentStats().catch(console.error);
