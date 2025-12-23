-- Add reply_to column to comments table
ALTER TABLE comments ADD COLUMN IF NOT EXISTS reply_to UUID REFERENCES comments(id) ON DELETE SET NULL;

-- Create index for faster lookups of replies
CREATE INDEX IF NOT EXISTS idx_comments_reply_to ON comments(reply_to);
