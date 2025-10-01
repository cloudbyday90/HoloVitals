'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { ChatInterface } from '@/components/analysis/chat-interface';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Calendar, Tag } from 'lucide-react';
import Link from 'next/link';

export default function AnalyzePage() {
  const params = useParams();
  const documentId = params.id as string;

  // Mock document data - in production, this would be fetched from API
  const document = {
    id: documentId,
    fileName: 'Bloodwork_Results_2024.pdf',
    documentType: 'bloodwork',
    documentDate: new Date('2024-01-15'),
    status: 'completed',
    extractedData: [
      { name: 'Hemoglobin', value: '14.5', unit: 'g/dL', range: '13.5-17.5', isAbnormal: false },
      { name: 'WBC', value: '12.5', unit: 'K/uL', range: '4.5-11.0', isAbnormal: true },
      { name: 'Platelets', value: '250', unit: 'K/uL', range: '150-400', isAbnormal: false },
      { name: 'Glucose', value: '105', unit: 'mg/dL', range: '70-100', isAbnormal: true },
    ]
  };

  const handleSendMessage = async (message: string): Promise<string> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock response based on message content
    if (message.toLowerCase().includes('abnormal')) {
      return `Based on the analysis of ${document.fileName}, I found 2 abnormal values:

1. **WBC (White Blood Cell Count)**: 12.5 K/uL
   - Reference range: 4.5-11.0 K/uL
   - Status: Elevated
   - This could indicate an infection or inflammatory response. It's recommended to discuss this with your healthcare provider.

2. **Glucose**: 105 mg/dL
   - Reference range: 70-100 mg/dL
   - Status: Slightly elevated
   - This is just above the normal range. Consider discussing fasting glucose levels and potential pre-diabetes screening with your doctor.

**Important Note**: These findings should be discussed with your healthcare provider for proper medical interpretation and follow-up.`;
    }
    
    if (message.toLowerCase().includes('trend') || message.toLowerCase().includes('compare')) {
      return `To provide a comprehensive trend analysis, I would need access to your previous bloodwork results. 

Based on the current document (${document.documentDate.toLocaleDateString()}), here's what I can tell you:

- Your hemoglobin levels are within normal range
- WBC count is elevated, which may warrant monitoring
- Platelet count is healthy
- Glucose is slightly elevated

If you upload previous test results, I can:
- Track changes over time
- Identify improving or worsening trends
- Highlight significant variations
- Provide context for current values

Would you like to upload previous results for comparison?`;
    }
    
    return `I've analyzed ${document.fileName} from ${document.documentDate.toLocaleDateString()}. 

This document contains ${document.extractedData.length} test results. Here's a summary:

${document.extractedData.map(item => 
  `- ${item.name}: ${item.value} ${item.unit} (Range: ${item.range}) ${item.isAbnormal ? '⚠️ ABNORMAL' : '✓ Normal'}`
).join('\n')}

You can ask me specific questions about:
- Individual test results
- Abnormal values and their implications
- Comparisons with previous tests
- General health insights

What would you like to know more about?`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <Link href="/dashboard">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Document Analysis</h1>
          <p className="text-gray-800 mt-2">
            AI-powered analysis and insights
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Document Info Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Document Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-gray-800 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-800">File Name</p>
                    <p className="font-medium">{document.fileName}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Tag className="w-5 h-5 text-gray-800 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-800">Document Type</p>
                    <p className="font-medium capitalize">{document.documentType}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-800 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-800">Document Date</p>
                    <p className="font-medium">{document.documentDate.toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Extracted Data</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {document.extractedData.map((item, index) => (
                    <div key={index} className="border-b pb-3 last:border-b-0">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium">{item.name}</span>
                        {item.isAbnormal &amp;&amp; (
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">
                            Abnormal
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-800">
                        {item.value} {item.unit}
                      </p>
                      <p className="text-xs text-gray-700">
                        Range: {item.range}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <ChatInterface
              documentId={documentId}
              onSendMessage={handleSendMessage}
            />
          </div>
        </div>
      </div>
    </div>
  );
}