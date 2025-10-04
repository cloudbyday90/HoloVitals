'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Server,
  Plus,
  Trash2,
  DollarSign,
  Clock,
  Cpu,
  HardDrive,
  Zap,
  MapPin,
  Activity,
  CheckCircle2,
  Loader2,
  XCircle
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface Instance {
  id: string;
  provider: 'AZURE' | 'AWS';
  instanceType: string;
  region: string;
  status: 'PROVISIONING' | 'CONFIGURING' | 'READY' | 'RUNNING' | 'STOPPING' | 'TERMINATED';
  publicIp?: string;
  privateIp?: string;
  costPerHour: number;
  totalCost: number;
  createdAt: Date;
  terminatedAt?: Date;
  purpose: string;
  autoTerminateMinutes: number;
}

export default function InstancesPage() {
  const [instances, setInstances] = useState<Instance[]>([
    {
      id: '1',
      provider: 'AZURE',
      instanceType: 'Standard_NC6',
      region: 'eastus',
      status: 'RUNNING',
      publicIp: '20.123.45.67',
      privateIp: '10.0.1.5',
      costPerHour: 0.90,
      totalCost: 2.70,
      createdAt: new Date('2024-09-30T07:00:00'),
      purpose: 'Document Analysis',
      autoTerminateMinutes: 60,
    },
    {
      id: '2',
      provider: 'AWS',
      instanceType: 'g4dn.xlarge',
      region: 'us-east-1',
      status: 'READY',
      publicIp: '54.123.45.67',
      privateIp: '172.31.1.10',
      costPerHour: 0.526,
      totalCost: 0.263,
      createdAt: new Date('2024-09-30T09:30:00'),
      purpose: 'Batch Processing',
      autoTerminateMinutes: 30,
    },
    {
      id: '3',
      provider: 'AZURE',
      instanceType: 'Standard_NC12',
      region: 'westus2',
      status: 'TERMINATED',
      publicIp: '20.234.56.78',
      privateIp: '10.0.2.8',
      costPerHour: 1.80,
      totalCost: 5.40,
      createdAt: new Date('2024-09-29T14:00:00'),
      terminatedAt: new Date('2024-09-29T17:00:00'),
      purpose: 'AI Model Training',
      autoTerminateMinutes: 180,
    },
  ]);

  const [showProvisionDialog, setShowProvisionDialog] = useState(false);
  const [provisionForm, setProvisionForm] = useState({
    provider: 'AZURE',
    instanceType: 'Standard_NC6',
    region: 'eastus',
    diskSizeGB: 100,
    autoTerminateMinutes: 60,
    purpose: '',
  });

  const handleProvision = () => {
    const newInstance: Instance = {
      id: Date.now().toString(),
      provider: provisionForm.provider as 'AZURE' | 'AWS',
      instanceType: provisionForm.instanceType,
      region: provisionForm.region,
      status: 'PROVISIONING',
      costPerHour: getCostPerHour(provisionForm.instanceType),
      totalCost: 0,
      createdAt: new Date(),
      purpose: provisionForm.purpose,
      autoTerminateMinutes: provisionForm.autoTerminateMinutes,
    };

    setInstances([newInstance, ...instances]);
    setShowProvisionDialog(false);
    
    // Simulate provisioning
    setTimeout(() => {
      setInstances(prev => prev.map(inst => 
        inst.id === newInstance.id 
          ? { ...inst, status: 'READY', publicIp: '20.123.45.89', privateIp: '10.0.1.20' }
          : inst
      ));
    }, 5000);
  };

  const handleTerminate = (id: string) => {
    if (confirm('Terminate this instance? This action cannot be undone.')) {
      setInstances(instances.map(inst => 
        inst.id === id 
          ? { ...inst, status: 'STOPPING' }
          : inst
      ));

      setTimeout(() => {
        setInstances(prev => prev.map(inst => 
          inst.id === id 
            ? { ...inst, status: 'TERMINATED', terminatedAt: new Date() }
            : inst
        ));
      }, 2000);
    }
  };

  const getCostPerHour = (instanceType: string): number => {
    const costs: Record<string, number> = {
      'Standard_NC6': 0.90,
      'Standard_NC12': 1.80,
      'Standard_NC24': 3.60,
      'g4dn.xlarge': 0.526,
      'g4dn.12xlarge': 3.912,
      'p3.2xlarge': 3.06,
    };
    return costs[instanceType] || 0;
  };

  const stats = {
    total: instances.length,
    running: instances.filter(i => ['READY', 'RUNNING'].includes(i.status)).length,
    provisioning: instances.filter(i => ['PROVISIONING', 'CONFIGURING'].includes(i.status)).length,
    totalCost: instances.reduce((sum, i) => sum + i.totalCost, 0),
    hourlyCost: instances
      .filter(i => ['READY', 'RUNNING'].includes(i.status))
      .reduce((sum, i) => sum + i.costPerHour, 0),
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'RUNNING':
      case 'READY':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'PROVISIONING':
      case 'CONFIGURING':
      case 'STOPPING':
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'TERMINATED':
        return <XCircle className="w-4 h-4 text-gray-800" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RUNNING':
      case 'READY':
        return 'bg-green-100 text-green-700';
      case 'PROVISIONING':
      case 'CONFIGURING':
      case 'STOPPING':
        return 'bg-blue-100 text-blue-700';
      case 'TERMINATED':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  const getProviderLogo = (provider: string) => {
    return provider === 'AZURE' ? '☁️' : '🔶';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Cloud Instances</h1>
          <p className="text-gray-800">Manage your ephemeral GPU instances</p>
        </div>
        <Dialog open={showProvisionDialog} onOpenChange={setShowProvisionDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Provision Instance
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Provision New Instance</DialogTitle>
              <DialogDescription>
                Create a new GPU instance for AI processing
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Provider</Label>
                  <Select
                    value={provisionForm.provider}
                    onValueChange={(value) => setProvisionForm({ ...provisionForm, provider: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AZURE">Azure</SelectItem>
                      <SelectItem value="AWS">AWS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Instance Type</Label>
                  <Select
                    value={provisionForm.instanceType}
                    onValueChange={(value) => setProvisionForm({ ...provisionForm, instanceType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {provisionForm.provider === 'AZURE' ? (
                        <>
                          <SelectItem value="Standard_NC6">Standard_NC6 ($0.90/hr)</SelectItem>
                          <SelectItem value="Standard_NC12">Standard_NC12 ($1.80/hr)</SelectItem>
                          <SelectItem value="Standard_NC24">Standard_NC24 ($3.60/hr)</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="g4dn.xlarge">g4dn.xlarge ($0.526/hr)</SelectItem>
                          <SelectItem value="g4dn.12xlarge">g4dn.12xlarge ($3.912/hr)</SelectItem>
                          <SelectItem value="p3.2xlarge">p3.2xlarge ($3.06/hr)</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Region</Label>
                  <Select
                    value={provisionForm.region}
                    onValueChange={(value) => setProvisionForm({ ...provisionForm, region: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {provisionForm.provider === 'AZURE' ? (
                        <>
                          <SelectItem value="eastus">East US</SelectItem>
                          <SelectItem value="westus2">West US 2</SelectItem>
                          <SelectItem value="westeurope">West Europe</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="us-east-1">US East 1</SelectItem>
                          <SelectItem value="us-west-2">US West 2</SelectItem>
                          <SelectItem value="eu-west-1">EU West 1</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Disk Size (GB)</Label>
                  <Input
                    type="number"
                    value={provisionForm.diskSizeGB}
                    onChange={(e) => setProvisionForm({ ...provisionForm, diskSizeGB: parseInt(e.target.value) })}
                    min={30}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Auto-Terminate (minutes)</Label>
                <Input
                  type="number"
                  value={provisionForm.autoTerminateMinutes}
                  onChange={(e) => setProvisionForm({ ...provisionForm, autoTerminateMinutes: parseInt(e.target.value) })}
                  min={5}
                />
                <p className="text-xs text-gray-700">
                  Instance will automatically terminate after this duration
                </p>
              </div>

              <div className="space-y-2">
                <Label>Purpose</Label>
                <Input
                  placeholder="e.g., Document Analysis, Model Training"
                  value={provisionForm.purpose}
                  onChange={(e) => setProvisionForm({ ...provisionForm, purpose: e.target.value })}
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Cost Estimate</h4>
                <div className="space-y-1 text-sm text-blue-800">
                  <p>Hourly: ${getCostPerHour(provisionForm.instanceType).toFixed(3)}</p>
                  <p>
                    For {provisionForm.autoTerminateMinutes} minutes: $
                    {(getCostPerHour(provisionForm.instanceType) * (provisionForm.autoTerminateMinutes / 60)).toFixed(3)}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowProvisionDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleProvision} disabled={!provisionForm.purpose}>
                Provision Instance
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-800">
              Total Instances
            </CardTitle>
            <Server className="w-4 h-4 text-gray-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-800">
              Running
            </CardTitle>
            <Activity className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.running}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-800">
              Hourly Cost
            </CardTitle>
            <DollarSign className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${stats.hourlyCost.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-800">
              Total Cost
            </CardTitle>
            <DollarSign className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              ${stats.totalCost.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instances List */}
      <div className="space-y-4">
        {instances.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Server className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No instances</h3>
              <p className="text-gray-800 mb-4">
                Provision your first GPU instance to get started
              </p>
              <Button onClick={() => setShowProvisionDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Provision Instance
              </Button>
            </CardContent>
          </Card>
        ) : (
          instances.map((instance) => (
            <Card key={instance.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="text-4xl">{getProviderLogo(instance.provider)}</div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{instance.instanceType}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(instance.status)}`}>
                          {getStatusIcon(instance.status)}
                          {instance.status}
                        </span>
                      </div>

                      <p className="text-sm text-gray-800 mb-3">{instance.purpose}</p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-800">
                          <MapPin className="w-4 h-4" />
                          <span>{instance.region}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-800">
                          <DollarSign className="w-4 h-4" />
                          <span>${instance.costPerHour}/hr</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-800">
                          <Clock className="w-4 h-4" />
                          <span>{instance.autoTerminateMinutes}min</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-800">
                          <Zap className="w-4 h-4" />
                          <span>${instance.totalCost.toFixed(2)} total</span>
                        </div>
                      </div>

                      {instance.publicIp && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-800">Public IP:</span>
                              <span className="ml-2 font-mono">{instance.publicIp}</span>
                            </div>
                            <div>
                              <span className="text-gray-800">Private IP:</span>
                              <span className="ml-2 font-mono">{instance.privateIp}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="mt-3 text-xs text-gray-700">
                        Created: {instance.createdAt.toLocaleString()}
                        {instance.terminatedAt && (
                          <> • Terminated: {instance.terminatedAt.toLocaleString()}</>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {['READY', 'RUNNING'].includes(instance.status) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTerminate(instance.id)}
                      className="ml-4"
                    >
                      <Trash2 className="w-4 h-4 mr-2 text-red-600" />
                      Terminate
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}