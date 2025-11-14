-- Migration: Add notification_preferences column to users table
-- Date: 2024-11-10
-- Description: Adds notification preferences support for email notifications

-- Add notification_preferences column with default values
ALTER TABLE users ADD COLUMN notification_preferences TEXT DEFAULT '{"tickets":true,"invoices":true,"payments":true,"subscriptions":true}';

-- Update existing users to have default notification preferences
UPDATE users 
SET notification_preferences = '{"tickets":true,"invoices":true,"payments":true,"subscriptions":true}'
WHERE notification_preferences IS NULL;
