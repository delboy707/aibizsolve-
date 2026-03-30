-- Add missing DELETE policy for documents table
-- Without this, users cannot delete their own documents even though
-- SELECT, INSERT, and UPDATE policies exist.

CREATE POLICY "Users can delete documents for own decisions"
  ON documents FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM decisions
      WHERE decisions.id = documents.decision_id
      AND decisions.user_id = auth.uid()
    )
  );
