import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserClientId } from '@/lib/auth';
import { queryOne, execute } from '@/lib/db-utils';
import { logActivity } from '@/lib/audit';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const clientId = await getUserClientId(userId);
    const document = await queryOne<{ id: string; client_id: string; storage_key: string; filename: string }>(
      'SELECT id, client_id, storage_key, filename FROM documents WHERE id = $1',
      [params.id]
    );

    if (!document) return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    if (document.client_id !== clientId) return NextResponse.json({ error: 'Access denied' }, { status: 403 });

    // TODO: Delete from Vercel Blob storage when migrated
    await execute('DELETE FROM documents WHERE id = $1', [params.id]);
    await logActivity({ user_id: userId, client_id: clientId, action: 'document_deleted', entity_type: 'document', entity_id: params.id, details: { filename: document.filename } });

    return NextResponse.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}
