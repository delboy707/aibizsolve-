import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DocumentClient from './DocumentClient';

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ decisionId: string }>;
}) {
  const { decisionId } = await params;
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  // Fetch decision
  const { data: decision, error: decisionError } = await supabase
    .from('decisions')
    .select('*')
    .eq('id', decisionId)
    .eq('user_id', user.id)
    .single();

  if (decisionError || !decision) {
    redirect('/dashboard');
  }

  // Fetch user's subscription tier
  const { data: userData } = await supabase
    .from('users')
    .select('subscription_tier')
    .eq('id', user.id)
    .single();

  const { getAlchemyAccess } = await import('@/lib/tiers');
  const subscriptionTier = ((userData?.subscription_tier as string) || 'free') as Parameters<typeof getAlchemyAccess>[0];
  const alchemyAccess = getAlchemyAccess(subscriptionTier); // 'none' | 'teased' | 'full'

  // Fetch document
  const { data: document } = await supabase
    .from('documents')
    .select('*')
    .eq('decision_id', decisionId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!document) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            No document found
          </h1>
          <a
            href={`/chat/${decisionId}`}
            className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
          >
            Return to chat
          </a>
        </div>
      </div>
    );
  }

  // Pass raw alchemy content for the 'teased' state (blur overlay in the client)
  const alchemyRaw: string = (document.alchemy_content as { raw?: string } | null)?.raw ?? '';

  return (
    <DocumentClient
      decisionId={decisionId}
      document={document}
      alchemyAccess={alchemyAccess}
      alchemyRaw={alchemyRaw}
    />
  );
}
