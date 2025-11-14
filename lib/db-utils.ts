import { sql } from '@vercel/postgres';

/**
 * Database utility functions for Vercel Postgres
 */

/**
 * Execute a query and return all results
 */
export async function queryAll<T = any>(
  query: string,
  params: any[] = []
): Promise<T[]> {
  const result = await sql.query(query, params);
  return result.rows as T[];
}

/**
 * Execute a query and return the first result
 */
export async function queryOne<T = any>(
  query: string,
  params: any[] = []
): Promise<T | null> {
  const result = await sql.query(query, params);
  return result.rows[0] as T || null;
}

/**
 * Execute an INSERT/UPDATE/DELETE query
 */
export async function execute(
  query: string,
  params: any[] = []
): Promise<{ rowCount: number; rows: any[] }> {
  const result = await sql.query(query, params);
  return {
    rowCount: result.rowCount || 0,
    rows: result.rows
  };
}

/**
 * Execute multiple queries in a transaction
 */
export async function executeBatch(
  queries: Array<{ query: string; params?: any[] }>
): Promise<Array<{ rowCount: number; rows: any[] }>> {
  // Vercel Postgres doesn't have a direct batch API, so we execute in a transaction
  const results: Array<{ rowCount: number; rows: any[] }> = [];
  
  // Start transaction
  await sql.query('BEGIN');
  
  try {
    for (const { query, params = [] } of queries) {
      const result = await sql.query(query, params);
      results.push({
        rowCount: result.rowCount || 0,
        rows: result.rows
      });
    }
    await sql.query('COMMIT');
  } catch (error) {
    await sql.query('ROLLBACK');
    throw error;
  }
  
  return results;
}

/**
 * Get a client by ID
 */
export async function getClientById(clientId: string) {
  return queryOne(
    "SELECT * FROM clients WHERE id = $1",
    [clientId]
  );
}

/**
 * Get a user by Clerk ID
 */
export async function getUserById(userId: string) {
  return queryOne(
    "SELECT * FROM users WHERE id = $1",
    [userId]
  );
}

/**
 * Get user with client information
 */
export async function getUserWithClient(userId: string) {
  return queryOne(
    `SELECT 
      u.*,
      c.name as client_name,
      c.email as client_email,
      c.company_name,
      c.status as client_status
    FROM users u
    JOIN clients c ON u.client_id = c.id
    WHERE u.id = $1`,
    [userId]
  );
}

/**
 * Get tickets for a client with optional filters
 */
export async function getTickets(
  clientId: string,
  filters: {
    status?: string;
    priority?: string;
    project_id?: string;
  } = {}
) {
  let query = `
    SELECT 
      t.*,
      p.name as project_name
    FROM tickets t
    LEFT JOIN projects p ON t.project_id = p.id
    WHERE t.client_id = $1
  `;
  const params: any[] = [clientId];
  let paramIndex = 2;

  if (filters.status) {
    query += ` AND t.status = $${paramIndex}`;
    params.push(filters.status);
    paramIndex++;
  }

  if (filters.priority) {
    query += ` AND t.priority = $${paramIndex}`;
    params.push(filters.priority);
    paramIndex++;
  }

  if (filters.project_id) {
    query += ` AND t.project_id = $${paramIndex}`;
    params.push(filters.project_id);
    paramIndex++;
  }

  query += " ORDER BY t.created_at DESC";

  return queryAll(query, params);
}

/**
 * Get ticket by ID with comments
 */
export async function getTicketWithComments(ticketId: string) {
  const ticket = await queryOne(
    `SELECT 
      t.*,
      p.name as project_name
    FROM tickets t
    LEFT JOIN projects p ON t.project_id = p.id
    WHERE t.id = $1`,
    [ticketId]
  );

  if (!ticket) return null;

  const comments = await queryAll(
    `SELECT 
      tc.*,
      u.first_name,
      u.last_name,
      u.email
    FROM ticket_comments tc
    JOIN users u ON tc.user_id = u.id
    WHERE tc.ticket_id = $1
    ORDER BY tc.created_at ASC`,
    [ticketId]
  );

  return { ...ticket, comments };
}

/**
 * Get projects for a client
 */
export async function getProjects(clientId: string) {
  return queryAll(
    `SELECT 
      p.*,
      COUNT(DISTINCT t.id) as ticket_count,
      SUM(CASE WHEN t.status = 'open' THEN 1 ELSE 0 END) as open_tickets
    FROM projects p
    LEFT JOIN tickets t ON p.id = t.project_id
    WHERE p.client_id = $1
    GROUP BY p.id
    ORDER BY p.created_at DESC`,
    [clientId]
  );
}

/**
 * Get invoices for a client with optional filters
 */
