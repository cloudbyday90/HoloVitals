import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Users, Activity, Shield, Zap, Database, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            HoloVitals
          </h1>
          <p className="text-xl text-gray-800 mb-8">
            Your Personal Health AI Assistant - Comprehensive EHR integration, AI-powered health insights, and intelligent patient care management
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="lg" className="text-lg px-8 bg-blue-600 hover:bg-blue-700">
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/about">
              <Button size="lg" variant="outline" className="text-lg px-8 border-blue-600 text-blue-600 hover:bg-blue-50">
                Learn More
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          <Card className="hover:shadow-lg transition-shadow bg-white border-gray-200">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle className="text-gray-900">Patient Management</CardTitle>
              <CardDescription className="text-gray-600">
                Comprehensive patient records with EHR integration across 7 major providers
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow bg-white border-gray-200">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle className="text-gray-900">AI Health Insights</CardTitle>
              <CardDescription className="text-gray-600">
                Advanced AI analysis for risk assessment, trend detection, and personalized recommendations
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow bg-white border-gray-200">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Heart className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle className="text-gray-900">Clinical Data Viewer</CardTitle>
              <CardDescription className="text-gray-600">
                View lab results, medications, allergies, conditions, and health timeline in one place
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow bg-white border-gray-200">
            <CardHeader>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Database className="w-6 h-6 text-orange-600" />
              </div>
              <CardTitle className="text-gray-900">EHR Integration</CardTitle>
              <CardDescription className="text-gray-600">
                Seamless integration with Epic, Cerner, MEDITECH, Allscripts, NextGen, athenahealth, and eClinicalWorks
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow bg-white border-gray-200">
            <CardHeader>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle className="text-gray-900">HIPAA Compliant</CardTitle>
              <CardDescription className="text-gray-600">
                Enterprise-grade security with comprehensive audit logging and access control
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow bg-white border-gray-200">
            <CardHeader>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-yellow-600" />
              </div>
              <CardTitle className="text-gray-900">Real-time Sync</CardTitle>
              <CardDescription className="text-gray-600">
                Bidirectional data synchronization with conflict resolution and webhook support
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* How It Works */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">How It Works</h2>
          <div className="space-y-8">
            <div className="flex gap-6 items-start">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Connect Your EHR</h3>
                <p className="text-gray-700">
                  Securely connect to your healthcare provider's EHR system. We support the top 7 EHR platforms covering 75%+ of U.S. hospitals.
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Sync Your Health Data</h3>
                <p className="text-gray-700">
                  Your medical records, lab results, medications, and health history are automatically synchronized and kept up-to-date.
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Get AI-Powered Insights</h3>
                <p className="text-gray-700">
                  Our advanced AI analyzes your health data to provide personalized insights, risk assessments, and actionable recommendations.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to take control of your health?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of users who trust HoloVitals for their health management
          </p>
          <Link href="/dashboard">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Start Your Journey
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}