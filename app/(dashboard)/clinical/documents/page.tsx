'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DocumentCard } from '@/components/documents/DocumentCard';
import { PDFViewer } from '@/components/documents/PDFViewer';
import { ImageViewer } from '@/components/documents/ImageViewer';
import { Document, DocumentType, DocumentFilter, DocumentSort, DocumentSortField, SortDirection } from '@/lib/types/document-viewer';
import { Search, Upload, Grid3x3, List, SlidersHorizontal, Download, Star } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type ViewMode = 'grid' | 'list';

export default function DocumentsPage() {
  const { data: session } = useSession();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortField, setSortField] = useState<DocumentSortField>(DocumentSortField.DATE);
  const [sortDirection, setSortDirection] = useState<SortDirection>(SortDirection.DESC);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [viewerType, setViewerType] = useState<'pdf' | 'image' | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, [typeFilter, dateRange, sortField, sortDirection]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (typeFilter !== 'all') {
        params.append('type', typeFilter);
      }
      if (dateRange !== 'all') {
        const endDate = new Date();
        const startDate = new Date();
        
        switch (dateRange) {
          case '30days':
            startDate.setDate(startDate.getDate() - 30);
            break;
          case '90days':
            startDate.setDate(startDate.getDate() - 90);
            break;
          case '1year':
            startDate.setFullYear(startDate.getFullYear() - 1);
            break;
        }
        
        params.append('startDate', startDate.toISOString());
        params.append('endDate', endDate.toISOString());
      }

      const response = await fetch(`/api/clinical/documents?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      doc.title.toLowerCase().includes(query) ||
      doc.description?.toLowerCase().includes(query) ||
      doc.provider?.toLowerCase().includes(query) ||
      doc.category.toLowerCase().includes(query)
    );
  });

  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    let comparison = 0;
    
    switch (sortField) {
      case DocumentSortField.DATE:
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        break;
      case DocumentSortField.TITLE:
        comparison = a.title.localeCompare(b.title);
        break;
      case DocumentSortField.TYPE:
        comparison = a.type.localeCompare(b.type);
        break;
      case DocumentSortField.SIZE:
        comparison = a.fileSize - b.fileSize;
        break;
      case DocumentSortField.PROVIDER:
        comparison = (a.provider || '').localeCompare(b.provider || '');
        break;
    }
    
    return sortDirection === SortDirection.ASC ? comparison : -comparison;
  });

  const favoriteDocuments = sortedDocuments.filter(doc => doc.isFavorite);
  const recentDocuments = sortedDocuments.filter(doc => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return new Date(doc.date) >= thirtyDaysAgo;
  });

  const handleViewDocument = (document: Document) => {
    setSelectedDocument(document);
    
    // Determine viewer type based on content type
    if (document.contentType === 'application/pdf') {
      setViewerType('pdf');
    } else if (document.contentType.startsWith('image/')) {
      setViewerType('image');
    } else {
      // For other types, trigger download
      handleDownloadDocument(document);
    }
  };

  const handleDownloadDocument = (document: Document) => {
    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = document.url;
    link.download = document.title;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShareDocument = (document: Document) => {
    // TODO: Implement share functionality
    console.log('Share document:', document.id);
  };

  const handleToggleFavorite = (document: Document) => {
    // TODO: Implement favorite toggle
    console.log('Toggle favorite:', document.id);
  };

  const handleDeleteDocument = (document: Document) => {
    // TODO: Implement delete functionality
    console.log('Delete document:', document.id);
  };

  const handleCloseViewer = () => {
    setSelectedDocument(null);
    setViewerType(null);
  };

  return (
    <>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Documents</h1>
            <p className="text-muted-foreground mt-2">
              View and manage your medical documents
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export All
            </Button>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Type Filter */}
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value={DocumentType.LAB_REPORT}>Lab Reports</SelectItem>
                  <SelectItem value={DocumentType.IMAGING}>Imaging</SelectItem>
                  <SelectItem value={DocumentType.CLINICAL_NOTE}>Clinical Notes</SelectItem>
                  <SelectItem value={DocumentType.DISCHARGE_SUMMARY}>Discharge Summaries</SelectItem>
                  <SelectItem value={DocumentType.PRESCRIPTION}>Prescriptions</SelectItem>
                </SelectContent>
              </Select>

              {/* Date Range Filter */}
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="30days">Last 30 Days</SelectItem>
                  <SelectItem value="90days">Last 90 Days</SelectItem>
                  <SelectItem value="1year">Last Year</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortField} onValueChange={(value) => setSortField(value as DocumentSortField)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={DocumentSortField.DATE}>Date</SelectItem>
                  <SelectItem value={DocumentSortField.TITLE}>Title</SelectItem>
                  <SelectItem value={DocumentSortField.TYPE}>Type</SelectItem>
                  <SelectItem value={DocumentSortField.SIZE}>Size</SelectItem>
                </SelectContent>
              </Select>

              {/* View Mode */}
              <div className="flex gap-1 border rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">
              All Documents ({sortedDocuments.length})
            </TabsTrigger>
            <TabsTrigger value="recent">
              Recent ({recentDocuments.length})
            </TabsTrigger>
            <TabsTrigger value="favorites">
              <Star className="h-4 w-4 mr-2" />
              Favorites ({favoriteDocuments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {loading ? (
              <div className={viewMode === 'grid' ? 'grid gap-4 md:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}>
                {[...Array(6)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="space-y-2">
                        <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                        <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : sortedDocuments.length > 0 ? (
              <div className={viewMode === 'grid' ? 'grid gap-4 md:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}>
                {sortedDocuments.map((document) => (
                  <DocumentCard
                    key={document.id}
                    document={document}
                    onView={handleViewDocument}
                    onDownload={handleDownloadDocument}
                    onShare={handleShareDocument}
                    onToggleFavorite={handleToggleFavorite}
                    onDelete={handleDeleteDocument}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <h3 className="text-lg font-semibold mb-2">No documents found</h3>
                  <p className="text-sm text-muted-foreground text-center max-w-md">
                    {searchQuery
                      ? 'Try adjusting your search or filters'
                      : 'Upload documents or connect your EHR to sync your medical records.'}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="recent" className="space-y-4">
            {recentDocuments.length > 0 ? (
              <div className={viewMode === 'grid' ? 'grid gap-4 md:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}>
                {recentDocuments.map((document) => (
                  <DocumentCard
                    key={document.id}
                    document={document}
                    onView={handleViewDocument}
                    onDownload={handleDownloadDocument}
                    onShare={handleShareDocument}
                    onToggleFavorite={handleToggleFavorite}
                    onDelete={handleDeleteDocument}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <h3 className="text-lg font-semibold mb-2">No recent documents</h3>
                  <p className="text-sm text-muted-foreground text-center max-w-md">
                    Documents from the last 30 days will appear here.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="favorites" className="space-y-4">
            {favoriteDocuments.length > 0 ? (
              <div className={viewMode === 'grid' ? 'grid gap-4 md:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}>
                {favoriteDocuments.map((document) => (
                  <DocumentCard
                    key={document.id}
                    document={document}
                    onView={handleViewDocument}
                    onDownload={handleDownloadDocument}
                    onShare={handleShareDocument}
                    onToggleFavorite={handleToggleFavorite}
                    onDelete={handleDeleteDocument}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Star className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No favorite documents</h3>
                  <p className="text-sm text-muted-foreground text-center max-w-md">
                    Star documents to add them to your favorites for quick access.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Document Viewers */}
      {selectedDocument && viewerType === 'pdf' && (
        <PDFViewer
          url={selectedDocument.url}
          title={selectedDocument.title}
          onClose={handleCloseViewer}
          onDownload={() => handleDownloadDocument(selectedDocument)}
          onShare={() => handleShareDocument(selectedDocument)}
        />
      )}

      {selectedDocument && viewerType === 'image' && (
        <ImageViewer
          url={selectedDocument.url}
          title={selectedDocument.title}
          onClose={handleCloseViewer}
          onDownload={() => handleDownloadDocument(selectedDocument)}
          onShare={() => handleShareDocument(selectedDocument)}
        />
      )}
    </>
  );
}