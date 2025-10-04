import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/clinical/labs/trends
 * Fetch lab result trends for a specific test over time
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
    
    const patientId = searchParams.get('patientId') || session.user.id;
    const loincCode = searchParams.get('loincCode');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!loincCode) {
      return NextResponse.json(
        { error: 'loincCode parameter is required' },
        { status: 400 }
      );
    }

    // Build where clause
    const where: any = {
      repository: {
        userId: patientId,
      },
      loincCode: {
        loincNumber: loincCode,
      },
    };

    // Add date range filter
    if (startDate || endDate) {
      where.performedDate = {};
      if (startDate) where.performedDate.gte = new Date(startDate);
      if (endDate) where.performedDate.lte = new Date(endDate);
    }

    // Fetch lab results
    const labResults = await prisma.labResultStandardization.findMany({
      where,
      include: {
        loincCode: true,
        referenceRange: true,
      },
      orderBy: {
        performedDate: 'asc',
      },
    });

    // Transform to trend data
    const trendData = labResults.map((result) => ({
      date: result.performedDate,
      value: result.standardizedValue || parseFloat(result.originalValue),
      interpretation: result.interpretation,
      unit: result.standardizedUnit || result.originalUnit,
    }));

    // Get reference range (use the most recent one)
    const referenceRange = labResults[labResults.length - 1]?.referenceRange;

    return NextResponse.json({
      testName: labResults[0]?.loincCode.longName || 'Unknown Test',
      loincCode,
      unit: labResults[0]?.standardizedUnit || labResults[0]?.originalUnit || '',
      referenceRange: referenceRange ? {
        low: referenceRange.minValue,
        high: referenceRange.maxValue,
        text: referenceRange.rangeText,
      } : undefined,
      data: trendData,
    });
  } catch (error) {
    console.error('Error fetching lab trends:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lab trends' },
      { status: 500 }
    );
  }
}