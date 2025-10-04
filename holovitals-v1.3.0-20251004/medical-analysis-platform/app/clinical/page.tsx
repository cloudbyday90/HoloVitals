'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TestTube,
  Pill,
  AlertCircle,
  Activity,
  FileText,
  Calendar,
  TrendingUp,
  Download,
  Eye
} from 'lucide-react';
import Link from 'next/link';

export default function ClinicalDataPage() {
  // Mock data - will be replaced with real API calls
  const labResults = [
    { id: 1, test: 'Complete Blood Count', date: '2024-09-15', status: 'Normal', flag: 'none' },
    { id: 2, test: 'Lipid Panel', date: '2024-09-15', status: 'Borderline', flag: 'warning' },
    { id: 3, test: 'Glucose', date: '2024-09-10', status: 'Normal', flag: 'none' },
    { id: 4, test: 'Thyroid Panel', date: '2024-08-20', status: 'Normal', flag: 'none' },
  ];

  const medications = [
    { id: 1, name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily', prescriber: 'Dr. Smith', status: 'Active' },
    { id: 2, name: 'Metformin', dosage: '500mg', frequency: 'Twice daily', prescriber: 'Dr. Johnson', status: 'Active' },
    { id: 3, name: 'Atorvastatin', dosage: '20mg', frequency: 'Once daily', prescriber: 'Dr. Smith', status: 'Active' },
  ];

  const allergies = [
    { id: 1, allergen: 'Penicillin', reaction: 'Rash', severity: 'Moderate', onset: '2015' },
    { id: 2, allergen: 'Shellfish', reaction: 'Anaphylaxis', severity: 'Severe', onset: '2010' },
  ];

  const conditions = [
    { id: 1, condition: 'Type 2 Diabetes', status: 'Active', diagnosed: '2020-03-15', icd10: 'E11.9' },
    { id: 2, condition: 'Hypertension', status: 'Active', diagnosed: '2019-06-20', icd10: 'I10' },
    { id: 3, condition: 'Hyperlipidemia', status: 'Active', diagnosed: '2021-01-10', icd10: 'E78.5' },
  ];

  const vitalSigns = [
    { id: 1, type: 'Blood Pressure', value: '125/82 mmHg', date: '2024-09-20', status: 'normal' },
    { id: 2, type: 'Heart Rate', value: '72 bpm', date: '2024-09-20', status: 'normal' },
    { id: 3, type: 'Temperature', value: '98.6°F', date: '2024-09-20', status: 'normal' },
    { id: 4, type: 'Weight', value: '165 lbs', date: '2024-09-20', status: 'normal' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2 text-gray-900">My Health Data</h1>
        <p className="text-gray-700">View and manage your medical records and health information</p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Lab Results</CardTitle>
            <TestTube className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{labResults.length}</div>
            <p className="text-xs text-gray-600 mt-1">Total tests</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Medications</CardTitle>
            <Pill className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{medications.length}</div>
            <p className="text-xs text-gray-600 mt-1">Active prescriptions</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Allergies</CardTitle>
            <AlertCircle className="w-4 h-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{allergies.length}</div>
            <p className="text-xs text-gray-600 mt-1">Known allergies</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Conditions</CardTitle>
            <Activity className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{conditions.length}</div>
            <p className="text-xs text-gray-600 mt-1">Active conditions</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Lab Results */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-gray-900">Recent Lab Results</CardTitle>
              <CardDescription className="text-gray-600">Your latest test results</CardDescription>
            </div>
            <Link href="/clinical/labs">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {labResults.map((lab) => (
              <div key={lab.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <TestTube className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">{lab.test}</p>
                    <p className="text-sm text-gray-600">{lab.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'text-sm px-2 py-1 rounded-full',
                    lab.flag === 'warning' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                  )}>
                    {lab.status}
                  </span>
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Medications */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-gray-900">Current Medications</CardTitle>
              <CardDescription className="text-gray-600">Your active prescriptions</CardDescription>
            </div>
            <Link href="/clinical/medications">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {medications.map((med) => (
              <div key={med.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <Pill className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">{med.name} {med.dosage}</p>
                    <p className="text-sm text-gray-600">{med.frequency} • Prescribed by {med.prescriber}</p>
                  </div>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                  {med.status}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Allergies & Conditions */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Allergies */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Allergies</CardTitle>
            <CardDescription className="text-gray-600">Known allergies and reactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {allergies.map((allergy) => (
                <div key={allergy.id} className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{allergy.allergen}</p>
                      <p className="text-sm text-gray-600">Reaction: {allergy.reaction}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={cn(
                          'text-xs px-2 py-0.5 rounded-full',
                          allergy.severity === 'Severe' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                        )}>
                          {allergy.severity}
                        </span>
                        <span className="text-xs text-gray-500">Since {allergy.onset}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Conditions */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Active Conditions</CardTitle>
            <CardDescription className="text-gray-600">Current diagnoses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {conditions.map((condition) => (
                <div key={condition.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{condition.condition}</p>
                      <p className="text-sm text-gray-600">Diagnosed: {condition.diagnosed}</p>
                      <p className="text-xs text-gray-500 mt-1">ICD-10: {condition.icd10}</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                      {condition.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Vital Signs */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900">Recent Vital Signs</CardTitle>
          <CardDescription className="text-gray-600">Latest measurements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {vitalSigns.map((vital) => (
              <div key={vital.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600">{vital.type}</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{vital.value}</p>
                <p className="text-xs text-gray-500 mt-1">{vital.date}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Export Data */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Export Your Health Data</h3>
              <p className="text-sm text-gray-700">Download a complete copy of your medical records</p>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}