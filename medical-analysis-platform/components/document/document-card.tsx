'use client';

import { FileText, Calendar, Tag, TrendingUp, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface DocumentCardProps {
  id: string;
  fileName: string;
  documentType?: string;
  documentDate?: Date;
  uploadDate: Date;
  status: string;
  hasAbnormalValues?: boolean;
  onView: (id: string) => void;
  onAnalyze: (id: string) => void;
}

export function DocumentCard({
  id,
  fileName,
  documentType,
  documentDate,
  uploadDate,
  status,
  hasAbnormalValues,
  onView,
  onAnalyze
}: DocumentCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDocumentTypeColor = (type?: string) => {
    switch (type) {
      case 'bloodwork':
        return 'bg-blue-100 text-blue-800';
      case 'imaging':
        return 'bg-purple-100 text-purple-800';
      case 'aftercare':
        return 'bg-green-100 text-green-800';
      case 'prescription':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg truncate">{fileName}</CardTitle>
              <div className="flex flex-wrap gap-2 mt-2">
                {documentType && (
                  <span className={`text-xs px-2 py-1 rounded-full ${getDocumentTypeColor(documentType)}`}>
                    {documentType}
                  </span>
                )}
                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(status)}`}>
                  {status}
                </span>
                {hasAbnormalValues && (
                  <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Abnormal Values
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-800">
            <Calendar className="w-4 h-4" />
            <span>
              {documentDate 
                ? `Document Date: ${documentDate.toLocaleDateString()}`
                : `Uploaded: ${uploadDate.toLocaleDateString()}`
              }
            </span>
          </div>

          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onView(id)}
              className="flex-1"
            >
              <FileText className="w-4 h-4 mr-2" />
              View
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => onAnalyze(id)}
              className="flex-1"
              disabled={status !== 'completed'}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Analyze
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}