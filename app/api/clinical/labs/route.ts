import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { LabInterpretation, LabStatus } from '@/lib/types/clinical-data';

/**
 * GET /api/clinical/labs
 * Fetch lab results for the authenticated patient
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const patientId = searchParams.get('patientId') || session.user.id;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const testTypes = searchParams.get('testTypes')?.split(',');
    const interpretations = searchParams.get('interpretations')?.split(',');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = {
      repository: {
        userId: patientId,
      },
    };

    // Add date range filter
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Fetch lab results from LabResultStandardization
    const labResults = await prisma.labResultStandardization.findMany({
      where,
      include: {
        loincCode: {
          include: {
            units: true,
          },
        },
        referenceRange: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    // Get total count
    const total = await prisma.labResultStandardization.count({ where });

    // Transform to API format
    const transformedResults = labResults.map((result) => ({
      id: result.id,
      patientId,
      testName: result.loincCode.longName,
      loincCode: result.loincCode.loincNumber,
      value: result.standardizedValue || result.originalValue,
      unit: result.standardizedUnit || result.originalUnit || '',
      referenceRange: result.referenceRange ? {
        low: result.referenceRange.minValue,
        high: result.referenceRange.maxValue,
        text: result.referenceRange.rangeText,
        ageGroup: result.referenceRange.ageGroup,
        gender: result.referenceRange.gender,
      } : undefined,
      interpretation: result.interpretation || LabInterpretation.NORMAL,
      flags: result.flags,
      performedDate: result.performedDate,
      resultDate: result.resultDate,
      orderingProvider: result.orderingProvider || 'Unknown',
      performingLab: result.performingLab || 'Unknown',
      status: result.status || LabStatus.FINAL,
      notes: result.notes,
    }));

    return NextResponse.json({
      results: transformedResults,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching lab results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lab results' },
      { status: 500 }
    );
  }
}