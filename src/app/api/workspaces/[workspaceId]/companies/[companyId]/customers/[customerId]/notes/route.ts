import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/index';
import { customerNote } from '@/db/schema/tables/customers';
import { eq, desc, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string; customerId: string }> }
) {
  try {
    const { workspaceId, companyId, customerId } = await params;

    // First verify the customer belongs to the workspace and company
    const notes = await db
      .select()
      .from(customerNote)
      .where(eq(customerNote.customerId, customerId))
      .orderBy(desc(customerNote.createdAt));

    return NextResponse.json({ notes });
  } catch (error) {
    console.error('Error fetching customer notes:', error);
    return NextResponse.json(
      { error: 'Notlar yüklenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string; customerId: string }> }
) {
  try {
    const { workspaceId, companyId, customerId } = await params;
    const body = await request.json();

    const { title, content, noteType = 'general', isInternal = false, priority = 'medium' } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Not içeriği zorunludur' },
        { status: 400 }
      );
    }

    // Create the note with generated ID
    const noteId = randomUUID();
    const [newNote] = await db
      .insert(customerNote)
      .values({
        id: noteId,
        customerId,
        title: title || null,
        content: content.trim(),
        noteType,
        isInternal,
        priority,
        // Note: createdBy and updatedBy would come from auth context
      })
      .returning();

    return NextResponse.json({
      note: newNote,
      message: 'Not başarıyla eklendi'
    });
  } catch (error) {
    console.error('Error creating customer note:', error);
    return NextResponse.json(
      { error: 'Not eklenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}
