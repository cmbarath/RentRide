'use client';

import React, { useEffect, use } from 'react';
import { useApp } from '@/context/AppContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { VehicleDetailPage } from '@/components/customer/VehicleDetailPage';
import { CheckoutPage } from '@/components/customer/CheckoutPage';
import { AuthModal } from '@/components/customer/AuthModal';

export default function SingleVehiclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const unwrappedParams = use(params);
  const { setSelectedVehicleId, customerScreen, setCustomerScreen, setMode } = useApp();

  useEffect(() => {
    setMode('customer');
    if (unwrappedParams.id) {
      setSelectedVehicleId(unwrappedParams.id);
    }
    if (customerScreen !== 'checkout') {
      setCustomerScreen('detail');
    }
  }, [unwrappedParams.id, setSelectedVehicleId, setCustomerScreen, setMode, customerScreen]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] text-[#111827]">
      <Navbar />
      <main className="flex-1">
        {customerScreen === 'checkout' ? <CheckoutPage /> : <VehicleDetailPage />}
      </main>
      <Footer />
      <AuthModal />
    </div>
  );
}
