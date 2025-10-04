/**
 * EHR Connection Page
 * 
 * Page for connecting to EHR systems
 */

import { ConnectionWizard } from '@/components/ehr/ConnectionWizard';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Connect to EHR | HoloVitals',
  description: 'Connect your Electronic Health Record system to HoloVitals',
};

export default async function EHRConnectPage() {
  // Get the current user session
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  // In a real app, you would get the customer ID from the session or database
  // For now, we'll use the user ID as the customer ID
  const customerId = session.user.id;

  return (
    <div className="min-h-screen bg-background">
      <ConnectionWizard customerId={customerId} />
    </div>
  );
}