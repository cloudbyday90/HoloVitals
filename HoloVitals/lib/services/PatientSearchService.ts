/**
 * Customer Search Service
 * Comprehensive customer search and management functionality
 */

import { PrismaClient } from '@prisma/client';
import {
  CustomerSearchParams,
  CustomerSearchResult,
  PatientSummary,
  Customer,
  CustomerDetails,
  PatientStatistics,
} from '@/lib/types/customer-search';

const prisma = new PrismaClient();

export class CustomerSearchService {
  /**
   * Search customers with advanced filtering
   */
  async searchPatients(params: CustomerSearchParams): Promise<CustomerSearchResult> {
    const {
      query,
      firstName,
      lastName,
      dateOfBirth,
      medicalRecordNumber,
      email,
      phone,
      status,
      gender,
      ageMin,
      ageMax,
      hasCondition,
      hasAllergy,
      primaryCareProvider,
      insuranceProvider,
      lastVisitFrom,
      lastVisitTo,
      page = 1,
      limit = 20,
      sortBy = 'lastName',
      sortOrder = 'asc',
    } = params;

    // Build where clause
    const where: any = {};

    // General search query (searches across multiple fields)
    if (query) {
      where.OR = [
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { medicalRecordNumber: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query, mode: 'insensitive' } },
      ];
    }

    // Specific field filters
    if (firstName) {
      where.firstName = { contains: firstName, mode: 'insensitive' };
    }

    if (lastName) {
      where.lastName = { contains: lastName, mode: 'insensitive' };
    }

    if (dateOfBirth) {
      where.dateOfBirth = dateOfBirth;
    }

    if (medicalRecordNumber) {
      where.medicalRecordNumber = { contains: medicalRecordNumber, mode: 'insensitive' };
    }

    if (email) {
      where.email = { contains: email, mode: 'insensitive' };
    }

    if (phone) {
      where.phone = { contains: phone, mode: 'insensitive' };
    }

    if (status) {
      where.status = status;
    }

    if (gender) {
      where.gender = gender;
    }

    // Age range filter
    if (ageMin !== undefined || ageMax !== undefined) {
      const today = new Date();
      if (ageMin !== undefined) {
        const maxDate = new Date(today.getFullYear() - ageMin, today.getMonth(), today.getDate());
        where.dateOfBirth = { ...where.dateOfBirth, lte: maxDate };
      }
      if (ageMax !== undefined) {
        const minDate = new Date(today.getFullYear() - ageMax - 1, today.getMonth(), today.getDate());
        where.dateOfBirth = { ...where.dateOfBirth, gte: minDate };
      }
    }

    // Condition filter
    if (hasCondition) {
      where.conditions = {
        some: {
          description: { contains: hasCondition, mode: 'insensitive' },
          clinicalStatus: 'active',
        },
      };
    }

    // Allergy filter
    if (hasAllergy) {
      where.allergies = {
        some: {
          allergen: { contains: hasAllergy, mode: 'insensitive' },
        },
      };
    }

    // Primary care provider filter
    if (primaryCareProvider) {
      where.primaryCareProvider = { contains: primaryCareProvider, mode: 'insensitive' };
    }

    // Insurance provider filter
    if (insuranceProvider) {
      where.insuranceProvider = { contains: insuranceProvider, mode: 'insensitive' };
    }

    // Last visit date range
    if (lastVisitFrom || lastVisitTo) {
      where.lastVisit = {};
      if (lastVisitFrom) {
        where.lastVisit.gte = lastVisitFrom;
      }
      if (lastVisitTo) {
        where.lastVisit.lte = lastVisitTo;
      }
    }

    // Get total count
    const total = await prisma.customer.count({ where });

    // Calculate pagination
    const skip = (page - 1) * limit;
    const totalPages = Math.ceil(total / limit);

