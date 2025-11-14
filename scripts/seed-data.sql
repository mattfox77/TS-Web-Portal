-- Seed data for Tech Support Client Portal
-- Run this after initializing the database schema

-- Insert service packages
INSERT INTO service_packages (id, name, description, price_monthly, price_annual, features, is_active) VALUES
  (
    'pkg_basic',
    'Basic Support',
    'Essential IT support for small businesses',
    99.00,
    990.00,
    '["Email support (24-hour response)", "Remote troubleshooting", "Software installation assistance", "Monthly system health check", "Basic security monitoring"]',
    1
  ),
  (
    'pkg_professional',
    'Professional Support',
    'Comprehensive IT support with priority response',
    249.00,
    2490.00,
    '["Priority email support (4-hour response)", "Phone support during business hours", "Remote and on-site troubleshooting", "Weekly system health checks", "Advanced security monitoring", "Backup management", "Software updates and patches", "Network monitoring"]',
    1
  ),
  (
    'pkg_enterprise',
    'Enterprise Support',
    'Full-service IT management for growing businesses',
    499.00,
    4990.00,
    '["24/7 priority support (1-hour response)", "Dedicated account manager", "Unlimited remote and on-site support", "Daily system monitoring", "Enterprise security suite", "Automated backup and disaster recovery", "Proactive maintenance", "Network infrastructure management", "Cloud services management", "Quarterly technology planning sessions"]',
    1
  ),
  (
    'pkg_custom_dev',
    'Custom Development',
    'Hourly rate for custom software development projects',
    NULL,
    NULL,
    '["Custom web application development", "API integration", "Database design", "Mobile app development", "DevOps and CI/CD setup", "Code review and optimization"]',
    1
  );

-- Note: Admin user and initial client should be created through the application
-- after Clerk authentication is set up
