/*
  # Fix type mismatch in get_user_subscription function

  1. Changes
    - Drop existing get_user_subscription functions to ensure clean recreation
    - Recreate get_user_subscription(user_uuid uuid) with explicit type casting
    - Ensure expires_at is properly handled as timestamptz type
    - Update check_and_expire_subscriptions function for consistency

  2. Security
    - Maintain SECURITY DEFINER for proper access control
    - Keep RLS policies intact
*/

-- Drop existing functions to ensure clean recreation
DROP FUNCTION IF EXISTS get_user_subscription(uuid);
DROP FUNCTION IF EXISTS get_user_subscription();
DROP FUNCTION IF EXISTS check_and_expire_subscriptions();

-- Recreate check_and_expire_subscriptions function
CREATE OR REPLACE FUNCTION check_and_expire_subscriptions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update expired premium subscriptions to expired status (both active and cancelled)
  UPDATE subscriptions 
  SET 
    status = 'expired',
    updated_at = now()
  WHERE 
    plan = 'premium' 
    AND status IN ('active', 'cancelled')
    AND expires_at IS NOT NULL 
    AND expires_at < now();
    
  -- Create free subscriptions for users whose premium subscriptions have expired
  -- and who don't already have an active free subscription
  INSERT INTO subscriptions (user_id, plan, status, starts_at, expires_at)
  SELECT DISTINCT
    s1.user_id,
    'free',
    'active',
    now(),
    NULL
  FROM subscriptions s1
  WHERE 
    s1.plan = 'premium' 
    AND s1.status = 'expired'
    AND s1.expires_at < now()
    AND NOT EXISTS (
      SELECT 1 FROM subscriptions s2 
      WHERE s2.user_id = s1.user_id 
      AND s2.plan = 'free' 
      AND s2.status = 'active'
      AND s2.created_at >= s1.expires_at
    );
END;
$$;

-- Recreate get_user_subscription function with explicit type casting
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
  
  -- Return the user's current subscription (active or cancelled but not expired)
  RETURN QUERY
  SELECT 
    s.id,
    s.plan,
    s.status,
    s.starts_at,
    s.expires_at::timestamptz, -- Explicit cast to ensure correct type
    s.cancelled_at::timestamptz, -- Explicit cast to ensure correct type
    CASE 
      WHEN s.expires_at IS NULL THEN NULL
      ELSE GREATEST(0, EXTRACT(days FROM (s.expires_at - now()))::integer)
    END as days_remaining
  FROM subscriptions s
  WHERE s.user_id = user_uuid
    AND (
      s.status = 'active' OR 
      (s.status = 'cancelled' AND s.expires_at IS NOT NULL AND s.expires_at > now())
    )
  ORDER BY 
    CASE WHEN s.plan = 'premium' THEN 1 ELSE 2 END,
    s.created_at DESC
  LIMIT 1;
END;
$$;