    // Fetch customers with related data
    const customers = await prisma.customer.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        conditions: {
          where: { clinicalStatus: 'active' },
          select: { id: true },
        },
        medications: {
          where: { status: 'active' },
          select: { id: true },
        },
        allergies: {
          select: { id: true },
        },
      },
    });

    // Transform to customer summaries
    const patientSummaries: PatientSummary[] = customers.map((customer) => ({
      id: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      fullName: `${customer.firstName} ${customer.lastName}`,
      dateOfBirth: customer.dateOfBirth,
      age: this.calculateAge(customer.dateOfBirth),
      gender: customer.gender as any,
      medicalRecordNumber: customer.medicalRecordNumber,
      email: customer.email || undefined,
      phone: customer.phone || undefined,
      status: customer.status as any,
      lastVisit: customer.lastVisit || undefined,
      nextAppointment: customer.nextAppointment || undefined,
      conditionsCount: customer.conditions.length,
      medicationsCount: customer.medications.length,
      allergiesCount: customer.allergies.length,
      riskLevel: undefined, // Will be populated from AI insights if available
      healthScore: undefined, // Will be populated from AI insights if available
    }));

    return {
      customers: patientSummaries,
      total,
      page,
      limit,
      totalPages,
      hasMore: page < totalPages,
    };
  }

  /**
   * Get customer by ID with full details
   */
  async getPatientById(customerId: string): Promise<CustomerDetails | null> {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        vitalSigns: {
          orderBy: { recordedAt: 'desc' },
          take: 10,
        },
        labResults: {
          orderBy: { resultDate: 'desc' },
          take: 20,
        },
        medications: {
          orderBy: { startDate: 'desc' },
        },
        conditions: {
          orderBy: { onsetDate: 'desc' },
        },
        allergies: true,
        appointments: {
          orderBy: { scheduledDate: 'desc' },
          take: 10,
        },
      },
    });

    if (!customer) {
      return null;
    }

    return customer as any;
  }

  /**
   * Get customer statistics
   */
  async getPatientStatistics(): Promise<PatientStatistics> {
    // Total counts
    const total = await prisma.customer.count();
    const active = await prisma.customer.count({ where: { status: 'active' } });
    const inactive = await prisma.customer.count({ where: { status: 'inactive' } });

    // By gender
    const male = await prisma.customer.count({ where: { gender: 'male' } });
    const female = await prisma.customer.count({ where: { gender: 'female' } });
    const other = await prisma.customer.count({ where: { gender: 'other' } });

    // By age group
    const today = new Date();
    const ageGroups = {
      '0-17': await this.countPatientsInAgeRange(0, 17),
      '18-34': await this.countPatientsInAgeRange(18, 34),
      '35-54': await this.countPatientsInAgeRange(35, 54),
      '55-74': await this.countPatientsInAgeRange(55, 74),
      '75+': await this.countPatientsInAgeRange(75, 150),
    };

    // Recent visits
    const todayStart = new Date(today.setHours(0, 0, 0, 0));
    const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const visitsToday = await prisma.customer.count({
      where: { lastVisit: { gte: todayStart } },
    });

    const visitsThisWeek = await prisma.customer.count({
      where: { lastVisit: { gte: weekStart } },
    });

    const visitsThisMonth = await prisma.customer.count({
      where: { lastVisit: { gte: monthStart } },
    });

    // Upcoming appointments
    const appointmentsToday = await prisma.appointment.count({
      where: {
        scheduledDate: {
          gte: todayStart,
          lt: new Date(todayStart.getTime() + 24 * 60 * 60 * 1000),
        },
        status: { in: ['scheduled', 'confirmed'] },
      },
    });

    const appointmentsThisWeek = await prisma.appointment.count({
      where: {
        scheduledDate: {
          gte: todayStart,
          lt: new Date(todayStart.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
        status: { in: ['scheduled', 'confirmed'] },
      },
    });

    const appointmentsThisMonth = await prisma.appointment.count({
      where: {
        scheduledDate: {
          gte: monthStart,
          lt: new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1),
        },
        status: { in: ['scheduled', 'confirmed'] },
      },
    });

    return {
      total,
      active,
      inactive,
      byGender: {
        male,
        female,
        other,
      },
      byAgeGroup: ageGroups,
      byRiskLevel: {
        low: 0, // Will be populated from AI insights
        moderate: 0,
        high: 0,
        critical: 0,
      },
      recentVisits: {
        today: visitsToday,
        thisWeek: visitsThisWeek,
        thisMonth: visitsThisMonth,
      },
      upcomingAppointments: {
        today: appointmentsToday,
        thisWeek: appointmentsThisWeek,
        thisMonth: appointmentsThisMonth,
      },
    };
  }

  /**
   * Quick search for autocomplete
   */
  async quickSearch(query: string, limit: number = 10): Promise<PatientSummary[]> {
    const customers = await prisma.customer.findMany({
      where: {
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { medicalRecordNumber: { contains: query, mode: 'insensitive' } },
        ],
        status: 'active',
      },
      take: limit,
      orderBy: { lastName: 'asc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        gender: true,
        medicalRecordNumber: true,
        email: true,
        phone: true,
        status: true,
      },
    });

    return customers.map((customer) => ({
      id: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      fullName: `${customer.firstName} ${customer.lastName}`,
      dateOfBirth: customer.dateOfBirth,
      age: this.calculateAge(customer.dateOfBirth),
      gender: customer.gender as any,
      medicalRecordNumber: customer.medicalRecordNumber,
      email: customer.email || undefined,
      phone: customer.phone || undefined,
      status: customer.status as any,
      conditionsCount: 0,
      medicationsCount: 0,
      allergiesCount: 0,
    }));
  }

  /**
   * Get recently viewed customers
   */
  async getRecentlyViewed(userId: string, limit: number = 10): Promise<PatientSummary[]> {
    // This would typically track user's recent customer views
    // For now, return most recently updated customers
    const customers = await prisma.customer.findMany({
      take: limit,
      orderBy: { updatedAt: 'desc' },
      include: {
        conditions: {
          where: { clinicalStatus: 'active' },
          select: { id: true },
        },
        medications: {
          where: { status: 'active' },
          select: { id: true },
        },
        allergies: {
          select: { id: true },
        },
      },
    });

    return customers.map((customer) => ({
      id: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      fullName: `${customer.firstName} ${customer.lastName}`,
      dateOfBirth: customer.dateOfBirth,
      age: this.calculateAge(customer.dateOfBirth),
      gender: customer.gender as any,
      medicalRecordNumber: customer.medicalRecordNumber,
      email: customer.email || undefined,
      phone: customer.phone || undefined,
      status: customer.status as any,
      lastVisit: customer.lastVisit || undefined,
      nextAppointment: customer.nextAppointment || undefined,
      conditionsCount: customer.conditions.length,
      medicationsCount: customer.medications.length,
      allergiesCount: customer.allergies.length,
    }));
  }

  /**
   * Helper methods
   */

  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  private async countPatientsInAgeRange(minAge: number, maxAge: number): Promise<number> {
    const today = new Date();
    const maxDate = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate());
    const minDate = new Date(today.getFullYear() - maxAge - 1, today.getMonth(), today.getDate());

    return await prisma.customer.count({
      where: {
        dateOfBirth: {
          gte: minDate,
          lte: maxDate,
        },
      },
    });
  }
}

export default new CustomerSearchService();