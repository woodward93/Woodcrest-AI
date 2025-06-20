/*
  # Fix get_user_subscription function type mismatch

  1. Function Updates
    - Drop and recreate `get_user_subscription` function
    - Ensure `expires_at` is returned as timestamp with time zone, not text
    - Maintain proper return type structure for subscription data

  2. Changes
    - Remove any text casting on timestamp columns
    - Ensure consistent data types in function return
*/

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS get_user_subscription();

-- Recreate the function with correct type handling
CREATE OR REPLACE FUNCTION get_user_subscription()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  plan text,
  status text,
  starts_at timestamptz,
  expires_at timestamptz,
  cancelled_at timestamptz,
  payment_reference text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.user_id,
    s.plan,
    s.status,
    s.starts_at,
    s.expires_at,  -- Keep as timestamptz, don't cast to text
    s.cancelled_at,
    s.payment_reference,
    s.created_at,
    s.updated_at
  FROM subscriptions s
  WHERE s.user_id = auth.uid()
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$;