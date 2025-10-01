import React from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { BetaCodeManagement } from '@/components/admin/BetaCodeManagement';

export const metadata = {
  title: 'Beta Code Management | HoloVitals Admin',
  description: 'Manage beta testing codes and track usage',
};

export default async function BetaCodesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  // TODO: Add admin role check
  // if (!session.user.isAdmin) {
  //   redirect('/dashboard');
  // }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Beta Code Management</h1>
        <p className="text-muted-foreground">
          Generate and manage beta testing codes for your users
        </p>
      </div>

      <BetaCodeManagement />
    </div>
  );
}