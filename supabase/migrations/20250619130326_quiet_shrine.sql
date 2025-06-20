/*
  # Create saved_schemas table for storing reusable table schemas

  1. New Tables
    - `saved_schemas`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `name` (text, schema name)
      - `description` (text, schema description)
      - `tables` (jsonb, table definitions)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `saved_schemas` table
    - Add policies for users to manage their own schemas

  3. Indexes
    - Index on user_id for efficient querying
    - Index on created_at for sorting
*/

CREATE TABLE IF NOT EXISTS saved_schemas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  tables jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE saved_schemas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own saved schemas"
  ON saved_schemas
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX saved_schemas_user_id_idx ON saved_schemas(user_id);
CREATE INDEX saved_schemas_created_at_idx ON saved_schemas(created_at DESC);

CREATE TRIGGER on_saved_schemas_updated
  BEFORE UPDATE ON saved_schemas
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();