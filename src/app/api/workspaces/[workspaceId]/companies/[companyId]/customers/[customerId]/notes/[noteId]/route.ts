import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/index';
import { customerNote } from '@/db/schema/tables/customers';
import { eq } from 'drizzle-orm';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string; customerId: string; noteId: string }> }
) {
  try {
    const { workspaceId, companyId, customerId, noteId } = await params;
    const body = await request.json();

    const { title, content, noteType, priority } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Not içeriği zorunludur' },
        { status: 400 }
      );
    }

    // Update the note
    const [updatedNote] = await db
      .update(customerNote)
      .set({
        title: title || null,
        content: content.trim(),
        noteType,
        priority,
        updatedAt: new Date(),
        // Note: updatedBy would come from auth context
      })
      .where(eq(customerNote.id, noteId))
      .returning();

    if (!updatedNote) {
      return NextResponse.json(
        { error: 'Not bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      note: updatedNote,
      message: 'Not başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Error updating customer note:', error);
    return NextResponse.json(
      { error: 'Not güncellenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string; customerId: string; noteId: string }> }
) {
  try {
    const { workspaceId, companyId, customerId, noteId } = await params;

    // Delete the note
    const [deletedNote] = await db
      .delete(customerNote)
      .where(eq(customerNote.id, noteId))
      .returning();

    if (!deletedNote) {
      return NextResponse.json(
        { error: 'Not bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Not başarıyla silindi'
    });
  } catch (error) {
    console.error('Error deleting customer note:', error);
    return NextResponse.json(
      { error: 'Not silinirken bir hata oluştu' },
      { status: 500 }
    );
  }
}
