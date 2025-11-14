import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserClientId } from '@/lib/auth';
import { getDocuments } from '@/lib/db-utils';

// GET /api/documents - List documents with pre-signed URLs
export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id') || undefined;

    const clientId = await getUserClientId(userId);

    // Get documents from database
    const results = await getDocuments(clientId, projectId);

    // Generate download URLs for each document
    // TODO: Replace R2 with Vercel Blob storage
    const documentsWithUrls = results.map((doc: any) => ({
      ...doc,
      download_url: `${request.nextUrl.origin}/api/documents/${doc.id}/download`,
    }));

    return NextResponse.json({ documents: documentsWithUrls });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

// POST /api/documents - Upload document
// TODO: Implement with Vercel Blob storage instead of R2
export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Document upload not yet implemented - requires Vercel Blob storage migration' },
      { status: 501 }
    );
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    );
  }
}
