import { z } from 'zod';
import { ValidationError } from './errors';

// ============================================================================
// Ticket Schemas
// ============================================================================

export const createTicketSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200, 'Title must be less than 200 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000, 'Description must be less than 5000 characters'),
  project_id: z.string().uuid().optional().nullable(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
});

export const updateTicketSchema = z.object({
  status: z.enum(['open', 'in_progress', 'waiting_client', 'resolved', 'closed']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assigned_to: z.string().uuid().optional().nullable(),
});

export const createTicketCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(5000, 'Comment must be less than 5000 characters'),
  is_internal: z.boolean().optional().default(false),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type CreateTicketCommentInput = z.infer<typeof createTicketCommentSchema>;

// ============================================================================
// Invoice Schemas
// ============================================================================

export const createInvoiceSchema = z.object({
  client_id: z.string().uuid(),
  line_items: z.array(z.object({
    description: z.string().min(1).max(500),
    quantity: z.number().positive(),
    unit_price: z.number().positive(),
  })).min(1),
  due_date: z.string(),
  notes: z.string().max(1000).optional(),
  tax_rate: z.number().min(0).max(1).optional().default(0),
});

export const sendInvoiceEmailSchema = z.object({
  invoice_id: z.string().uuid(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type SendInvoiceEmailInput = z.infer<typeof sendInvoiceEmailSchema>;

// ============================================================================
// Payment Schemas
// ============================================================================

export const createPaymentOrderSchema = z.object({
  invoice_id: z.string().uuid(),
});

export const capturePaymentOrderSchema = z.object({
  order_id: z.string().min(1),
  invoice_id: z.string().uuid(),
});

export const createSubscriptionSchema = z.object({
  service_package_id: z.string().uuid(),
  billing_cycle: z.enum(['monthly', 'annual']),
});

export type CreatePaymentOrderInput = z.infer<typeof createPaymentOrderSchema>;
export type CapturePaymentOrderInput = z.infer<typeof capturePaymentOrderSchema>;
export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;

// ============================================================================
// Project Schemas
// ============================================================================

export const createProjectSchema = z.object({
  client_id: z.string().uuid(),
  name: z.string().min(1, 'Project name is required').max(200),
  description: z.string().max(5000).optional(),
  status: z.enum(['planning', 'active', 'on_hold', 'completed', 'cancelled']).optional().default('planning'),
  github_repo: z.string().url().optional().nullable(),
  start_date: z.string().optional().nullable(),
  estimated_completion: z.string().optional().nullable(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional().nullable(),
  status: z.enum(['planning', 'active', 'on_hold', 'completed', 'cancelled']).optional(),
  github_repo: z.string().url().optional().nullable(),
  start_date: z.string().optional().nullable(),
  estimated_completion: z.string().optional().nullable(),
  actual_completion: z.string().optional().nullable(),
});

export const updateProjectBudgetSchema = z.object({
  budget_alert_threshold: z.number().min(0).optional().nullable(),
  budget_limit: z.number().min(0).optional().nullable(),
  alert_emails: z.string().email().array().optional().nullable(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type UpdateProjectBudgetInput = z.infer<typeof updateProjectBudgetSchema>;

// ============================================================================
// Client Schemas
// ============================================================================

export const createClientSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  email: z.string().email('Invalid email address'),
  company_name: z.string().max(200).optional(),
  phone: z.string().max(50).optional(),
  address: z.string().max(500).optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional().default('active'),
});

export const updateClientSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().optional(),
  company_name: z.string().max(200).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;

// ============================================================================
// Document Schemas
// ============================================================================

export const uploadDocumentSchema = z.object({
  project_id: z.string().uuid().optional().nullable(),
  filename: z.string().min(1).max(255),
  file_size: z.number().positive().max(50 * 1024 * 1024, 'File size must be less than 50MB'),
  file_type: z.string().min(1).max(100),
});

export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;

// ============================================================================
// User Preferences Schemas
// ============================================================================

export const updateUserPreferencesSchema = z.object({
  email_notifications: z.boolean().optional(),
  ticket_updates: z.boolean().optional(),
  invoice_notifications: z.boolean().optional(),
  payment_confirmations: z.boolean().optional(),
  project_updates: z.boolean().optional(),
});

export type UpdateUserPreferencesInput = z.infer<typeof updateUserPreferencesSchema>;

// ============================================================================
// API Usage Tracking Schemas
// ============================================================================

export const recordApiUsageSchema = z.object({
  project_id: z.string().uuid(),
  provider: z.string().min(1).max(100),
  model: z.string().min(1).max(100),
  input_tokens: z.number().int().min(0).optional().default(0),
  output_tokens: z.number().int().min(0).optional().default(0),
  total_tokens: z.number().int().min(0).optional().default(0),
  cost_usd: z.number().min(0).optional().default(0),
  request_timestamp: z.string().optional(),
});

export type RecordApiUsageInput = z.infer<typeof recordApiUsageSchema>;

// ============================================================================
// Admin Schemas
// ============================================================================

export const impersonateUserSchema = z.object({
  user_id: z.string().min(1, 'User ID is required'),
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(500),
});

export type ImpersonateUserInput = z.infer<typeof impersonateUserSchema>;

// ============================================================================
// Validation Helper Functions
// ============================================================================

/**
 * Validates input data against a Zod schema and returns typed result
 * Throws ValidationError with details if validation fails
 */
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.reduce((acc: Record<string, string>, err: z.ZodIssue) => {
        const path = err.path.join('.');
        acc[path] = err.message;
        return acc;
      }, {} as Record<string, string>);
      
      throw new ValidationError(formattedErrors);
    }
    throw error;
  }
}

/**
 * Validates input data and returns success/error result without throwing
 */
export function safeValidateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const formattedErrors = result.error.errors.reduce((acc: Record<string, string>, err: z.ZodIssue) => {
    const path = err.path.join('.');
    acc[path] = err.message;
    return acc;
  }, {} as Record<string, string>);
  
  return { success: false, errors: formattedErrors };
}

/**
 * Sanitizes string input by trimming whitespace and removing null bytes
 */
export function sanitizeString(input: string): string {
  return input.trim().replace(/\0/g, '');
}

/**
 * Sanitizes an object by applying sanitizeString to all string values
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = { ...obj } as any;
  
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeString(sanitized[key]);
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeObject(sanitized[key]);
    }
  }
  
  return sanitized as T;
}
