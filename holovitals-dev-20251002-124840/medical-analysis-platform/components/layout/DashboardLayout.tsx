'use client';

import { useState, ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import StatusBar from './StatusBar';
import MobileNav from './MobileNav';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Navigation */}
      <MobileNav 
        isOpen={mobileMenuOpen} 
        onClose={() => setMobileMenuOpen(false)} 
      />

      {/* Desktop Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)} 
      />

      {/* Main Content Area */}
      <div 
        className={`transition-all duration-300 ${
          sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
        }`}
      >
        {/* Header */}
        <Header 
          onMenuClick={() => setMobileMenuOpen(true)}
          sidebarOpen={sidebarOpen}
        />

        {/* Page Content */}
        <main className="p-4 md:p-6 lg:p-8 pb-20">
          {children}
        </main>

        {/* Status Bar */}
        <StatusBar />
      </div>
    </div>
  );
}