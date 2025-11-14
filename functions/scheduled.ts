/**
 * Cloudflare Workers Scheduled Event Handler
 * 
 * This file handles cron triggers configured in wrangler.toml
 * It runs daily at 2:00 AM UTC to perform database backups
 * 
 * Note: This is a Cloudflare Pages Function that runs on the edge
 */

interface Env {
  DB: D1Database;
  DOCUMENTS: R2Bucket;
  CRON_SECRET?: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  // This function is called by Cloudflare Cron
  // It makes an internal request to the backup API endpoint
  
  const { env, request } = context;
  
  try {
    // Get the base URL from the request
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    
    // Call the backup endpoint
    const backupUrl = `${baseUrl}/api/cron/backup`;
    
    const response = await fetch(backupUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${env.CRON_SECRET || 'default-secret'}`,
        'User-Agent': 'Cloudflare-Cron-Trigger',
      },
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error('Scheduled backup failed:', result);
      return new Response(JSON.stringify(result), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    console.log('Scheduled backup completed successfully:', result);
    
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Scheduled backup error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
