/**
 * File Upload Approval API
 * 
 * POST /api/uploads/approve - Approve or reject upload cost
 */

import { NextRequest, NextResponse } from 'next/server';
import { FileUploadService } from '@/lib/services/FileUploadService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      uploadId,
      approved,
      processingOption,
      packageIndex,
      newTier,
    } = body;
    
    if (!uploadId || approved === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: uploadId, approved' },
        { status: 400 }
      );
    }
    
    if (approved && !processingOption) {
      return NextResponse.json(
        { error: 'Processing option required when approving' },
        { status: 400 }
      );
    }
    
    const result = await FileUploadService.approveCost({
      uploadId,
      approved,
      processingOption,
      packageIndex,
      newTier,
    });
    
    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Upload approval error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to approve upload' },
      { status: 500 }
    );
  }
}