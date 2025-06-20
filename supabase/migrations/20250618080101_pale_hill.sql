/*
  # Create analyses table for data analysis storage

  1. New Tables
    - `analyses`
      - `id` (uuid, primary key) - Unique identifier for each analysis
      - `user_id` (uuid, foreign key) - References the user who created the analysis
      - `file_name` (text) - Name of the uploaded file
      - `file_data` (jsonb) - Processed data from the uploaded file
      - `ai_insights` (jsonb) - AI-generated insights about the data
      - `charts_config` (jsonb) - Configuration for generated charts
      - `created_at` (timestamptz) - When the analysis was created

  2. Security
    - Enable RLS on `analyses` table
    - Add policy for authenticated users to manage their own analyses
    - Users can only access analyses they created

  3. Indexes
    - Index on user_id for efficient querying of user's analyses
    - Index on created_at for sorting by date
*/

-- Create the analyses table
CREATE TABLE IF NOT EXISTS analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_data jsonb NOT NULL DEFAULT '[]'::jsonb,
  ai_insights jsonb NOT NULL DEFAULT '[]'::jsonb,
  charts_config jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own analyses
CREATE POLICY "Users can manage their own analyses"
  ON analyses
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS analyses_user_id_idx ON analyses(user_id);
CREATE INDEX IF NOT EXISTS analyses_created_at_idx ON analyses(created_at DESC);