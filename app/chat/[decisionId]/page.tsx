import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ChatClient from './ChatClient';
import type { Message } from '@/types';

export default async function ChatDecisionPage({
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

  // Fetch messages
  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('decision_id', decisionId)
    .order('created_at', { ascending: true });

  return (
    <ChatClient
      decisionId={decisionId}
      decisionTitle={decision.title}
      initialMessages={messages as Message[] || []}
    />
  );
}
