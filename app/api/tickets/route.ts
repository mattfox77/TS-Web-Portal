import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import { getUserClientId } from '@/lib/auth';
import { Ticket, Project, User } from '@/types';
import { createTicketSchema } from '@/lib/validation';
import { createGitHubIssue } from '@/lib/github';
import { sendEmail, getTicketCreatedEmail, shouldSendNotification } from '@/lib/email';
import { paginateQuery, parsePaginationParams } from '@/lib/pagination';
import { execute, queryOne } from '@/lib/db-utils';

export const runtime = 'edge';

// GET /api/tickets - List tickets with filtering
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientId = await getUserClientId(userId);

    // Get query parameters for filtering and pagination
    const url = new URL(request.url);
    const { page, perPage } = parsePaginationParams(url);
    const status = url.searchParams.get('status');
    const priority = url.searchParams.get('priority');
    const projectId = url.searchParams.get('project_id');

    // Build query with filters
    let baseQuery = `
      SELECT 
        t.*,
        p.name as project_name
      FROM tickets t
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.client_id = $1
    `;
    
    let countQuery = `
      SELECT COUNT(*) as count
      FROM tickets t
      WHERE t.client_id = $1
    `;
    
    const params: any[] = [clientId];
    let paramIndex = 2;

    if (status) {
      baseQuery += ` AND t.status = $${paramIndex}`;
      countQuery += ` AND t.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (priority) {
      baseQuery += ` AND t.priority = $${paramIndex}`;
      countQuery += ` AND t.priority = $${paramIndex}`;
      params.push(priority);
      paramIndex++;
    }

    if (projectId) {
      baseQuery += ` AND t.project_id = $${paramIndex}`;
      countQuery += ` AND t.project_id = $${paramIndex}`;
      params.push(projectId);
      paramIndex++;
    }

    baseQuery += ' ORDER BY t.created_at DESC';

    // Use pagination helper
    const result = await paginateQuery<Ticket>(
      baseQuery,
      countQuery,
      params,
      page,
      perPage
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}

// POST /api/tickets - Create a new ticket
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientId = await getUserClientId(userId);

    // Parse and validate request body
    const body = await request.json();
    const validated = createTicketSchema.parse(body);

    // Generate ticket ID
    const ticketId = crypto.randomUUID();
    const now = new Date().toISOString();

    // Insert ticket into database
    await execute(
      `INSERT INTO tickets (
        id, client_id, project_id, user_id, title, description,
        status, priority, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        ticketId,
        clientId,
        validated.project_id || null,
        userId,
        validated.title,
        validated.description,
        'open',
        validated.priority,
        now,
        now
      ]
    );

    // Get the created ticket with project name
    const ticket = await queryOne<Ticket>(
      `SELECT 
        t.*,
        p.name as project_name
      FROM tickets t
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.id = $1`,
      [ticketId]
    );

    if (!ticket) {
      throw new Error('Failed to retrieve created ticket');
    }

    // Create GitHub issue if project has a repository
    if (validated.project_id) {
      const project = await queryOne<Project>(
        'SELECT github_repo FROM projects WHERE id = $1',
        [validated.project_id]
      );

      if (project?.github_repo) {
        const githubIssue = await createGitHubIssue(
          project.github_repo,
          validated.title,
          validated.description,
          validated.priority,
          ticketId
        );

        if (githubIssue) {
          // Update ticket with GitHub issue info
          await execute(
            `UPDATE tickets 
            SET github_issue_number = $1, github_issue_url = $2
            WHERE id = $3`,
            [githubIssue.number, githubIssue.html_url, ticketId]
          );

          ticket.github_issue_number = githubIssue.number;
          ticket.github_issue_url = githubIssue.html_url;
        }
      }
    }

    // Send email notification (check preferences first)
    const shouldNotify = await shouldSendNotification(userId, 'tickets');
    
    if (shouldNotify) {
      const user = await queryOne<User>(
        'SELECT email FROM users WHERE id = $1',
        [userId]
      );

      if (user?.email) {
        const appUrl = new URL(request.url).origin;
        const emailTemplate = getTicketCreatedEmail(ticket, appUrl);
        await sendEmail(user.email, emailTemplate);
      }
    }

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error) {
    console.error('Error creating ticket:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error },
        { status: 422 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create ticket' },
      { status: 500 }
    );
  }
}
