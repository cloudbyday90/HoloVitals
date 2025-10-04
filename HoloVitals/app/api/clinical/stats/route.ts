import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/clinical/stats
 * Fetch dashboard statistics for the authenticated customer
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
    const customerId = searchParams.get('customerId') || session.user.id;

    // Get customer repository
    const repository = await prisma.customerRepository.findFirst({
      where: { userId: customerId },
    });

    if (!repository) {
      return NextResponse.json({
        totalLabResults: 0,
        recentLabResults: 0,
        abnormalResults: 0,
        activeMedications: 0,
        activeConditions: 0,
        allergies: 0,
        recentDocuments: 0,
        upcomingAppointments: 0,
      });
    }

    // Calculate date 30 days ago for "recent" queries
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Fetch all stats in parallel
    const [
      totalLabResults,
      recentLabResults,
      abnormalResults,
      activeMedications,
      activeConditions,
      allergies,
      recentDocuments,
    ] = await Promise.all([
      // Total lab results
      prisma.labResultStandardization.count({
        where: {
          repository: {
            userId: customerId,
          },
        },
      }),
      
      // Recent lab results (last 30 days)
      prisma.labResultStandardization.count({
        where: {
          repository: {
            userId: customerId,
          },
          performedDate: {
            gte: thirtyDaysAgo,
          },
        },
      }),
      
      // Abnormal results
      prisma.labResultStandardization.count({
        where: {
          repository: {
            userId: customerId,
          },
          interpretation: {
            in: ['HIGH', 'LOW', 'CRITICAL_HIGH', 'CRITICAL_LOW', 'ABNORMAL'],
          },
        },
      }),
      
      // Active medications
      prisma.customerMedication.count({
        where: {
          repositoryId: repository.id,
          status: 'ACTIVE',
        },
      }),
      
      // Active conditions
      prisma.customerDiagnosis.count({
        where: {
          repositoryId: repository.id,
          status: 'ACTIVE',
        },
      }),
      
      // Allergies
      prisma.customerAllergy.count({
        where: {
          repositoryId: repository.id,
        },
      }),
      
      // Recent documents (last 30 days)
      prisma.fHIRResource.count({
        where: {
          connection: {
            userId: customerId,
          },
          resourceType: 'DOCUMENT_REFERENCE',
          date: {
            gte: thirtyDaysAgo,
          },
        },
      }),
    ]);

    return NextResponse.json({
      totalLabResults,
      recentLabResults,
      abnormalResults,
      activeMedications,
      activeConditions,
      allergies,
      recentDocuments,
      upcomingAppointments: 0, // TODO: Implement appointments
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}