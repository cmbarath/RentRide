import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { AdminSidebar } from './components/layout/AdminSidebar';
import { AdminHeader } from './components/layout/AdminHeader';
import { AuthModal } from './components/customer/AuthModal';

// Customer screens
import { HomePage } from './components/customer/HomePage';
import { ExplorePage } from './components/customer/ExplorePage';
import { VehicleDetailPage } from './components/customer/VehicleDetailPage';
import { CheckoutPage } from './components/customer/CheckoutPage';
import { CustomerDashboard } from './components/customer/CustomerDashboard';

// Admin screens
import { AdminDashboardOverview } from './components/admin/AdminDashboardOverview';
import { AdminBookings } from './components/admin/AdminBookings';
import { AdminVehicles } from './components/admin/AdminVehicles';
import { AdminPricing } from './components/admin/AdminPricing';
import { AdminCustomers } from './components/admin/AdminCustomers';
import { AdminPayments } from './components/admin/AdminPayments';
import { AdminSettings } from './components/admin/AdminSettings';

const MainApp: React.FC = () => {
  const { mode, customerScreen, adminScreen } = useApp();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Render Customer Mode
  if (mode === 'customer') {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8F9FA] text-[#111827]">
        <Navbar />

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

  // Render Admin Mode (Full-width SaaS Dashboard)
  return (
    <div className="min-h-screen flex bg-[#F8F9FA] text-[#111827]">
      <AdminSidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
        />

        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {adminScreen === 'overview' && <AdminDashboardOverview />}
          {adminScreen === 'bookings' && <AdminBookings />}
          {adminScreen === 'vehicles' && <AdminVehicles />}
          {adminScreen === 'pricing' && <AdminPricing />}
          {adminScreen === 'customers' && <AdminCustomers />}
          {adminScreen === 'payments' && <AdminPayments />}
          {adminScreen === 'settings' && <AdminSettings />}
        </main>
      </div>

      <AuthModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
