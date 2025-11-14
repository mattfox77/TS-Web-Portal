import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserClientId } from '@/lib/auth';
import { queryOne } from '@/lib/db-utils';
import { logActivity } from '@/lib/audit';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const clientId = await getUserClientId(userId);
    const document = await queryOne<{ id: string; client_id: string; storage_key: string; filename: string; file_type: string }>(
      'SELECT id, client_id, storage_key, filename, file_type FROM documents WHERE id = $1',
      [params.id]
    );

    if (!document) return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    if (document.client_id !== clientId) return NextResponse.json({ error: 'Access denied' }, { status: 403 });

    // TODO: Implement Vercel Blob storage download
    await logActivity({ user_id: userId, client_id: clientId, action: 'document_downloaded', entity_type: 'document', entity_id: params.id, details: { filename: document.filename } });

    return NextResponse.json({ error: 'Document download not yet implemented - requires Vercel Blob storage migration' }, { status: 501 });
  } catch (error) {
    console.error('Error downloading document:', error);
    return NextResponse.json({ error: 'Failed to download document' }, { status: 500 });
  }
}
