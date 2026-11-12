'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { AuthModal } from '@/components/customer/AuthModal';

// Customer Screens
import { HomePage } from '@/components/customer/HomePage';
import { ExplorePage } from '@/components/customer/ExplorePage';
import { VehicleDetailPage } from '@/components/customer/VehicleDetailPage';
import { CheckoutPage } from '@/components/customer/CheckoutPage';
import { CustomerDashboard } from '@/components/customer/CustomerDashboard';

// Admin Screens
import { AdminDashboardOverview } from '@/components/admin/AdminDashboardOverview';
import { AdminBookings } from '@/components/admin/AdminBookings';
import { AdminVehicles } from '@/components/admin/AdminVehicles';
import { AdminLocations } from '@/components/admin/AdminLocations';
import { AdminPricing } from '@/components/admin/AdminPricing';
import { AdminCustomers } from '@/components/admin/AdminCustomers';
import { AdminPayments } from '@/components/admin/AdminPayments';
import { AdminReviews } from '@/components/admin/AdminReviews';
import { AdminSettings } from '@/components/admin/AdminSettings';

export default function Page() {
  const {
    mode,
    setMode,
    customerScreen,
    adminScreen,
    currentUser,
    isAuthLoading,
    authNotice,
    clearAuthNotice,
    setAuthModalMode,
    setIsAuthModalOpen,
  } = useApp();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const isAdminAuthorized = currentUser?.role === 'admin' || currentUser?.role === 'fleet_manager';

  if (mode === 'admin' && isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] text-[#111827]">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-[#111827] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-gray-500">Verifying administrator permissions...</p>
        </div>
      </div>
    );
  }

  // If in admin mode but not authenticated with admin privileges, fail securely
  if (mode === 'admin' && !isAdminAuthorized) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8F9FA] text-[#111827]">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-gray-200 rounded-3xl p-8 shadow-xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4 text-amber-600">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Administrator Access Required</h2>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              You must be signed in with verified fleet management privileges to access the administrative portal.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={() => {
                  setAuthModalMode('admin-login');
                  setIsAuthModalOpen(true);
                }}
                className="w-full py-3 bg-[#111827] text-white font-semibold rounded-xl hover:bg-black transition-colors"
              >
                Log In as Administrator
              </button>
              <button
                onClick={() => setMode('customer')}
                className="w-full py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Return to Customer Portal
              </button>
            </div>
          </div>
        </main>
        <Footer />
        <AuthModal />
      </div>
    );
  }

  // Customer Mode View
  if (mode === 'customer') {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8F9FA] text-[#111827]">
        <Navbar />

        {authNotice && (
          <div
            className={`px-4 py-3 text-xs font-semibold border-b ${
              authNotice.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : authNotice.type === 'error'
                ? 'bg-red-50 text-red-900 border-red-200'
                : 'bg-blue-50 text-blue-900 border-blue-200'
            }`}
          >
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
              <span>{authNotice.message}</span>
              <button
                type="button"
                onClick={clearAuthNotice}
                className="text-xs font-bold underline cursor-pointer shrink-0"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        <main className="flex-1">
          {customerScreen === 'home' && <HomePage />}
          {customerScreen === 'explore' && <ExplorePage />}
          {customerScreen === 'detail' && <VehicleDetailPage />}
          {customerScreen === 'checkout' && <CheckoutPage />}
          {customerScreen === 'dashboard' && <CustomerDashboard />}
        </main>

        <Footer />
        <AuthModal />
      </div>
    );
  }

  // Admin Mode View (Fleet SaaS Dashboard)
  return (
    <div className="min-h-screen flex bg-[#F8F9FA] text-[#111827]">
      <AdminSidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <AdminHeader
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {adminScreen === 'overview' && <AdminDashboardOverview />}
          {adminScreen === 'bookings' && <AdminBookings />}
          {adminScreen === 'vehicles' && <AdminVehicles />}
          {adminScreen === 'locations' && <AdminLocations />}
          {adminScreen === 'pricing' && <AdminPricing />}
          {adminScreen === 'customers' && <AdminCustomers />}
          {adminScreen === 'payments' && <AdminPayments />}
          {adminScreen === 'reviews' && <AdminReviews />}
          {adminScreen === 'settings' && <AdminSettings />}
        </main>
      </div>

      <AuthModal />
    </div>
  );
}
