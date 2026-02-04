CREATE TABLE IF NOT EXISTS capital_social (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    associate_name TEXT NOT NULL,
    account_number TEXT,
    capital_value NUMERIC,
    metadata JSONB DEFAULT '{}'::jsonb, -- Store dynamic CSV columns here
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE capital_social ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see and edit their own data
-- Drop if exists to avoid errors on re-run
DROP POLICY IF EXISTS "Users can manage their own capital social data" ON capital_social;

CREATE POLICY "Users can manage their own capital social data" ON capital_social
    FOR ALL
    USING (auth.uid() = user_id);
