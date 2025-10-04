'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  ZoomIn,
  ZoomOut,
  Download,
  Print,
  Share2,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
} from 'lucide-react';

interface PDFViewerProps {
  url: string;
  title: string;
  onClose?: () => void;
  onDownload?: () => void;
  onShare?: () => void;
}

export function PDFViewer({ url, title, onClose, onDownload, onShare }: PDFViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 50));
  };

  const handlePrint = () => {
    const iframe = document.getElementById('pdf-iframe') as HTMLIFrameElement;
    if (iframe?.contentWindow) {
      iframe.contentWindow.print();
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.getElementById('pdf-viewer-container')?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div
      id="pdf-viewer-container"
      className="fixed inset-0 z-50 bg-background"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-background p-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[60px] text-center">
            {zoom}%
          </span>
          <Button variant="outline" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>

          <div className="h-6 w-px bg-border mx-2" />

          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Print className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" size="sm" onClick={onDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button variant="outline" size="sm" onClick={onShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>

          <div className="h-6 w-px bg-border mx-2" />

          <Button variant="outline" size="sm" onClick={toggleFullscreen}>
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* PDF Content */}
      <div className="h-[calc(100vh-73px)] overflow-auto bg-gray-100 p-4">
        <div className="mx-auto" style={{ width: `${zoom}%` }}>
          <Card className="overflow-hidden">
            <iframe
              id="pdf-iframe"
              src={url}
              className="w-full h-[calc(100vh-120px)] border-0"
              title={title}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}