-- Create photo_reactions table for gallery photo reactions
CREATE TABLE IF NOT EXISTS photo_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(photo_id, user_name, emoji)
);

-- Enable Row Level Security
ALTER TABLE photo_reactions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow everyone to read reactions
CREATE POLICY "Anyone can read photo reactions"
  ON photo_reactions
  FOR SELECT
  TO public
  USING (true);

-- Create policy to allow everyone to insert reactions
CREATE POLICY "Anyone can insert photo reactions"
  ON photo_reactions
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create policy to allow users to delete their own reactions
CREATE POLICY "Users can delete their own photo reactions"
  ON photo_reactions
  FOR DELETE
  TO public
  USING (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS photo_reactions_photo_id_idx ON photo_reactions(photo_id);
CREATE INDEX IF NOT EXISTS photo_reactions_created_at_idx ON photo_reactions(created_at DESC);

-- Enable realtime for the photo_reactions table
ALTER PUBLICATION supabase_realtime ADD TABLE photo_reactions;
