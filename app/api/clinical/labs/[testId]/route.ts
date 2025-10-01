import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/clinical/labs/[testId]
 * Fetch a specific lab result by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { testId: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { testId } = params;

    const labResult = await prisma.labResultStandardization.findUnique({
      where: { id: testId },
      include: {
        loincCode: {
          include: {
            units: true,
          },
        },
        referenceRange: true,
      },
    });

    if (!labResult) {
      return NextResponse.json(
        { error: 'Lab result not found' },
        { status: 404 }
      );
    }

    // Transform to API format
    const transformedResult = {
      id: labResult.id,
      patientId: session.user.id,
      testName: labResult.loincCode.longName,
      loincCode: labResult.loincCode.loincNumber,
      value: labResult.standardizedValue || labResult.originalValue,
      unit: labResult.standardizedUnit || labResult.originalUnit || '',
      referenceRange: labResult.referenceRange ? {
        low: labResult.referenceRange.minValue,
        high: labResult.referenceRange.maxValue,
        text: labResult.referenceRange.rangeText,
        ageGroup: labResult.referenceRange.ageGroup,
        gender: labResult.referenceRange.gender,
      } : undefined,
      interpretation: labResult.interpretation,
      flags: labResult.flags,
      performedDate: labResult.performedDate,
      resultDate: labResult.resultDate,
      orderingProvider: labResult.orderingProvider,
      performingLab: labResult.performingLab,
      status: labResult.status,
      notes: labResult.notes,
    };

    return NextResponse.json(transformedResult);
  } catch (error) {
    console.error('Error fetching lab result:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lab result' },
      { status: 500 }
    );
  }
}