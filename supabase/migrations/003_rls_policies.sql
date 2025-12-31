-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_stats ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Decisions table policies
CREATE POLICY "Users can read own decisions"
  ON decisions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own decisions"
  ON decisions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own decisions"
  ON decisions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own decisions"
  ON decisions FOR DELETE
  USING (auth.uid() = user_id);

-- Messages table policies
CREATE POLICY "Users can read messages from own decisions"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM decisions
      WHERE decisions.id = messages.decision_id
      AND decisions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages for own decisions"
  ON messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM decisions
      WHERE decisions.id = messages.decision_id
      AND decisions.user_id = auth.uid()
    )
  );

-- Documents table policies
CREATE POLICY "Users can read documents from own decisions"
  ON documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM decisions
      WHERE decisions.id = documents.decision_id
      AND decisions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create documents for own decisions"
  ON documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM decisions
      WHERE decisions.id = documents.decision_id
      AND decisions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update documents for own decisions"
  ON documents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM decisions
      WHERE decisions.id = documents.decision_id
      AND decisions.user_id = auth.uid()
    )
  );

-- Workflows table policies (read-only for all authenticated users)
CREATE POLICY "Authenticated users can read workflows"
  ON workflows FOR SELECT
  USING (auth.role() = 'authenticated');

-- Payment stats policies (read-only for all authenticated users)
CREATE POLICY "Authenticated users can read payment stats"
  ON payment_stats FOR SELECT
  USING (auth.role() = 'authenticated');
