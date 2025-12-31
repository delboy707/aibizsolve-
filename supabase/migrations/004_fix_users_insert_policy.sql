-- Fix: Add INSERT policy for users table
-- This allows new users to create their profile during signup

CREATE POLICY "Users can insert own data"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);
