import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * POST /api/documents/upload
 * Upload a new document
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const type = formData.get('type') as string;
    const category = formData.get('category') as string;
    const date = formData.get('date') as string;
    const provider = formData.get('provider') as string;
    const tags = formData.get('tags') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size (max 25MB)
    const maxSize = 25 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 25MB limit' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const uploadDir = join(process.cwd(), 'uploads', 'documents', session.user.id);
    
    // Create upload directory if it doesn't exist
    await mkdir(uploadDir, { recursive: true });
    
    // Save file
    const filePath = join(uploadDir, fileName);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Get EHR connection for this user
    const connection = await prisma.eHRConnection.findFirst({
      where: {
        userId: session.user.id,
        status: 'ACTIVE',
      },
    });

    if (!connection) {
      return NextResponse.json(
        { error: 'No active EHR connection found' },
        { status: 400 }
      );
    }

    // Create FHIR resource record
    const document = await prisma.fHIRResource.create({
      data: {
        connectionId: connection.id,
        resourceType: 'DOCUMENT_REFERENCE',
        fhirId: uuidv4(),
        title: title || file.name,
        description,
        date: date ? new Date(date) : new Date(),
        category: category || type,
        status: 'AVAILABLE',
        contentType: file.type,
        contentUrl: `/uploads/documents/${session.user.id}/${fileName}`,
        contentSize: file.size,
        documentDownloaded: true,
        localFilePath: filePath,
        processed: false,
        metadata: JSON.stringify({
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
          provider,
          tags: tags ? tags.split(',').map(t => t.trim()) : [],
        }),
      },
    });

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        title: document.title,
        url: document.contentUrl,
        contentType: document.contentType,
        fileSize: document.contentSize,
      },
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    );
  }
}