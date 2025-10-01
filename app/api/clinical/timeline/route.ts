import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { TimelineEventType } from '@/lib/types/clinical-data';

/**
 * GET /api/clinical/timeline
 * Fetch health timeline events for the authenticated patient
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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const eventTypes = searchParams.get('eventTypes')?.split(',');
    const limit = parseInt(searchParams.get('limit') || '100');

    // Fetch patient repository
    const repository = await prisma.patientRepository.findFirst({
      where: { userId: patientId },
    });

    if (!repository) {
      return NextResponse.json({ events: [], total: 0 });
    }

    const events: any[] = [];

    // Fetch medications
    if (!eventTypes || eventTypes.includes(TimelineEventType.MEDICATION)) {
      const medications = await prisma.patientMedication.findMany({
        where: {
          repositoryId: repository.id,
          ...(startDate && { startDate: { gte: new Date(startDate) } }),
          ...(endDate && { startDate: { lte: new Date(endDate) } }),
        },
        orderBy: { startDate: 'desc' },
        take: limit,
      });

      events.push(...medications.map((med) => ({
        id: med.id,
        patientId,
        type: TimelineEventType.MEDICATION,
        title: `Started ${med.name}`,
        description: `${med.dosage} - ${med.frequency}`,
        date: med.startDate,
        provider: med.prescribedBy,
        category: 'medication',
        status: med.status,
      })));
    }

    // Fetch diagnoses
    if (!eventTypes || eventTypes.includes(TimelineEventType.DIAGNOSIS)) {
      const diagnoses = await prisma.patientDiagnosis.findMany({
        where: {
          repositoryId: repository.id,
          ...(startDate && { diagnosedDate: { gte: new Date(startDate) } }),
          ...(endDate && { diagnosedDate: { lte: new Date(endDate) } }),
        },
        orderBy: { diagnosedDate: 'desc' },
        take: limit,
      });

      events.push(...diagnoses.map((diag) => ({
        id: diag.id,
        patientId,
        type: TimelineEventType.DIAGNOSIS,
        title: diag.condition,
        description: diag.notes,
        date: diag.diagnosedDate,
        category: 'diagnosis',
        status: diag.status,
        metadata: {
          icd10Code: diag.icd10Code,
          severity: diag.severity,
        },
      })));
    }

    // Fetch procedures
    if (!eventTypes || eventTypes.includes(TimelineEventType.PROCEDURE)) {
      const procedures = await prisma.patientProcedure.findMany({
        where: {
          repositoryId: repository.id,
          ...(startDate && { date: { gte: new Date(startDate) } }),
          ...(endDate && { date: { lte: new Date(endDate) } }),
        },
        orderBy: { date: 'desc' },
        take: limit,
      });

      events.push(...procedures.map((proc) => ({
        id: proc.id,
        patientId,
        type: TimelineEventType.PROCEDURE,
        title: proc.name,
        description: proc.notes,
        date: proc.date,
        provider: proc.performedBy,
        category: 'procedure',
        status: proc.status,
      })));
    }

    // Fetch immunizations
    if (!eventTypes || eventTypes.includes(TimelineEventType.IMMUNIZATION)) {
      const immunizations = await prisma.patientImmunization.findMany({
        where: {
          repositoryId: repository.id,
          ...(startDate && { date: { gte: new Date(startDate) } }),
          ...(endDate && { date: { lte: new Date(endDate) } }),
        },
        orderBy: { date: 'desc' },
        take: limit,
      });

      events.push(...immunizations.map((imm) => ({
        id: imm.id,
        patientId,
        type: TimelineEventType.IMMUNIZATION,
        title: imm.vaccine,
        description: imm.notes,
        date: imm.date,
        provider: imm.administeredBy,
        category: 'immunization',
        status: imm.status,
      })));
    }

    // Fetch allergies
    if (!eventTypes || eventTypes.includes(TimelineEventType.ALLERGY)) {
      const allergies = await prisma.patientAllergy.findMany({
        where: {
          repositoryId: repository.id,
          ...(startDate && endDate && {
            diagnosedDate: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          }),
        },
        orderBy: { diagnosedDate: 'desc' },
        take: limit,
      });

      events.push(...allergies.map((allergy) => ({
        id: allergy.id,
        patientId,
        type: TimelineEventType.ALLERGY,
        title: `Allergy: ${allergy.allergen}`,
        description: `${allergy.type} - ${allergy.reaction}`,
        date: allergy.diagnosedDate || allergy.createdAt,
        category: 'allergy',
        metadata: {
          severity: allergy.severity,
        },
      })));
    }

    // Sort all events by date
    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({
      events: events.slice(0, limit),
      total: events.length,
    });
  } catch (error) {
    console.error('Error fetching timeline:', error);
    return NextResponse.json(
      { error: 'Failed to fetch timeline' },
      { status: 500 }
    );
  }
}