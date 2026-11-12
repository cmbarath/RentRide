'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { AuthModal } from '@/components/customer/AuthModal';

import { AdminDashboardOverview } from '@/components/admin/AdminDashboardOverview';
import { AdminBookings } from '@/components/admin/AdminBookings';
import { AdminVehicles } from '@/components/admin/AdminVehicles';
import { AdminLocations } from '@/components/admin/AdminLocations';
import { AdminPricing } from '@/components/admin/AdminPricing';
import { AdminCustomers } from '@/components/admin/AdminCustomers';
import { AdminPayments } from '@/components/admin/AdminPayments';
import { AdminReviews } from '@/components/admin/AdminReviews';
import { AdminSettings } from '@/components/admin/AdminSettings';
import { ShieldCheck, Lock, Mail, ArrowRight, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
  const {
    mode,
    setMode,
    adminScreen,
    currentUser,
    isAuthLoading,
    signInWithSupabase,
    signOutWithSupabase,
  } = useApp();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [authError, setAuthError] = useState('');

  const isAdminAuthorized =
    currentUser?.role === 'admin' || currentUser?.role === 'fleet_manager';

  useEffect(() => {
    if (isAdminAuthorized && mode !== 'admin') {
      setMode('admin');
    }
  }, [isAdminAuthorized, mode, setMode]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center p-4 text-white">
        <Loader2 className="w-8 h-8 animate-spin text-[#C7F36B] mb-3" />
        <p className="text-xs font-semibold text-gray-300">
          Verifying fleet administrator authorization...
        </p>
      </div>
    );
  }

  const handleAdminGateLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsVerifying(true);

    try {
      const res = await signInWithSupabase(adminEmail, adminPassword);
      if (res.success) {
        if (res.role === 'admin' || res.role === 'fleet_manager') {
          setMode('admin');
        } else {
          await signOutWithSupabase();
          setAuthError(
            'Access Denied: This account does not possess fleet management privileges. Role: customer.'
          );
        }
      } else {
        setAuthError(res.error || 'Invalid administrator credentials.');
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  // If not authorized as Admin, render protected security gate
  if (!isAdminAuthorized) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center p-4 text-white">
        <div className="max-w-md w-full bg-[#1E293B] border border-gray-700/60 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          {/* Subtle Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#C7F36B]/10 rounded-full blur-2xl pointer-events-none" />

          {/* Badge */}
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mb-6 text-blue-400">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight">
            Fleet Operations Console
          </h2>
          <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
            Restricted administrative area for RentRide Tamil Nadu fleet management and customer KYC verification.
          </p>

          {/* If signed in as non-admin customer, warn explicitly and provide safe sign-out */}
          {currentUser && !isAdminAuthorized && (
            <div className="mt-4 p-3.5 bg-amber-950/70 border border-amber-700/70 text-amber-200 text-xs rounded-xl space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Currently signed in as <strong>{currentUser.email}</strong> (Role:{' '}
                  <code className="bg-amber-900/80 px-1 rounded">{currentUser.role || 'customer'}</code>).
                  Administrator or Fleet Manager role is required to access this portal.
                </span>
              </div>
              <button
                type="button"
                onClick={() => signOutWithSupabase()}
                className="text-[11px] font-bold text-[#C7F36B] hover:underline cursor-pointer"
              >
                Sign out of customer session
              </button>
            </div>
          )}

          {authError && (
            <div className="mt-4 p-3 bg-red-950/80 border border-red-800 text-red-200 text-xs rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleAdminGateLogin} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Admin Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-500 absolute left-3 top-3.5" />
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@rentride.in"
                  className="w-full pl-9 pr-3 py-2.5 bg-[#0F172A] border border-gray-700 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-3.5" />
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-[#0F172A] border border-gray-700 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Sign In as Administrator</span>
                </>
              )}
            </button>
          </form>

          {/* Return to Customer Portal */}
          <div className="mt-6 text-center">
            <Link
              href="/"
              onClick={() => setMode('customer')}
              className="text-xs text-gray-400 hover:text-white inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to RentRide Customer Portal</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
