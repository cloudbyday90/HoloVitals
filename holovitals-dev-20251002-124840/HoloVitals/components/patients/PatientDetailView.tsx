/**
 * Patient Detail View Component
 * 
 * Displays comprehensive patient information and sync history
 */

'use client';

import { useState, useEffect } from 'react';
import {
  User,
  Calendar,
  Hash,
  Phone,
  Mail,
  MapPin,
  Activity,
  FileText,
  Pill,
  TestTube,
  AlertTriangle,
  Clock,
  RefreshCw,
  Download,
  X,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Patient, PatientSyncHistory, SyncStatus } from '@/lib/types/patient';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface PatientDetailViewProps {
  patientId: string;
  onClose?: () => void;
  onSync?: (patientId: string) => void;
}

const syncStatusConfig: Record<SyncStatus, {
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}> = {
  NEVER_SYNCED: {
    icon: <AlertCircle className="h-4 w-4" />,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
  },
  SYNCING: {
    icon: <RefreshCw className="h-4 w-4 animate-spin" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  SYNCED: {
    icon: <CheckCircle2 className="h-4 w-4" />,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  FAILED: {
    icon: <XCircle className="h-4 w-4" />,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  PARTIAL: {
    icon: <AlertCircle className="h-4 w-4" />,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
  },
};

export function PatientDetailView({
  patientId,
  onClose,
  onSync,
}: PatientDetailViewProps) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [syncHistory, setSyncHistory] = useState<PatientSyncHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadPatientData();
  }, [patientId]);

  const loadPatientData = async () => {
    try {
      setIsLoading(true);
      
      // Load patient details
      const customerResponse = await fetch(`/api/ehr/patients/${patientId}`);
      if (customerResponse.ok) {
        const patientData = await customerResponse.json();
        setPatient(patientData.data);
      }

      // Load sync history
      const historyResponse = await fetch(`/api/ehr/patients/${patientId}/sync`);
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setSyncHistory(historyData.data || []);
      }
    } catch (error) {
      console.error('Failed to load patient data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    if (onSync && !isSyncing) {
      setIsSyncing(true);
      try {
        await onSync(patientId);
        await loadPatientData(); // Reload data after sync
      } finally {
        setIsSyncing(false);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Patient not found</h3>
        <p className="text-muted-foreground">
          Unable to load patient details
        </p>
      </div>
    );
  }

  const syncStatus = patient.syncStatus || 'NEVER_SYNCED';
  const statusConfig = syncStatusConfig[syncStatus];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">
              {patient.lastName}, {patient.firstName}
              {patient.middleName && ` ${patient.middleName}`}
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline">
                {patient.gender}
              </Badge>
              <Badge variant="outline">
                {getAge(patient.dateOfBirth)} years old
              </Badge>
              {patient.provider && (
                <Badge variant="secondary">
                  {patient.provider}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleSync}
            disabled={isSyncing || syncStatus === 'SYNCING'}
          >
            {isSyncing || syncStatus === 'SYNCING' ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync Now
              </>
            )}
          </Button>
          {onClose && (
            <Button variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Sync Status Banner */}
      <Card className={cn('border-l-4', statusConfig.bgColor)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={statusConfig.color}>
                {statusConfig.icon}
              </div>
              <div>
                <p className="font-medium">
                  Sync Status: {syncStatus.replace('_', ' ')}
                </p>
                {patient.lastSyncedAt && (
                  <p className="text-sm text-muted-foreground">
                    Last synced: {formatDateTime(patient.lastSyncedAt)}
                  </p>
                )}
              </div>
            </div>
            {syncHistory.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab('history')}
              >
                View History
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="encounters">Encounters</TabsTrigger>
          <TabsTrigger value="medications">Medications</TabsTrigger>
          <TabsTrigger value="labs">Lab Results</TabsTrigger>
          <TabsTrigger value="history">Sync History</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Demographics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Demographics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Date of Birth</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(patient.dateOfBirth)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Hash className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Medical Record Number</p>
                    <p className="text-sm text-muted-foreground">{patient.mrn}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Hash className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">EHR ID</p>
                    <p className="text-sm text-muted-foreground">{patient.ehrId}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {patient.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Phone</p>
                      <p className="text-sm text-muted-foreground">{patient.phone}</p>
                    </div>
                  </div>
                )}
                {patient.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">{patient.email}</p>
                    </div>
                  </div>
                )}
                {patient.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Address</p>
                      <p className="text-sm text-muted-foreground">
                        {patient.address.street && <>{patient.address.street}<br /></>}
                        {[
                          patient.address.city,
                          patient.address.state,
                          patient.address.zipCode,
                        ]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Encounters Tab */}
        <TabsContent value="encounters">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Encounters
              </CardTitle>
              <CardDescription>
                Clinical encounters and visits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center py-8">
                Encounter data will be displayed here after syncing
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Medications Tab */}
        <TabsContent value="medications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5" />
                Medications
              </CardTitle>
              <CardDescription>
                Current and past medications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center py-8">
                Medication data will be displayed here after syncing
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lab Results Tab */}
        <TabsContent value="labs">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Lab Results
              </CardTitle>
              <CardDescription>
                Laboratory test results and reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center py-8">
                Lab results will be displayed here after syncing
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sync History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Sync History
              </CardTitle>
              <CardDescription>
                Complete history of data synchronization
              </CardDescription>
            </CardHeader>
            <CardContent>
              {syncHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No sync history available
                </p>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {syncHistory.map((sync, index) => (
                      <div key={sync.id}>
                        <div className="flex items-start gap-4">
                          <div className={cn(
                            'mt-1',
                            syncStatusConfig[sync.status].color
                          )}>
                            {syncStatusConfig[sync.status].icon}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-medium">
                                {sync.status.replace('_', ' ')}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {formatDateTime(sync.syncedAt)}
                              </p>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {sync.recordsSynced} records synced
                              {sync.duration && ` in ${sync.duration}s`}
                            </p>
                            {sync.errors && sync.errors.length > 0 && (
                              <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-600">
                                {sync.errors.join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                        {index < syncHistory.length - 1 && (
                          <Separator className="my-4" />
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}