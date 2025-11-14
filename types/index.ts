// Cloudflare Workers environment bindings
export interface Env {
  DB: D1Database;
  DOCUMENTS: R2Bucket;
  
  // Authentication
  CLERK_SECRET_KEY: string;
  CLERK_WEBHOOK_SECRET: string;
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: string;
  
  // PayPal
  PAYPAL_CLIENT_ID: string;
  PAYPAL_CLIENT_SECRET: string;
  PAYPAL_MODE: 'sandbox' | 'live';
  
  // GitHub
  GITHUB_TOKEN: string;
  GITHUB_WEBHOOK_SECRET?: string;
  
  // Email
  SENDGRID_API_KEY: string;
  SENDGRID_FROM_EMAIL: string;
}

// Client interface
export interface Client {
  id: string;
  name: string;
  email: string;
  company_name?: string;
  phone?: string;
  address?: string;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  updated_at: string;
}

// User interface
export interface User {
  id: string; // Clerk user ID
  client_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: 'user' | 'admin';
  notification_preferences?: NotificationPreferences;
  created_at: string;
}

// Notification Preferences interface
export interface NotificationPreferences {
  tickets: boolean;
  invoices: boolean;
  payments: boolean;
  subscriptions: boolean;
}

// Service Package interface
export interface ServicePackage {
  id: string;
  name: string;
  description?: string;
  price_monthly?: number;
  price_annual?: number;
  features?: string[]; // Parsed from JSON
  is_active: boolean;
  created_at: string;
}

// Subscription interface
export interface Subscription {
  id: string;
  client_id: string;
  service_package_id: string;
  paypal_subscription_id?: string;
  status: 'active' | 'cancelled' | 'expired' | 'suspended';
  billing_cycle: 'monthly' | 'annual';
  start_date: string;
  next_billing_date?: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
  service_package?: ServicePackage; // Joined data
}

// Project interface
export interface Project {
  id: string;
  client_id: string;
  name: string;
  description?: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  github_repo?: string;
  start_date?: string;
  estimated_completion?: string;
  actual_completion?: string;
  created_at: string;
  updated_at: string;
}

// Ticket interface
export interface Ticket {
  id: string;
  client_id: string;
  project_id?: string;
  user_id: string;
  title: string;
  description?: string;
  status: 'open' | 'in_progress' | 'waiting_client' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  github_issue_number?: number;
  github_issue_url?: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  project_name?: string; // Joined data
}

// Ticket Comment interface
export interface TicketComment {
  id: string;
  ticket_id: string;
  user_id: string;
  content: string;
  is_internal: boolean;
  created_at: string;
  user?: User; // Joined data
}

// Invoice interface
export interface Invoice {
  id: string;
  invoice_number: string;
  client_id: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  currency: string;
  issue_date: string;
  due_date: string;
  paid_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  items?: InvoiceItem[]; // Joined data
}

// Invoice Item interface
export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  created_at: string;
}

// Payment interface
export interface Payment {
  id: string;
  invoice_id?: string;
  subscription_id?: string;
  client_id: string;
  paypal_transaction_id?: string;
  paypal_order_id?: string;
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  payment_method: string;
  created_at: string;
}

// Document interface
export interface Document {
  id: string;
  client_id: string;
  project_id?: string;
  filename: string;
  file_size: number;
  file_type: string;
  storage_key: string;
  uploaded_by: string;
  uploaded_at: string;
  download_url?: string; // Pre-signed URL
}

// API Usage interface
export interface ApiUsage {
  id: string;
  project_id: string;
  provider: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  cost_usd: number;
  request_timestamp: string;
}

// Activity Log Entry interface
export interface ActivityLogEntry {
  id: string;
  user_id?: string;
  client_id?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  details?: Record<string, any>; // Parsed JSON
  ip_address?: string;
  created_at: string;
}
