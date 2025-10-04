/**
 * File Uploads API
 * 
 * GET /api/uploads - Get user's upload history
 * DELETE /api/uploads - Cancel upload
 */

import { NextRequest, NextResponse } from 'next/server';
import { FileUploadService } from '@/lib/services/FileUploadService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const uploadId = searchParams.get('uploadId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }
    
    if (uploadId) {
      // Get specific upload
      const upload = await FileUploadService.getUpload(uploadId);
      return NextResponse.json({
        success: true,
        upload,
      });
    } else {
      // Get user's upload history
      const result = await FileUploadService.getUserUploads(userId, limit, offset);
      return NextResponse.json({
        success: true,
        ...result,
      });
    }
  } catch (error: any) {
    console.error('Get uploads error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get uploads' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uploadId = searchParams.get('uploadId');
    const reason = searchParams.get('reason');
    
    if (!uploadId) {
      return NextResponse.json(
        { error: 'Missing uploadId parameter' },
        { status: 400 }
      );
    }
    
    const result = await FileUploadService.cancelUpload(uploadId, reason || undefined);
    
    return NextResponse.json({
      success: true,
      ...result,
      message: 'Upload cancelled successfully',
    });
  } catch (error: any) {
    console.error('Cancel upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cancel upload' },
      { status: 500 }
    );
  }
}