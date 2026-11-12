import React from 'react';
import { useApp, AdminScreen } from '../../context/AppContext';
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
  HelpCircle,
  ExternalLink,
} from 'lucide-react';

interface AdminSidebarProps {
  collapsed: boolean;
  setCollapsed: (val: boolean) => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ collapsed, setCollapsed }) => {
  const { adminScreen, setAdminScreen, setMode, bookings, customers, vehicles } = useApp();

  const pendingApprovalsCount = bookings.filter(
    (b) => b.bookingStatus === 'awaiting_licence' || b.bookingStatus === 'submitted'
  ).length;

  const navItems: { label: string; screen: AdminScreen; icon: any; badge?: number }[] = [
    { label: 'Overview', screen: 'overview', icon: LayoutDashboard },
    { label: 'Bookings', screen: 'bookings', icon: CalendarCheck, badge: pendingApprovalsCount },
    { label: 'Fleet Management', screen: 'vehicles', icon: Car, badge: vehicles.length },
    { label: 'Pricing & Calendar', screen: 'pricing', icon: Tag },
    { label: 'Customers', screen: 'customers', icon: Users, badge: customers.length },
    { label: 'Revenue & Payments', screen: 'payments', icon: CreditCard },
    { label: 'Business Settings', screen: 'settings', icon: Settings },
  ];

  return (
    <aside
      className={`bg-[#0D131F] text-gray-300 border-r border-gray-800 transition-all duration-300 flex flex-col justify-between shrink-0 h-screen sticky top-0 z-30 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div>
        {/* Brand header */}
        <div className="h-18 px-5 border-b border-gray-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-[#C7F36B] flex items-center justify-center text-[#111827] shrink-0 font-bold">
              <Car className="w-5 h-5 stroke-[2.3]" />
            </div>
            {!collapsed && (
              <div className="truncate">
                <span className="text-base font-extrabold text-white tracking-tight block leading-none">
                  Rent<span className="text-[#C7F36B]">Ride</span>
                </span>
                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                  Fleet Admin Console
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation links */}
        <nav className="p-3 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = adminScreen === item.screen;
            return (
              <button
                key={item.screen}
                onClick={() => setAdminScreen(item.screen)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all relative ${
                  isActive
                    ? 'bg-[#C7F36B] text-[#111827] shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/70'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#111827]' : 'text-gray-400'}`} />
                {!collapsed && <span className="truncate">{item.label}</span>}
                {!collapsed && item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`ml-auto text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                      isActive ? 'bg-[#111827] text-[#C7F36B]' : 'bg-gray-800 text-gray-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Switch back to Customer Storefront */}
      <div className="p-3 border-t border-gray-800 space-y-2">
        <button
          onClick={() => setMode('customer')}
          className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold bg-gray-800/80 hover:bg-gray-700 text-white transition-all ${
            collapsed ? 'justify-center' : ''
          }`}
          title="Exit to Customer Storefront"
        >
          <ArrowLeft className="w-4 h-4 text-[#C7F36B] shrink-0" />
          {!collapsed && <span>Customer View</span>}
        </button>

        {!collapsed && (
          <div className="p-2.5 bg-gray-900/60 rounded-xl border border-gray-800/80 text-[11px] text-gray-500 flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="truncate">RBAC: Super Fleet Admin</span>
          </div>
        )}
      </div>
    </aside>
  );
};
