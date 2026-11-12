'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useApp, AdminScreen } from '@/context/AppContext';
import {
  LayoutDashboard,
  CalendarCheck,
  Car,
  Tag,
  Users,
  CreditCard,
  Settings,
  ArrowLeft,
  Shield,
  MapPin,
  LogOut,
  MessageSquare,
  X,
} from 'lucide-react';

interface AdminSidebarProps {
  collapsed: boolean;
  setCollapsed: (val: boolean) => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ collapsed, setCollapsed }) => {
  const router = useRouter();
  const pathname = usePathname();
  const {
    adminScreen,
    setAdminScreen,
    setMode,
    bookings,
    customers,
    vehicles,
    currentUser,
    signOutWithSupabase,
  } = useApp();

  const pendingApprovalsCount = bookings.filter(
    (b) => b.bookingStatus === 'pending_review' || b.bookingStatus === 'awaiting_licence'
  ).length;

  const navItems: { label: string; screen: AdminScreen; icon: any; badge?: number }[] = [
    { label: 'Overview', screen: 'overview', icon: LayoutDashboard },
    { label: 'Bookings & KYC', screen: 'bookings', icon: CalendarCheck, badge: pendingApprovalsCount },
    { label: 'Fleet Management', screen: 'vehicles', icon: Car, badge: vehicles.length },
    { label: 'Tamil Nadu Hubs', screen: 'locations', icon: MapPin },
    { label: 'Pricing & Calendar', screen: 'pricing', icon: Tag },
    { label: 'Customers', screen: 'customers', icon: Users, badge: customers.length },
    { label: 'Revenue & Payments', screen: 'payments', icon: CreditCard },
    { label: 'Review Moderation', screen: 'reviews', icon: MessageSquare },
    { label: 'Business Settings', screen: 'settings', icon: Settings },
  ];

  const handleExitToStorefront = () => {
    setMode('customer');
    if (pathname === '/admin') {
      router.push('/');
    }
  };

  return (
    <>
      {/* Mobile backdrop when sidebar drawer is toggled open on <md viewports */}
      {collapsed && (
        <div
          onClick={() => setCollapsed(false)}
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
        />
      )}

      <aside
        className={`bg-[#0D131F] text-gray-300 border-r border-gray-800 transition-all duration-300 flex-col justify-between shrink-0 h-screen ${
          collapsed
            ? 'flex fixed inset-y-0 left-0 z-50 w-64 md:sticky md:top-0 md:w-20 md:z-30'
            : 'hidden md:flex md:sticky md:top-0 md:w-64 md:z-30'
        }`}
      >
        <div>
          {/* Brand header */}
          <div className="h-18 px-5 border-b border-gray-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-[#C7F36B] flex items-center justify-center text-[#111827] shrink-0 font-bold">
                <Car className="w-5 h-5 stroke-[2.3]" />
              </div>
              <div className={`truncate ${collapsed ? 'md:hidden' : ''}`}>
                <span className="text-base font-extrabold text-white tracking-tight block leading-none">
                  Rent<span className="text-[#C7F36B]">Ride</span>
                </span>
                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                  TN Fleet Admin
                </span>
              </div>
            </div>

            {collapsed && (
              <button
                type="button"
                onClick={() => setCollapsed(false)}
                className="md:hidden p-1.5 text-gray-400 hover:text-white"
                aria-label="Close sidebar"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Navigation links */}
          <nav className="p-3 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = adminScreen === item.screen;
              return (
                <button
                  type="button"
                  key={item.screen}
                  onClick={() => {
                    setAdminScreen(item.screen);
                    if (typeof window !== 'undefined' && window.innerWidth < 768) {
                      setCollapsed(false);
                    }
                  }}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all relative cursor-pointer ${
                    isActive
                      ? 'bg-[#C7F36B] text-[#111827] shadow-sm'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/70'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#111827]' : 'text-gray-400'}`} />
                  <span className={`truncate ${collapsed ? 'md:hidden' : ''}`}>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`ml-auto text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                        isActive ? 'bg-[#111827] text-[#C7F36B]' : 'bg-amber-500 text-black'
                      } ${collapsed ? 'md:hidden' : ''}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Switch back to Customer Storefront & Logout */}
        <div className="p-3 border-t border-gray-800 space-y-2">
          <button
            type="button"
            onClick={handleExitToStorefront}
            className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold bg-gray-800/80 hover:bg-gray-700 text-white transition-all cursor-pointer ${
              collapsed ? 'md:justify-center' : ''
            }`}
            title="Exit to Customer Storefront"
          >
            <ArrowLeft className="w-4 h-4 text-[#C7F36B] shrink-0" />
            <span className={collapsed ? 'md:hidden' : ''}>Customer View</span>
          </button>

          <button
            type="button"
            onClick={() => signOutWithSupabase()}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-red-950/40 hover:bg-red-900/60 text-red-200 border border-red-800/50 transition-all cursor-pointer ${
              collapsed ? 'md:justify-center' : ''
            }`}
            title="Sign Out"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span className={collapsed ? 'md:hidden' : ''}>Sign Out</span>
          </button>

          <div
            className={`p-2.5 bg-gray-900/60 rounded-xl border border-gray-800/80 text-[11px] text-gray-500 flex items-center gap-2 ${
              collapsed ? 'md:hidden' : ''
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="truncate">
              RBAC: {currentUser?.role === 'fleet_manager' ? 'Fleet Manager' : 'Super Fleet Admin'}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
