/*
  # Remove preferences from profiles table

  1. Changes
    - Drop the policy that depends on the preferences column
    - Remove the preferences column from profiles table
    - Create a new simplified public profile policy

  2. Security
    - Maintain RLS protection
    - Allow authenticated users to view all public profiles
*/

-- First, drop the policy that depends on the preferences column
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;

-- Now we can safely remove the preferences column
ALTER TABLE profiles DROP COLUMN IF EXISTS preferences;

-- Create a new simplified public profile policy
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);