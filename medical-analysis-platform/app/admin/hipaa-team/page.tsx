'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Mail, Phone, User, Save, CheckCircle, AlertCircle } from 'lucide-react';

interface TeamMember {
  role: string;
  email: string;
  name: string;
  phone: string;
  notificationEnabled: boolean;
}

export default function HIPAATeamConfigPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch('/api/admin/hipaa/team');
      if (response.ok) {
        const data = await response.json();
        setTeamMembers(data.team || []);
      }
    } catch (error) {
      console.error('Failed to fetch team members:', error);
      setMessage({ type: 'error', text: 'Failed to load team members' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/hipaa/team', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team: teamMembers }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'HIPAA team configuration saved successfully!' });
        
        // Update environment variables
        await fetch('/api/admin/hipaa/team/update-env', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ team: teamMembers }),
        });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to save configuration' });
      }
    } catch (error) {
      console.error('Failed to save team members:', error);
      setMessage({ type: 'error', text: 'Failed to save configuration' });
    } finally {
      setSaving(false);
    }
  };

  const updateTeamMember = (role: string, field: keyof TeamMember, value: string | boolean) => {
    setTeamMembers(prev =>
      prev.map(member =>
        member.role === role ? { ...member, [field]: value } : member
      )
    );
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'COMPLIANCE_OFFICER':
        return 'Compliance Officer';
      case 'PRIVACY_OFFICER':
        return 'Privacy Officer';
      case 'SECURITY_OFFICER':
        return 'Security Officer';
      default:
        return role;
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'COMPLIANCE_OFFICER':
        return 'Oversees HIPAA compliance program and ensures regulatory adherence';
      case 'PRIVACY_OFFICER':
        return 'Manages patient privacy rights and PHI protection policies';
      case 'SECURITY_OFFICER':
        return 'Implements and maintains security measures for PHI';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading HIPAA team configuration...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">HIPAA Compliance Team Configuration</h1>
        </div>
        <p className="text-gray-600">
          Configure your HIPAA compliance team members who will receive notifications about security incidents and compliance issues.
        </p>
      </div>

      {message && (
        <Alert className={`mb-6 ${message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {message.text}
            </AlertDescription>
          </div>
        </Alert>
      )}

      <div className="space-y-6">
        {teamMembers.map((member) => (
          <Card key={member.role} className="border-2">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                {getRoleLabel(member.role)}
              </CardTitle>
              <CardDescription>{getRoleDescription(member.role)}</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor={`${member.role}-name`} className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Full Name
                  </Label>
                  <Input
                    id={`${member.role}-name`}
                    value={member.name}
                    onChange={(e) => updateTeamMember(member.role, 'name', e.target.value)}
                    placeholder="Enter full name"
                    className="border-gray-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`${member.role}-email`} className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Address *
                  </Label>
                  <Input
                    id={`${member.role}-email`}
                    type="email"
                    value={member.email}
                    onChange={(e) => updateTeamMember(member.role, 'email', e.target.value)}
                    placeholder="email@example.com"
                    className="border-gray-300"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`${member.role}-phone`} className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </Label>
                  <Input
                    id={`${member.role}-phone`}
                    type="tel"
                    value={member.phone}
                    onChange={(e) => updateTeamMember(member.role, 'phone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="border-gray-300"
                  />
                </div>

                <div className="space-y-2 flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={member.notificationEnabled}
                      onChange={(e) => updateTeamMember(member.role, 'notificationEnabled', e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium">Enable email notifications</span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 flex justify-end gap-4">
        <Button
          variant="outline"
          onClick={fetchTeamMembers}
          disabled={saving}
        >
          Reset Changes
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Configuration
            </>
          )}
        </Button>
      </div>

      <Card className="mt-8 border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="text-yellow-800 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Important Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="text-yellow-800 space-y-2">
          <p>• All team members will receive notifications about HIPAA incidents and compliance issues</p>
          <p>• Email addresses must be valid and monitored regularly</p>
          <p>• Changes take effect immediately after saving</p>
          <p>• At least one team member must have notifications enabled</p>
          <p>• This configuration is separate from the general error logging system</p>
        </CardContent>
      </Card>
    </div>
  );
}