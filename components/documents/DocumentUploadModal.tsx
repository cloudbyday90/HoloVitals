'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DocumentType } from '@/lib/types/document-viewer';
import { Upload, X, FileText, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface DocumentUploadModalProps {
  open: boolean;
  onClose: () => void;
  onUploadComplete?: () => void;
}

export function DocumentUploadModal({
  open,
  onClose,
  onUploadComplete,
}: DocumentUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<DocumentType>(DocumentType.OTHER);
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [provider, setProvider] = useState('');
  const [tags, setTags] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file size (max 25MB)
      if (selectedFile.size > 25 * 1024 * 1024) {
        setError('File size must be less than 25MB');
        return;
      }
      
      setFile(selectedFile);
      setError('');
      
      // Auto-fill title if empty
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setError('');
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    if (!title) {
      setError('Please enter a title');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      setError('');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('type', type);
      formData.append('category', category || type);
      formData.append('date', date);
      formData.append('provider', provider);
      formData.append('tags', tags);

      // Simulate progress (in real implementation, use XMLHttpRequest for progress tracking)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }

      // Success
      setTimeout(() => {
        onUploadComplete?.();
        handleClose();
      }, 500);
    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setFile(null);
      setTitle('');
      setDescription('');
      setType(DocumentType.OTHER);
      setCategory('');
      setDate(new Date().toISOString().split('T')[0]);
      setProvider('');
      setTags('');
      setUploadProgress(0);
      setError('');
      onClose();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Upload a medical document to your health records
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File Upload */}
          <div className="space-y-2">
            <Label>File</Label>
            {!file ? (
              <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  disabled={uploading}
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm font-medium mb-1">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PDF, JPG, PNG, DOC (max 25MB)
                  </p>
                </label>
              </div>
            ) : (
              <div className="border rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                {!uploading && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter document title"
              disabled={uploading}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter document description"
              rows={3}
              disabled={uploading}
            />
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Document Type</Label>
            <Select value={type} onValueChange={(value) => setType(value as DocumentType)} disabled={uploading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={DocumentType.LAB_REPORT}>Lab Report</SelectItem>
                <SelectItem value={DocumentType.IMAGING}>Imaging</SelectItem>
                <SelectItem value={DocumentType.CLINICAL_NOTE}>Clinical Note</SelectItem>
                <SelectItem value={DocumentType.DISCHARGE_SUMMARY}>Discharge Summary</SelectItem>
                <SelectItem value={DocumentType.OPERATIVE_REPORT}>Operative Report</SelectItem>
                <SelectItem value={DocumentType.PATHOLOGY}>Pathology</SelectItem>
                <SelectItem value={DocumentType.RADIOLOGY}>Radiology</SelectItem>
                <SelectItem value={DocumentType.PRESCRIPTION}>Prescription</SelectItem>
                <SelectItem value={DocumentType.REFERRAL}>Referral</SelectItem>
                <SelectItem value={DocumentType.CONSENT_FORM}>Consent Form</SelectItem>
                <SelectItem value={DocumentType.INSURANCE}>Insurance</SelectItem>
                <SelectItem value={DocumentType.BILLING}>Billing</SelectItem>
                <SelectItem value={DocumentType.OTHER}>Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Document Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={uploading}
            />
          </div>

          {/* Provider */}
          <div className="space-y-2">
            <Label htmlFor="provider">Provider</Label>
            <Input
              id="provider"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              placeholder="Enter provider name"
              disabled={uploading}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Enter tags separated by commas"
              disabled={uploading}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={uploading}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={!file || !title || uploading}>
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}