export async function getInvoices(
  clientId: string,
  filters: {
    status?: string;
    date_from?: string;
    date_to?: string;
  } = {}
) {
  let query = `
    SELECT 
      i.*,
      p.amount as paid_amount,
      p.status as payment_status
    FROM invoices i
    LEFT JOIN payments p ON i.id = p.invoice_id
    WHERE i.client_id = $1
  `;
  const params: any[] = [clientId];
  let paramIndex = 2;

  if (filters.status) {
    query += ` AND i.status = $${paramIndex}`;
    params.push(filters.status);
    paramIndex++;
  }

  if (filters.date_from) {
    query += ` AND i.issue_date >= $${paramIndex}`;
    params.push(filters.date_from);
    paramIndex++;
  }

  if (filters.date_to) {
    query += ` AND i.issue_date <= $${paramIndex}`;
    params.push(filters.date_to);
    paramIndex++;
  }

  query += " ORDER BY i.issue_date DESC";

  return queryAll(query, params);
}

/**
 * Get invoice with line items
 */
export async function getInvoiceWithItems(invoiceId: string) {
  const invoice = await queryOne(
    "SELECT * FROM invoices WHERE id = $1",
    [invoiceId]
  );

  if (!invoice) return null;

  const items = await queryAll(
    "SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY created_at ASC",
    [invoiceId]
  );

  return { ...invoice, items };
}

/**
 * Get documents for a client with optional project filter
 */
export async function getDocuments(
  clientId: string,
  projectId?: string
) {
  let query = `
    SELECT 
      d.*,
      p.name as project_name,
      u.first_name as uploader_first_name,
      u.last_name as uploader_last_name
    FROM documents d
    LEFT JOIN projects p ON d.project_id = p.id
    JOIN users u ON d.uploaded_by = u.id
    WHERE d.client_id = $1
  `;
  const params: any[] = [clientId];

  if (projectId) {
    query += " AND d.project_id = $2";
    params.push(projectId);
  }

  query += " ORDER BY d.uploaded_at DESC";

  return queryAll(query, params);
}

/**
 * Get active subscriptions for a client
 */
export async function getActiveSubscriptions(clientId: string) {
  return queryAll(
    `SELECT 
      s.*,
      sp.name as package_name,
      sp.description as package_description,
      sp.price_monthly,
      sp.price_annual
    FROM subscriptions s
    JOIN service_packages sp ON s.service_package_id = sp.id
    WHERE s.client_id = $1 AND s.status = 'active'
    ORDER BY s.created_at DESC`,
    [clientId]
  );
}

/**
 * Get payment history for a client
 */
export async function getPayments(
  clientId: string,
  filters: {
    date_from?: string;
    date_to?: string;
  } = {}
) {
  let query = `
    SELECT 
      p.*,
      i.invoice_number,
      s.service_package_id
    FROM payments p
    LEFT JOIN invoices i ON p.invoice_id = i.id
    LEFT JOIN subscriptions s ON p.subscription_id = s.id
    WHERE p.client_id = $1
  `;
  const params: any[] = [clientId];
  let paramIndex = 2;

  if (filters.date_from) {
    query += ` AND p.created_at >= $${paramIndex}`;
    params.push(filters.date_from);
    paramIndex++;
  }

  if (filters.date_to) {
    query += ` AND p.created_at <= $${paramIndex}`;
    params.push(filters.date_to);
    paramIndex++;
  }

  query += " ORDER BY p.created_at DESC";

  return queryAll(query, params);
}

/**
 * Log activity to audit trail
 */
export async function logActivity(
  data: {
    user_id?: string;
    client_id?: string;
    action: string;
    entity_type?: string;
    entity_id?: string;
    details?: Record<string, any>;
    ip_address?: string;
  }
) {
  const id = generateId("log");
  const detailsJson = data.details ? JSON.stringify(data.details) : null;

  return execute(
    `INSERT INTO activity_log 
      (id, user_id, client_id, action, entity_type, entity_id, details, ip_address)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      id,
      data.user_id || null,
      data.client_id || null,
      data.action,
      data.entity_type || null,
      data.entity_id || null,
      detailsJson,
      data.ip_address || null,
    ]
  );
}

/**
 * Generate a unique ID with optional prefix
 */
export function generateId(prefix: string = ""): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 11);
  return prefix ? `${prefix}_${timestamp}${randomStr}` : `${timestamp}${randomStr}`;
}

/**
 * Generate sequential invoice number
 */
export async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;

  // Get the last invoice number for this year
  const lastInvoice = await queryOne<{ invoice_number: string }>(
    `SELECT invoice_number FROM invoices 
     WHERE invoice_number LIKE $1 
     ORDER BY invoice_number DESC 
     LIMIT 1`,
    [`${prefix}%`]
  );

  let nextNumber = 1;
  if (lastInvoice) {
    const lastNumber = parseInt(lastInvoice.invoice_number.split("-")[2]);
    nextNumber = lastNumber + 1;
  }

  return `${prefix}${nextNumber.toString().padStart(4, "0")}`;
}

/**
 * Pagination helper
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function paginate<T>(
  query: string,
  countQuery: string,
  params: any[] = [],
  options: PaginationParams = {}
): Promise<PaginatedResult<T>> {
  const page = options.page || 1;
  const limit = options.limit || 20;
  const offset = (page - 1) * limit;

  // Get total count
  const countResult = await queryOne<{ count: number }>(countQuery, params);
  const total = countResult?.count || 0;

  // Get paginated data
  const paramCount = params.length;
  const paginatedQuery = `${query} LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
  const data = await queryAll<T>(paginatedQuery, [...params, limit, offset]);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
