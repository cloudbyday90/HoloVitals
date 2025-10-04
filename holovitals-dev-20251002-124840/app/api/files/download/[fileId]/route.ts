/**
 * File Download API Endpoint
 * 
 * Download secure files with decryption
 */

import { NextRequest, NextResponse } from 'next/server';
import { secureFileStorage } from '@/lib/services/SecureFileStorageService';

/**
 * GET /api/files/download/:fileId
 * Download file
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const reason = searchParams.get('reason') || 'File download';

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'User ID is required',
        },
        { status: 400 }
      );
    }

    // Get file metadata first
    const metadata = await secureFileStorage.getFileMetadata(params.fileId);

    if (!metadata) {
      return NextResponse.json(
        {
          success: false,
          error: 'File not found',
        },
        { status: 404 }
      );
    }

    // Download file
    const fileBuffer = await secureFileStorage.downloadFile({
      userId,
      fileId: params.fileId,
      reason,
    });

    // Return file
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': metadata.file_type || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${metadata.file_name}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Failed to download file:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to download file',
      },
      { status: 500 }
    );
  }
}