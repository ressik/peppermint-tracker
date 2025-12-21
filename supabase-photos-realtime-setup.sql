-- Enable realtime for the photos table (for upload notifications)
-- Run this in your Supabase SQL Editor if photo upload notifications aren't working

-- Make sure the photos table is part of the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE photos;

-- Verify it was added (optional - just for checking)
-- SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
