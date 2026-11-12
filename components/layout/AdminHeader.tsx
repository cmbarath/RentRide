'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import {
  Bell,
  Menu,
  ChevronRight,
  ExternalLink,
  LogOut,
} from 'lucide-react';

interface AdminHeaderProps {
  collapsed: boolean;
  setCollapsed: (val: boolean) => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ collapsed, setCollapsed }) => {
  const {
    adminScreen,
    notifications,
    markNotificationRead,
    clearNotifications,
    setMode,
    currentUser,
    signOutWithSupabase,
  } = useApp();

  const router = useRouter();
  const pathname = usePathname();
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const screenTitles: Record<string, string> = {
    overview: 'Operations Overview & Telemetry',
    bookings: 'Rental Bookings & KYC Audit',
    vehicles: 'Fleet Management & Inventory',
    locations: 'Tamil Nadu Hubs & City Networks',
    pricing: 'Dynamic Pricing & Calendar Blackouts',
    customers: 'Customer Accounts & Profiles',
    payments: 'Billing Ledger & Financials',
    reviews: 'Customer Review Moderation',
    settings: 'Platform Policies & Integrations',
  };

  const handleExitToStorefront = () => {
    setMode('customer');
    if (pathname === '/admin') {
      router.push('/');
    }
  };

  return (
    <header className="h-18 bg-[#111827] text-white border-b border-gray-800 sticky top-0 z-30 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4">
      {/* Left: Collapse toggle + Breadcrumbs */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          title="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-400">Admin</span>
          <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
          <span className="font-bold text-white text-sm">
            {screenTitles[adminScreen] || adminScreen}
          </span>
        </div>
      </div>

      {/* Right: Quick Switch, Notifications, Admin Profile */}
      <div className="flex items-center gap-3">
        {/* Quick Switch to Customer View */}
        <button
          type="button"
          onClick={handleExitToStorefront}
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 transition-colors cursor-pointer"
        >
          <span>View Storefront</span>
          <ExternalLink className="w-3 h-3 text-[#C7F36B]" />
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 relative transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white text-gray-900 rounded-2xl shadow-2xl border border-gray-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                <span className="font-bold text-xs text-gray-900">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={clearNotifications}
                    className="text-[11px] text-gray-500 hover:text-gray-900"
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-gray-400">
                    No active notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationRead(n.id)}
                      className={`p-3 text-xs cursor-pointer hover:bg-gray-50 transition-colors ${
                        !n.read ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold text-gray-900 mb-0.5">
                        <span>{n.title}</span>
                        <span className="text-[10px] text-gray-400 font-normal">{n.timestamp}</span>
                      </div>
                      <p className="text-gray-600 leading-snug">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Admin Badge & Secure Logout */}
        <div className="flex items-center gap-3 pl-2 border-l border-gray-800">
          <div className="w-7 h-7 rounded-full bg-[#C7F36B] text-[#111827] flex items-center justify-center font-bold text-xs">
            {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="hidden xl:block text-left">
            <p className="text-xs font-semibold leading-tight text-white truncate max-w-[140px]">
              {currentUser?.name || 'Fleet Operations'}
            </p>
            <p className="text-[10px] text-gray-400">
              {currentUser?.role === 'fleet_manager' ? 'Fleet Manager' : 'Administrator'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => signOutWithSupabase()}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-red-950/50 hover:bg-red-900/70 text-red-200 border border-red-800/60 transition-colors cursor-pointer"
            title="Log Out of Admin Session"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Log Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
