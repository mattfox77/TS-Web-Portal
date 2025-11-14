-- Migration: Add usage budget thresholds to projects table
-- This allows setting budget limits and alert thresholds for API usage tracking

-- Add budget threshold columns to projects table
ALTER TABLE projects ADD COLUMN budget_threshold_usd REAL DEFAULT NULL;
ALTER TABLE projects ADD COLUMN budget_alert_threshold_percent INTEGER DEFAULT 80;
ALTER TABLE projects ADD COLUMN last_budget_alert_sent TEXT DEFAULT NULL;

-- Create index for efficient budget alert queries
CREATE INDEX IF NOT EXISTS idx_projects_budget_threshold ON projects(budget_threshold_usd) WHERE budget_threshold_usd IS NOT NULL;
