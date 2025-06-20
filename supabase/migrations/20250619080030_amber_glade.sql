/*
  # Create subscriptions table for subscription management

  1. New Tables
    - `subscriptions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `plan` (text, 'free' or 'premium')
      - `status` (text, 'active', 'cancelled', 'expired')
      - `starts_at` (timestamp)
      - `expires_at` (timestamp, null for free plan)
      - `cancelled_at` (timestamp, null if not cancelled)
      - `payment_reference` (text, Paystack reference)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `subscriptions` table
    - Add policies for users to manage their own subscriptions

  3. Functions
    - Function to automatically expire subscriptions
    - Function to check and update subscription status

  4. Changes
    - Remove subscription_plan from profiles table (will be managed via subscriptions table)
*/

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan text NOT NULL CHECK (plan IN ('free', 'premium')),
  status text NOT NULL CHECK (status IN ('active', 'cancelled', 'expired')) DEFAULT 'active',
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NULL, -- NULL for free plan (never expires)
  cancelled_at timestamptz NULL,
  payment_reference text NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions"
  ON subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions"
  ON subscriptions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON subscriptions(status);
CREATE INDEX IF NOT EXISTS subscriptions_expires_at_idx ON subscriptions(expires_at);
CREATE INDEX IF NOT EXISTS subscriptions_payment_reference_idx ON subscriptions(payment_reference);

-- Create updated_at trigger
CREATE TRIGGER on_subscriptions_updated
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Function to check and expire subscriptions
CREATE OR REPLACE FUNCTION check_and_expire_subscriptions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update expired premium subscriptions to expired status
  UPDATE subscriptions 
  SET 
    status = 'expired',
    updated_at = now()
  WHERE 
    plan = 'premium' 
    AND status = 'active' 
    AND expires_at IS NOT NULL 
    AND expires_at < now();
    
  -- Create free subscriptions for users with expired premium subscriptions
  INSERT INTO subscriptions (user_id, plan, status, starts_at, expires_at)
  SELECT 
    user_id,
    'free',
    'active',
    now(),
    NULL
  FROM subscriptions s1
  WHERE 
    s1.plan = 'premium' 
    AND s1.status = 'expired'
    AND NOT EXISTS (
      SELECT 1 FROM subscriptions s2 
      WHERE s2.user_id = s1.user_id 
      AND s2.plan = 'free' 
      AND s2.status = 'active'
      AND s2.created_at > s1.expires_at
    );
END;
$$;

-- Function to get user's current active subscription
CREATE OR REPLACE FUNCTION get_user_subscription(user_uuid uuid)
RETURNS TABLE (
  subscription_id uuid,
  plan text,
  status text,
  starts_at timestamptz,
  expires_at timestamptz,
  cancelled_at timestamptz,
  days_remaining integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- First, check and expire any subscriptions
  PERFORM check_and_expire_subscriptions();
  
  -- Return the user's current active subscription
  RETURN QUERY
  SELECT 
    s.id,
    s.plan,
    s.status,
    s.starts_at,
    s.expires_at,
    s.cancelled_at,
    CASE 
      WHEN s.expires_at IS NULL THEN NULL
      ELSE GREATEST(0, EXTRACT(days FROM (s.expires_at - now()))::integer)
    END as days_remaining
  FROM subscriptions s
  WHERE s.user_id = user_uuid
    AND s.status = 'active'
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$;

-- Create default free subscriptions for existing users
INSERT INTO subscriptions (user_id, plan, status, starts_at, expires_at)
SELECT 
  id,
  'free',
  'active',
  created_at,
  NULL
FROM profiles
WHERE NOT EXISTS (
  SELECT 1 FROM subscriptions 
  WHERE subscriptions.user_id = profiles.id
);

-- Remove subscription_plan column from profiles (if it exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'subscription_plan'
  ) THEN
    ALTER TABLE profiles DROP COLUMN subscription_plan;
  END IF;
END $$;