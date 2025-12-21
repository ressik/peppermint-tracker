-- Create reactions table for chat message reactions
CREATE TABLE IF NOT EXISTS reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_name, emoji)
);

-- Enable Row Level Security
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow everyone to read reactions
CREATE POLICY "Anyone can read reactions"
  ON reactions
  FOR SELECT
  TO public
  USING (true);

-- Create policy to allow everyone to insert reactions
CREATE POLICY "Anyone can insert reactions"
  ON reactions
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create policy to allow users to delete their own reactions
CREATE POLICY "Users can delete their own reactions"
  ON reactions
  FOR DELETE
  TO public
  USING (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS reactions_message_id_idx ON reactions(message_id);
CREATE INDEX IF NOT EXISTS reactions_created_at_idx ON reactions(created_at DESC);

-- Enable realtime for the reactions table
ALTER PUBLICATION supabase_realtime ADD TABLE reactions;
