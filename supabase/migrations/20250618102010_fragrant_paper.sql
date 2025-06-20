/*
  # Create SQL queries table

  1. New Tables
    - `sql_queries`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `title` (text, query title/description)
      - `prompt` (text, original user prompt)
      - `sql_query` (text, generated SQL query)
      - `table_schemas` (jsonb, table schema definitions used)
      - `execution_result` (jsonb, sample execution result if any)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `sql_queries` table
    - Add policy for authenticated users to manage their own queries
*/

CREATE TABLE IF NOT EXISTS sql_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  prompt text NOT NULL,
  sql_query text NOT NULL,
  table_schemas jsonb DEFAULT '[]'::jsonb,
  execution_result jsonb DEFAULT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sql_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own SQL queries"
  ON sql_queries
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX sql_queries_user_id_idx ON sql_queries(user_id);
CREATE INDEX sql_queries_created_at_idx ON sql_queries(created_at DESC);