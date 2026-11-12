'use client';

import React, { useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CheckoutPage } from '@/components/customer/CheckoutPage';
import { AuthModal } from '@/components/customer/AuthModal';

export default function CheckoutRoute() {
  const { setCustomerScreen, setMode } = useApp();

  useEffect(() => {
    setMode('customer');
    setCustomerScreen('checkout');
  }, [setMode, setCustomerScreen]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] text-[#111827]">
      <Navbar />
      <main className="flex-1">
        <CheckoutPage />
      </main>
      <Footer />
      <AuthModal />
    </div>
  );
}
