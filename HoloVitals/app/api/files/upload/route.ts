/**
 * File Upload API Endpoint
 * 
 * Upload secure files with encryption
 */

import { NextRequest, NextResponse } from 'next/server';
import { secureFileStorage } from '@/lib/services/SecureFileStorageService';

/**
 * POST /api/files/upload
 * Upload file
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const customerId = formData.get('customerId') as string | undefined;
    const category = formData.get('category') as string;
    const description = formData.get('description') as string | undefined;
    const tags = formData.get('tags') as string | undefined;

    if (!file || !userId || !category) {
      return NextResponse.json(
        {
          success: false,
          error: 'File, user ID, and category are required',
        },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload file
    const metadata = await secureFileStorage.uploadFile(buffer, {
      userId,
      customerId,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      category,
      description,
      tags: tags ? tags.split(',') : [],
      encrypt: true,
    });

    return NextResponse.json({
      success: true,
      data: metadata,
      message: 'File uploaded successfully',
    });
  } catch (error) {
    console.error('Failed to upload file:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to upload file',
      },
      { status: 500 }
    );
  }
}