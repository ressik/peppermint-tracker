-- Create FCM tokens table to store user device tokens
CREATE TABLE IF NOT EXISTS fcm_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token TEXT UNIQUE NOT NULL,
  user_name TEXT,
  device_info TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE fcm_tokens ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (since tokens are device-specific, not user-sensitive)
CREATE POLICY "Allow all operations on fcm_tokens" ON fcm_tokens
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create index on token for faster lookups
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_token ON fcm_tokens(token);

-- Create index on user_name for filtering
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_user_name ON fcm_tokens(user_name);
