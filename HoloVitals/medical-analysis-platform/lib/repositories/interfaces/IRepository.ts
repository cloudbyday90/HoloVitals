/**
 * Base Repository Interface
 * All repositories in HoloVitals must implement this interface
 */

export interface IRepository<T> {
  /**
   * Repository identifier
   */
  readonly name: string;
  
  /**
   * Repository version for tracking changes
   */
  readonly version: string;
  
  /**
   * Initialize the repository
   */
  initialize(): Promise<void>;
  
  /**
   * Store data in the repository
   */
  store(key: string, data: T): Promise<void>;
  
  /**
   * Retrieve data from the repository
   */
  retrieve(key: string): Promise<T | null>;
  
  /**
   * Update existing data
   */
  update(key: string, data: Partial<T>): Promise<void>;
  
  /**
   * Delete data from the repository
   */
  delete(key: string): Promise<void>;
  
  /**
   * Check if data exists
   */
  exists(key: string): Promise<boolean>;
  
  /**
   * Clear all data (use with caution)
   */
  clear(): Promise<void>;
  
  /**
   * Get repository health status
   */
  getHealth(): Promise<RepositoryHealth>;
}

export interface RepositoryHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: Date;
  metrics: {
    itemCount: number;
    storageUsed: number;
    averageResponseTime: number;
  };
  issues?: string[];
}

export interface RepositoryMetadata {
  createdAt: Date;
  updatedAt: Date;
  version: number;
  tags?: string[];
}