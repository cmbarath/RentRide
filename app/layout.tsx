import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/context/AppContext';

export const metadata: Metadata = {
  title: 'RentRide – Tamil Nadu Premier Car & Bike Rental Platform',
  description:
    'Book verified self-drive cars, touring bikes, commuter motorcycles, and scooters across 16 Tamil Nadu cities. Instant KYC driving licence verification and doorstep delivery.',
  keywords: [
    'Car Rental Chennai',
    'Bike Rental Coimbatore',
    'Self Drive Cars Tamil Nadu',
    'Royal Enfield Rental',
    'RentRide',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="antialiased min-h-screen bg-[#F8F9FA] text-[#111827]">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
