import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Bell,
  Search,
  Menu,
  ChevronRight,
  ShieldCheck,
  Check,
  LogOut,
  User,
  Sparkles,
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
  } = useApp();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const screenTitles: Record<string, string> = {
    overview: 'Operations Overview',
    bookings: 'Rental Bookings & Verification',
    vehicles: 'Fleet Management',
    pricing: 'Dynamic Pricing & Calendar',
    customers: 'Customer Accounts & KYC',
    payments: 'Revenue & Transaction Ledger',
    settings: 'Platform Settings & Policies',
  };

  return (
    <header className="h-18 bg-[#111827] text-white border-b border-gray-800 sticky top-0 z-30 px-6 flex items-center justify-between gap-4">
      
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

      {/* Right: Quick Search, Notifications, Admin Profile */}
      <div className="flex items-center gap-3">
        {/* Quick Switch to Customer View */}
        <button
          onClick={() => setMode('customer')}
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 transition-colors"
        >
          <span>View Customer Storefront</span>
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 relative transition-colors"
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
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationRead(n.id)}
                      className={`p-3 text-xs hover:bg-gray-50 cursor-pointer transition-colors ${
                        !n.read ? 'bg-lime-50/50' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-gray-900">{n.title}</span>
                        <span className="text-[10px] text-gray-400">{n.timestamp}</span>
                      </div>
                      <p className="text-gray-600 text-[11px] leading-tight">{n.message}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-gray-400">
                    No new notifications.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-[#C7F36B] text-[#111827] font-bold text-xs flex items-center justify-center">
              A
            </div>
            <div className="hidden sm:block text-left">
              <span className="text-xs font-bold text-white block leading-none">Vikram S.</span>
              <span className="text-[10px] text-gray-400 leading-none">Fleet Manager</span>
            </div>
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white text-gray-900 rounded-xl shadow-xl border border-gray-100 py-1.5 z-50">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-xs font-bold text-gray-900">Admin Account</p>
                <p className="text-[11px] text-gray-400">admin@rentride.in</p>
              </div>
              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  setMode('customer');
                }}
                className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <User className="w-3.5 h-3.5 text-gray-400" />
                <span>Customer Storefront</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
