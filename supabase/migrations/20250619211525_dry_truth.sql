/*
  # Fix subscription logic to maintain premium access until expiration

  1. Updates
    - Modify the get_user_subscription function to return cancelled subscriptions that haven't expired yet
    - Update check_and_expire_subscriptions to only expire subscriptions that are past their expiry date
    - Ensure cancelled subscriptions remain active until they actually expire

  2. Logic Changes
    - Cancelled subscriptions should still be considered "active" for access purposes until expiry
    - Only expired subscriptions should trigger downgrade to free plan
    - Users keep premium features until their paid period ends, even if cancelled
*/

-- Drop and recreate the get_user_subscription function with corrected logic
DROP FUNCTION IF EXISTS get_user_subscription(uuid);

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
    s.expires_at,
    s.cancelled_at,
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

-- Update the check_and_expire_subscriptions function to handle cancelled subscriptions properly
DROP FUNCTION IF EXISTS check_and_expire_subscriptions();

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