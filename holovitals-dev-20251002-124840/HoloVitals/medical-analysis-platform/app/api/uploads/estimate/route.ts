/**
 * File Upload Cost Estimation API
 * 
 * POST /api/uploads/estimate - Estimate cost for file upload
 */

import { NextRequest, NextResponse } from 'next/server';
import { FileUploadService } from '@/lib/services/FileUploadService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      fileName,
      filePath,
      fileSize,
      mimeType,
      requiresOCR = true,
      requiresAnalysis = true,
    } = body;
    
    if (!userId || !fileName || !filePath || !fileSize || !mimeType) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, fileName, filePath, fileSize, mimeType' },
        { status: 400 }
      );
    }
    
    const result = await FileUploadService.createUpload({
      userId,
      fileName,
      filePath,
      fileSize,
      mimeType,
      requiresOCR,
      requiresAnalysis,
    });
    
    return NextResponse.json({
      success: true,
      upload: result.upload,
      costEstimation: result.costEstimation,
      tierConfig: result.tierConfig,
    });
  } catch (error: any) {
    console.error('File upload estimation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to estimate upload cost' },
      { status: 500 }
    );
  }
}