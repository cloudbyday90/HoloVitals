'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Document, DocumentType } from '@/lib/types/document-viewer';
import {
  FileText,
  Image,
  FileSpreadsheet,
  FileCode,
  Download,
  Share2,
  Star,
  MoreVertical,
  Eye,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DocumentCardProps {
  document: Document;
  onView?: (document: Document) => void;
  onDownload?: (document: Document) => void;
  onShare?: (document: Document) => void;
  onToggleFavorite?: (document: Document) => void;
  onDelete?: (document: Document) => void;
  selected?: boolean;
  onSelect?: (document: Document) => void;
}

export function DocumentCard({
  document,
  onView,
  onDownload,
  onShare,
  onToggleFavorite,
  onDelete,
  selected,
  onSelect,
}: DocumentCardProps) {
  const getDocumentIcon = (type: DocumentType) => {
    switch (type) {
      case DocumentType.IMAGING:
      case DocumentType.RADIOLOGY:
        return <Image className="h-8 w-8" />;
      case DocumentType.LAB_REPORT:
        return <FileSpreadsheet className="h-8 w-8" />;
      case DocumentType.CLINICAL_NOTE:
      case DocumentType.DISCHARGE_SUMMARY:
      case DocumentType.OPERATIVE_REPORT:
        return <FileText className="h-8 w-8" />;
      default:
        return <FileCode className="h-8 w-8" />;
    }
  };

  const getTypeColor = (type: DocumentType) => {
    switch (type) {
      case DocumentType.LAB_REPORT:
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case DocumentType.IMAGING:
      case DocumentType.RADIOLOGY:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case DocumentType.CLINICAL_NOTE:
        return 'bg-green-100 text-green-800 border-green-200';
      case DocumentType.DISCHARGE_SUMMARY:
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case DocumentType.PRESCRIPTION:
        return 'bg-teal-100 text-teal-800 border-teal-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (e.target instanceof HTMLElement && e.target.closest('button')) {
      return; // Don't trigger card click if clicking a button
    }
    if (onView) {
      onView(document);
    }
  };

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-lg ${
        selected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header with icon and actions */}
          <div className="flex items-start justify-between">
            <div className={`p-3 rounded-lg ${getTypeColor(document.type).split(' ')[0]}`}>
              {getDocumentIcon(document.type)}
            </div>
            <div className="flex items-center gap-1">
              {document.isFavorite && (
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onView?.(document)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDownload?.(document)}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onShare?.(document)}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onToggleFavorite?.(document)}>
                    <Star className="h-4 w-4 mr-2" />
                    {document.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete?.(document)}
                    className="text-red-600"
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Title and description */}
          <div>
            <h3 className="font-semibold text-sm line-clamp-2">{document.title}</h3>
            {document.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {document.description}
              </p>
            )}
          </div>

          {/* Type badge */}
          <Badge variant="outline" className={getTypeColor(document.type)}>
            {document.type.replace('_', ' ')}
          </Badge>

          {/* Metadata */}
          <div className="space-y-1 text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Date:</span>
              <span className="font-medium">{formatDate(document.date)}</span>
            </div>
            {document.provider && (
              <div className="flex items-center justify-between">
                <span>Provider:</span>
                <span className="font-medium">{document.provider}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span>Size:</span>
              <span className="font-medium">{formatFileSize(document.fileSize)}</span>
            </div>
            {document.metadata?.pageCount && (
              <div className="flex items-center justify-between">
                <span>Pages:</span>
                <span className="font-medium">{document.metadata.pageCount}</span>
              </div>
            )}
          </div>

          {/* Tags */}
          {document.tags && document.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {document.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {document.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{document.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Quick actions */}
          <div className="flex gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                onView?.(document);
              }}
            >
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDownload?.(document);
              }}
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onShare?.(document);
              }}
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}