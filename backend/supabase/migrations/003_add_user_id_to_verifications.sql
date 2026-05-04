-- Add user_id column to price_verifications for authenticated users
ALTER TABLE price_verifications ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_price_verifications_user_id ON price_verifications(user_id);

-- Update RLS if needed (though it's usually managed by service role in backend)
ALTER TABLE price_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anyone to read verifications"
ON price_verifications FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Allow authenticated users to insert verifications"
ON price_verifications FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
