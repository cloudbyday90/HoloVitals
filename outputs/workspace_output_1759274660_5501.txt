'use client';

import { useState } from 'react';
import { UploadZone } from '@/components/document/upload-zone';
import { DocumentCard } from '@/components/document/document-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, TrendingUp, AlertCircle, Clock } from 'lucide-react';

export default function DashboardPage() {
  const [documents, setDocuments] = useState([
    {
      id: '1',
      fileName: 'Bloodwork_Results_2024.pdf',
      documentType: 'bloodwork',
      documentDate: new Date('2024-01-15'),
      uploadDate: new Date('2024-01-16'),
      status: 'completed',
      hasAbnormalValues: true
    },
    {
      id: '2',
      fileName: 'MRI_Scan_Report.pdf',
      documentType: 'imaging',
      documentDate: new Date('2024-02-20'),
      uploadDate: new Date('2024-02-21'),
      status: 'completed',
      hasAbnormalValues: false
    },
    {
      id: '3',
      fileName: 'Post_Surgery_Care.pdf',
      documentType: 'aftercare',
      documentDate: new Date('2024-03-10'),
      uploadDate: new Date('2024-03-10'),
      status: 'processing',
      hasAbnormalValues: false
    }
  ]);

  const handleUpload = async (files: File[]) => {
    console.log('Uploading files:', files);
    // TODO: Implement actual upload logic
    alert(`Uploading ${files.length} file(s). This will be implemented with the API.`);
  };

  const handleView = (id: string) => {
    console.log('Viewing document:', id);
    // TODO: Navigate to document view
    alert(`Viewing document ${id}. This will be implemented.`);
  };

  const handleAnalyze = (id: string) => {
    console.log('Analyzing document:', id);
    // TODO: Navigate to analysis view
    window.location.href = `/dashboard/analyze/${id}`;
  };

  const stats = {
    totalDocuments: documents.length,
    recentUploads: documents.filter(d => {
      const daysSinceUpload = (Date.now() - d.uploadDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceUpload <= 7;
    }).length,
    abnormalResults: documents.filter(d => d.hasAbnormalValues).length,
    processing: documents.filter(d => d.status === 'processing').length
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">Medical Document Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Upload, analyze, and track your medical documents
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Documents
              </CardTitle>
              <FileText className="w-4 h-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDocuments}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Recent Uploads
              </CardTitle>
              <Clock className="w-4 h-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recentUploads}</div>
              <p className="text-xs text-gray-500">Last 7 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Abnormal Results
              </CardTitle>
              <AlertCircle className="w-4 h-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.abnormalResults}</div>
              <p className="text-xs text-gray-500">Requires attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Processing
              </CardTitle>
              <TrendingUp className="w-4 h-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.processing}</div>
              <p className="text-xs text-gray-500">In progress</p>
            </CardContent>
          </Card>
        </div>

        {/* Upload Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Upload New Documents</h2>
          <UploadZone onUpload={handleUpload} />
        </div>

        {/* Documents List */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Your Documents</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc) => (
              <DocumentCard
                key={doc.id}
                {...doc}
                onView={handleView}
                onAnalyze={handleAnalyze}
              />
            ))}
          </div>

          {documents.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No documents yet</h3>
                <p className="text-gray-600">
                  Upload your first medical document to get started
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}