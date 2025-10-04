import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { unlink } from 'fs/promises';

/**
 * GET /api/documents/[documentId]
 * Get a specific document
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { documentId } = params;

    const document = await prisma.fHIRResource.findUnique({
      where: { id: documentId },
      include: {
        connection: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Verify user has access to this document
    if (document.connection.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      id: document.id,
      title: document.title,
      description: document.description,
      type: document.category,
      category: document.category,
      date: document.date,
      contentType: document.contentType,
      fileSize: document.contentSize,
      url: document.contentUrl,
      status: document.status,
      metadata: document.metadata ? JSON.parse(document.metadata) : {},
    });
  } catch (error) {
    console.error('Error fetching document:', error);
    return NextResponse.json(
      { error: 'Failed to fetch document' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/documents/[documentId]
 * Delete a document
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { documentId } = params;

    const document = await prisma.fHIRResource.findUnique({
      where: { id: documentId },
      include: {
        connection: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Verify user has access to this document
    if (document.connection.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Delete file from filesystem if it exists
    if (document.localFilePath) {
      try {
        await unlink(document.localFilePath);
      } catch (error) {
        console.error('Error deleting file:', error);
      }
    }

    // Delete database record
    await prisma.fHIRResource.delete({
      where: { id: documentId },
    });

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/documents/[documentId]
 * Update document metadata
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { documentId } = params;
    const body = await request.json();

    const document = await prisma.fHIRResource.findUnique({
      where: { id: documentId },
      include: {
        connection: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Verify user has access to this document
    if (document.connection.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Update document
    const updatedDocument = await prisma.fHIRResource.update({
      where: { id: documentId },
      data: {
        title: body.title || document.title,
        description: body.description !== undefined ? body.description : document.description,
        category: body.category || document.category,
        date: body.date ? new Date(body.date) : document.date,
        metadata: body.metadata ? JSON.stringify(body.metadata) : document.metadata,
      },
    });

    return NextResponse.json({
      success: true,
      document: {
        id: updatedDocument.id,
        title: updatedDocument.title,
        description: updatedDocument.description,
        category: updatedDocument.category,
        date: updatedDocument.date,
      },
    });
  } catch (error) {
    console.error('Error updating document:', error);
    return NextResponse.json(
      { error: 'Failed to update document' },
      { status: 500 }
    );
  }
}