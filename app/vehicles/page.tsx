'use client';

import React, { useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ExplorePage } from '@/components/customer/ExplorePage';
import { VehicleDetailPage } from '@/components/customer/VehicleDetailPage';
import { CheckoutPage } from '@/components/customer/CheckoutPage';
import { AuthModal } from '@/components/customer/AuthModal';

export default function VehiclesPage() {
  const { customerScreen, setCustomerScreen, mode, setMode } = useApp();

  useEffect(() => {
    if (mode !== 'customer') setMode('customer');
    if (customerScreen !== 'explore' && customerScreen !== 'detail' && customerScreen !== 'checkout') {
      setCustomerScreen('explore');
    }
  }, [mode, customerScreen, setMode, setCustomerScreen]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] text-[#111827]">
      <Navbar />
      <main className="flex-1">
        {customerScreen === 'detail' ? (
          <VehicleDetailPage />
        ) : customerScreen === 'checkout' ? (
          <CheckoutPage />
        ) : (
          <ExplorePage />
        )}
      </main>
      <Footer />
      <AuthModal />
    </div>
  );
}
