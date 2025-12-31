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

  return <DocumentClient decisionId={decisionId} document={document} />;
}
