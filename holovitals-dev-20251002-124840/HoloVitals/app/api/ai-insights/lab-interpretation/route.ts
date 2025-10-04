/**
 * Lab Result Interpretation API Endpoint
 * GET /api/ai-insights/lab-interpretation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import LabResultInterpreterService from '@/lib/services/ai/LabResultInterpreterService';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const testId = searchParams.get('testId');
    const patientId = searchParams.get('patientId');
    const panelType = searchParams.get('panelType');

    // Single test interpretation
    if (testId) {
      const interpretation = await LabResultInterpreterService.interpretLabResult(testId);
      return NextResponse.json({
        success: true,
        data: interpretation,
      });
    }

    // Panel interpretation
    if (patientId && panelType) {
      const validPanels = ['metabolic', 'lipid', 'cbc', 'thyroid', 'liver', 'kidney'];
      if (!validPanels.includes(panelType)) {
        return NextResponse.json(
          { error: 'Invalid panel type' },
          { status: 400 }
        );
      }

      const panelInterpretation = await LabResultInterpreterService.interpretLabPanel(
        patientId,
        panelType as any
      );

      return NextResponse.json({
        success: true,
        data: panelInterpretation,
      });
    }

    return NextResponse.json(
      { error: 'Either testId or (patientId and panelType) are required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Lab interpretation API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}