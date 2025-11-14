import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

/**
 * Health Check Endpoint
 * 
 * This endpoint provides a simple health check for monitoring services.
 * It verifies that the application is running and can connect to required services.
 * 
 * @returns 200 OK if healthy, 503 Service Unavailable if unhealthy
 */
export const runtime = 'edge';

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  checks: {
    database: 'ok' | 'error';
  };
  uptime?: number;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
  const health: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    checks: {
      database: 'ok',
    },
  };

  try {
    // Check database connection
    try {
      await sql`SELECT 1`;
      health.checks.database = 'ok';
    } catch (error) {
      console.error('Database health check failed:', error);
      health.checks.database = 'error';
      health.status = 'unhealthy';
    }

    // Calculate response time
    const responseTime = Date.now() - startTime;
    health.uptime = responseTime;

    // Return appropriate status code
    const statusCode = health.status === 'healthy' ? 200 : 503;

    return NextResponse.json(health, {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
