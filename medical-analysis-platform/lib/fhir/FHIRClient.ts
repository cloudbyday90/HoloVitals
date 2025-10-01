/**
 * FHIR Client
 * 
 * Base FHIR R4 client for interacting with FHIR servers
 * Supports SMART on FHIR authentication and common FHIR operations
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

export interface FHIRClientConfig {
  baseUrl: string;
  accessToken?: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface FHIRSearchParams {
  [key: string]: string | number | boolean | string[];
}

export interface FHIRBundle {
  resourceType: 'Bundle';
  type: string;
  total?: number;
  entry?: Array<{
    resource: any;
    fullUrl?: string;
  }>;
  link?: Array<{
    relation: string;
    url: string;
  }>;
}

export class FHIRClient {
  private client: AxiosInstance;
  private baseUrl: string;
  private accessToken?: string;

  constructor(config: FHIRClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.accessToken = config.accessToken;

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: config.timeout || 30000,
      headers: {
        'Accept': 'application/fhir+json',
        'Content-Type': 'application/fhir+json',
        ...config.headers,
      },
    });

    // Add request interceptor for authentication
    this.client.interceptors.request.use((config) => {
      if (this.accessToken) {
        config.headers.Authorization = `Bearer ${this.accessToken}`;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          // FHIR OperationOutcome error
          const outcome = error.response.data;
          if (outcome?.resourceType === 'OperationOutcome') {
            const issues = outcome.issue || [];
            const messages = issues.map((i: any) => i.diagnostics || i.details?.text).filter(Boolean);
            throw new FHIRError(
              messages.join('; ') || 'FHIR operation failed',
              error.response.status,
              outcome
            );
          }
        }
        throw error;
      }
    );
  }

  /**
   * Update access token
   */
  setAccessToken(token: string) {
    this.accessToken = token;
  }

  /**
   * Read a resource by ID
   */
  async read(resourceType: string, id: string): Promise<any> {
    const response = await this.client.get(`/${resourceType}/${id}`);
    return response.data;
  }

  /**
   * Search for resources
   */
  async search(resourceType: string, params?: FHIRSearchParams): Promise<FHIRBundle> {
    const queryParams = this.buildQueryParams(params);
    const response = await this.client.get(`/${resourceType}`, { params: queryParams });
    return response.data;
  }

  /**
   * Search all pages and return all resources
   */
  async searchAll(resourceType: string, params?: FHIRSearchParams): Promise<any[]> {
    const resources: any[] = [];
    let bundle = await this.search(resourceType, params);

    // Add resources from first page
    if (bundle.entry) {
      resources.push(...bundle.entry.map(e => e.resource));
    }

    // Follow next links to get all pages
    while (bundle.link) {
      const nextLink = bundle.link.find(l => l.relation === 'next');
      if (!nextLink) break;

      const response = await this.client.get(nextLink.url);
      bundle = response.data;

      if (bundle.entry) {
        resources.push(...bundle.entry.map(e => e.resource));
      }
    }

    return resources;
  }

  /**
   * Create a new resource
   */
  async create(resource: any): Promise<any> {
    const resourceType = resource.resourceType;
    if (!resourceType) {
      throw new Error('Resource must have a resourceType');
    }

    const response = await this.client.post(`/${resourceType}`, resource);
    return response.data;
  }

  /**
   * Update a resource
   */
  async update(resource: any): Promise<any> {
    const resourceType = resource.resourceType;
    const id = resource.id;

    if (!resourceType || !id) {
      throw new Error('Resource must have resourceType and id');
    }

    const response = await this.client.put(`/${resourceType}/${id}`, resource);
    return response.data;
  }

  /**
   * Delete a resource
   */
  async delete(resourceType: string, id: string): Promise<void> {
    await this.client.delete(`/${resourceType}/${id}`);
  }

  /**
   * Get Patient resource
   */
  async getPatient(patientId: string): Promise<any> {
    return this.read('Patient', patientId);
  }

  /**
   * Get DocumentReference resources for a patient
   */
  async getDocumentReferences(patientId: string, params?: FHIRSearchParams): Promise<any[]> {
    return this.searchAll('DocumentReference', {
      patient: patientId,
      ...params,
    });
  }

  /**
   * Get Observation resources for a patient
   */
  async getObservations(patientId: string, params?: FHIRSearchParams): Promise<any[]> {
    return this.searchAll('Observation', {
      patient: patientId,
      ...params,
    });
  }

  /**
   * Get Condition resources for a patient
   */
  async getConditions(patientId: string, params?: FHIRSearchParams): Promise<any[]> {
    return this.searchAll('Condition', {
      patient: patientId,
      ...params,
    });
  }

  /**
   * Get MedicationRequest resources for a patient
   */
  async getMedicationRequests(patientId: string, params?: FHIRSearchParams): Promise<any[]> {
    return this.searchAll('MedicationRequest', {
      patient: patientId,
      ...params,
    });
  }

  /**
   * Get AllergyIntolerance resources for a patient
   */
  async getAllergyIntolerances(patientId: string, params?: FHIRSearchParams): Promise<any[]> {
    return this.searchAll('AllergyIntolerance', {
      patient: patientId,
      ...params,
    });
  }

  /**
   * Get Immunization resources for a patient
   */
  async getImmunizations(patientId: string, params?: FHIRSearchParams): Promise<any[]> {
    return this.searchAll('Immunization', {
      patient: patientId,
      ...params,
    });
  }

  /**
   * Get Procedure resources for a patient
   */
  async getProcedures(patientId: string, params?: FHIRSearchParams): Promise<any[]> {
    return this.searchAll('Procedure', {
      patient: patientId,
      ...params,
    });
  }

  /**
   * Download document content from DocumentReference
   */
  async downloadDocument(documentReference: any): Promise<Buffer> {
    // Get the first attachment with data or url
    const content = documentReference.content?.[0];
    if (!content) {
      throw new Error('DocumentReference has no content');
    }

    const attachment = content.attachment;
    if (!attachment) {
      throw new Error('DocumentReference content has no attachment');
    }

    // If data is embedded (Base64)
    if (attachment.data) {
      return Buffer.from(attachment.data, 'base64');
    }

    // If URL is provided
    if (attachment.url) {
      const response = await this.client.get(attachment.url, {
        responseType: 'arraybuffer',
      });
      return Buffer.from(response.data);
    }

    throw new Error('DocumentReference attachment has no data or url');
  }

  /**
   * Get capability statement (metadata)
   */
  async getCapabilityStatement(): Promise<any> {
    const response = await this.client.get('/metadata');
    return response.data;
  }

  /**
   * Build query parameters for search
   */
  private buildQueryParams(params?: FHIRSearchParams): Record<string, string> {
    if (!params) return {};

    const queryParams: Record<string, string> = {};

    for (const [key, value] of Object.entries(params)) {
      if (Array.isArray(value)) {
        queryParams[key] = value.join(',');
      } else {
        queryParams[key] = String(value);
      }
    }

    return queryParams;
  }

  /**
   * Make a raw request to the FHIR server
   */
  async request(config: AxiosRequestConfig): Promise<any> {
    const response = await this.client.request(config);
    return response.data;
  }
}

/**
 * FHIR Error class
 */
export class FHIRError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public operationOutcome?: any
  ) {
    super(message);
    this.name = 'FHIRError';
  }
}

/**
 * Helper function to extract patient ID from reference
 */
export function extractPatientId(reference: string): string | null {
  const match = reference.match(/Patient\/([^/]+)/);
  return match ? match[1] : null;
}

/**
 * Helper function to format FHIR date
 */
export function formatFHIRDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Helper function to parse FHIR date
 */
export function parseFHIRDate(dateString: string): Date {
  return new Date(dateString);
}