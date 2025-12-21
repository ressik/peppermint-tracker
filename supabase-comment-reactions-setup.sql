-- Create comment_reactions table
CREATE TABLE IF NOT EXISTS comment_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, user_name, emoji)
);

-- Enable Row Level Security
ALTER TABLE comment_reactions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust based on your security needs)
CREATE POLICY "Allow all operations on comment_reactions" ON comment_reactions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Enable real-time for comment_reactions
ALTER PUBLICATION supabase_realtime ADD TABLE comment_reactions;
