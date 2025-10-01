'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Copy, Check, Trash2, Edit, Users, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate } from '@/lib/utils';

interface BetaCode {
  id: string;
  code: string;
  maxUses: number;
  usedCount: number;
  expiresAt: Date | null;
  createdAt: Date;
  tokenLimit: number;
  storageLimit: number;
  isActive: boolean;
}

interface BetaStats {
  totalCodes: number;
  activeCodes: number;
  totalUses: number;
  totalBetaTesters: number;
  averageTokenUsage: number;
}

export function BetaCodeManagement() {
  const [codes, setCodes] = useState<BetaCode[]>([]);
  const [stats, setStats] = useState<BetaStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Create dialog state
  const [createCount, setCreateCount] = useState(1);
  const [createMaxUses, setCreateMaxUses] = useState(1);
  const [createTokenLimit, setCreateTokenLimit] = useState(3000000);
  const [createStorageLimit, setCreateStorageLimit] = useState(500);
  const [createExpires, setCreateExpires] = useState('');
  const [createCustomCode, setCreateCustomCode] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [codesRes, statsRes] = await Promise.all([
        fetch('/api/beta/codes'),
        fetch('/api/beta/stats'),
      ]);

      if (codesRes.ok) {
        const codesData = await codesRes.json();
        setCodes(codesData.codes || []);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCodes = async () => {
    try {
      setCreating(true);
      const response = await fetch('/api/beta/codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          count: createCount,
          maxUses: createMaxUses,
          tokenLimit: createTokenLimit,
          storageLimit: createStorageLimit,
          expiresAt: createExpires || undefined,
          customCode: createCustomCode || undefined,
        }),
      });

      if (response.ok) {
        setShowCreateDialog(false);
        resetCreateForm();
        loadData();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create codes');
      }
    } catch (error) {
      console.error('Error creating codes:', error);
      alert('An error occurred');
    } finally {
      setCreating(false);
    }
  };

  const resetCreateForm = () => {
    setCreateCount(1);
    setCreateMaxUses(1);
    setCreateTokenLimit(3000000);
    setCreateStorageLimit(500);
    setCreateExpires('');
    setCreateCustomCode('');
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/beta/codes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (response.ok) {
        loadData();
      }
    } catch (error) {
      console.error('Error toggling code:', error);
    }
  };

  const handleDeleteCode = async (id: string) => {
    if (!confirm('Are you sure you want to delete this code?')) {
      return;
    }

    try {
      const response = await fetch(`/api/beta/codes/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadData();
      }
    } catch (error) {
      console.error('Error deleting code:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Codes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCodes}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Active Codes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.activeCodes}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Uses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUses}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Beta Testers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.totalBetaTesters}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Avg Token Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {(stats.averageTokenUsage / 1000).toFixed(0)}K
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Beta Codes</h2>
          <p className="text-sm text-muted-foreground">
            Manage and track beta testing codes
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Codes
        </Button>
      </div>

      {/* Codes Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">Loading codes...</p>
              </div>
            </div>
          ) : codes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Beta Codes</h3>
              <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
                Create your first beta code to start inviting testers
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Code
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Limits</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {codes.map((code) => (
                  <TableRow key={code.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-sm bg-muted px-2 py-1 rounded">
                          {code.code}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyCode(code.code)}
                        >
                          {copiedCode === code.code ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {code.usedCount} / {code.maxUses}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs space-y-1">
                        <div>{(code.tokenLimit / 1000000).toFixed(1)}M tokens</div>
                        <div>{code.storageLimit} MB storage</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {code.expiresAt ? (
                        <div className="text-sm">{formatDate(code.expiresAt)}</div>
                      ) : (
                        <div className="text-sm text-muted-foreground">Never</div>
                      )}
                    </TableCell>
                    <TableCell>
                      {code.isActive ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{formatDate(code.createdAt)}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(code.id, code.isActive)}
                        >
                          {code.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCode(code.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Beta Codes</DialogTitle>
            <DialogDescription>
              Generate new beta codes for testing invitations
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="count">Number of Codes</Label>
                <Input
                  id="count"
                  type="number"
                  min="1"
                  max="100"
                  value={createCount}
                  onChange={(e) => setCreateCount(parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxUses">Max Uses per Code</Label>
                <Input
                  id="maxUses"
                  type="number"
                  min="1"
                  value={createMaxUses}
                  onChange={(e) => setCreateMaxUses(parseInt(e.target.value) || 1)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tokenLimit">Token Limit</Label>
                <Input
                  id="tokenLimit"
                  type="number"
                  min="0"
                  value={createTokenLimit}
                  onChange={(e) => setCreateTokenLimit(parseInt(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">
                  Default: 3,000,000 tokens
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="storageLimit">Storage Limit (MB)</Label>
                <Input
                  id="storageLimit"
                  type="number"
                  min="0"
                  value={createStorageLimit}
                  onChange={(e) => setCreateStorageLimit(parseInt(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">
                  Default: 500 MB
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expires">Expiration Date (Optional)</Label>
              <Input
                id="expires"
                type="date"
                value={createExpires}
                onChange={(e) => setCreateExpires(e.target.value)}
              />
            </div>

            {createCount === 1 && (
              <div className="space-y-2">
                <Label htmlFor="customCode">Custom Code (Optional)</Label>
                <Input
                  id="customCode"
                  placeholder="HOLO-CUSTOM01"
                  value={createCustomCode}
                  onChange={(e) => setCreateCustomCode(e.target.value.toUpperCase())}
                  maxLength={13}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to auto-generate. Format: HOLO-XXXXXXXX
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCodes} disabled={creating}>
              {creating ? 'Creating...' : `Create ${createCount} Code${createCount > 1 ? 's' : ''}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}