-- Database initialization script for Troddit user preferences
-- This script creates the user_prefs table for storing user preferences as JSON

-- Create the user preferences table
CREATE TABLE IF NOT EXISTS user_prefs (
    -- user_id stores the Reddit username from NextAuth session
    user_id TEXT PRIMARY KEY,
    
    -- data stores all user preferences as a flexible JSON structure
    -- This allows storing any preference without schema changes
    data JSONB NOT NULL,
    
    -- updated_at tracks when preferences were last modified
    -- Automatically set to current timestamp on insert/update
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add an index on updated_at for potential future cleanup or analytics queries
CREATE INDEX IF NOT EXISTS idx_user_prefs_updated_at ON user_prefs(updated_at);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update updated_at on UPDATE
CREATE TRIGGER update_user_prefs_updated_at 
    BEFORE UPDATE ON user_prefs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();