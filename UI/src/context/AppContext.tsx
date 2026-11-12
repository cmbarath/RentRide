import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Vehicle,
  Booking,
  Customer,
  Transaction,
  HubLocation,
  BlockedDateRange,
  VehicleType,
  BookingStatus,
} from '../types';
import {
  INITIAL_VEHICLES,
  INITIAL_CUSTOMERS,
  INITIAL_BOOKINGS,
  INITIAL_TRANSACTIONS,
  INITIAL_HUBS,
  INITIAL_BLOCKED_DATES,
} from '../data/mockData';

export type CustomerScreen = 'home' | 'explore' | 'detail' | 'checkout' | 'dashboard';
export type AdminScreen = 'overview' | 'bookings' | 'vehicles' | 'pricing' | 'customers' | 'payments' | 'settings';

export interface SearchCriteria {
  type: 'all' | VehicleType;
  location: string;
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'info' | 'success' | 'alert';
}

interface AppContextType {
  // Navigation & State
  mode: 'customer' | 'admin';
  setMode: (mode: 'customer' | 'admin') => void;
  customerScreen: CustomerScreen;
  setCustomerScreen: (screen: CustomerScreen) => void;
  adminScreen: AdminScreen;
  setAdminScreen: (screen: AdminScreen) => void;
  selectedVehicleId: string | null;
  setSelectedVehicleId: (id: string | null) => void;

  // Search
  searchCriteria: SearchCriteria;
  setSearchCriteria: React.Dispatch<React.SetStateAction<SearchCriteria>>;
  triggerSearch: (criteria: Partial<SearchCriteria>) => void;

  // Vehicles
  vehicles: Vehicle[];
  addVehicle: (vehicle: Omit<Vehicle, 'id'>) => void;
  updateVehicle: (id: string, updates: Partial<Vehicle>) => void;
  deleteVehicle: (id: string) => void;
  getVehicleById: (id: string) => Vehicle | undefined;

  // Bookings
  bookings: Booking[];
  createBooking: (newBooking: Omit<Booking, 'id' | 'createdAt' | 'statusHistory'>) => string;
  approveBooking: (bookingId: string) => void;
  rejectBooking: (bookingId: string, reason: string) => void;
  payBooking: (bookingId: string, paymentMethod: 'UPI' | 'Credit Card' | 'Debit Card' | 'NetBanking') => void;
  cancelBooking: (bookingId: string) => void;
  completeBooking: (bookingId: string) => void;
  verifyLicence: (customerId: string, status: 'verified' | 'rejected') => void;

  // Customers & Auth
  customers: Customer[];
  currentUser: Customer | null;
  setCurrentUser: (user: Customer | null) => void;
  loginAs: (email: string) => boolean;
  registerUser: (name: string, email: string, phone: string) => void;
  logout: () => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalMode: 'login' | 'register';
  setAuthModalMode: (mode: 'login' | 'register') => void;

  // Transactions & Hubs
  transactions: Transaction[];
  hubs: HubLocation[];
  blockedDates: BlockedDateRange[];
  addBlockedDate: (block: Omit<BlockedDateRange, 'id'>) => void;
  deleteBlockedDate: (id: string) => void;

  // Pricing & Settings
  weekendSurgePercent: number;
  setWeekendSurgePercent: (val: number) => void;
  gstRate: number;
  setGstRate: (val: number) => void;

  // Notifications
  notifications: NotificationItem[];
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  addNotification: (title: string, message: string, type: 'info' | 'success' | 'alert') => void;

  // Utility helpers
  formatCurrency: (amount: number) => string;
  formatDisplayDate: (dateStr: string) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<'customer' | 'admin'>('customer');
  const [customerScreen, setCustomerScreen] = useState<CustomerScreen>('home');
  const [adminScreen, setAdminScreen] = useState<AdminScreen>('overview');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>('veh-car-01');

  // Search defaults
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({
    type: 'all',
    location: 'Indiranagar Hub, Bengaluru',
    pickupDate: '2026-11-04',
    pickupTime: '09:00',
    returnDate: '2026-11-06',
    returnTime: '18:00',
  });

  // Data states initialized from LocalStorage or Defaults
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    const saved = localStorage.getItem('rr_vehicles');
    return saved ? JSON.parse(saved) : INITIAL_VEHICLES;
  });

  const [bookings, setBookings] = useState<Booking[]>(() => {
    const saved = localStorage.getItem('rr_bookings');
    return saved ? JSON.parse(saved) : INITIAL_BOOKINGS;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('rr_customers');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('rr_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [hubs] = useState<HubLocation[]>(INITIAL_HUBS);
  const [blockedDates, setBlockedDates] = useState<BlockedDateRange[]>(INITIAL_BLOCKED_DATES);

  // Settings
  const [weekendSurgePercent, setWeekendSurgePercent] = useState<number>(15);
  const [gstRate, setGstRate] = useState<number>(18);

  // Auth
  const [currentUser, setCurrentUser] = useState<Customer | null>(INITIAL_CUSTOMERS[0]); // Default to Rohan
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  // Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      title: 'New Booking Submitted',
      message: 'Booking RR-8921 for Hyundai Creta SX (O) requires licence review.',
      timestamp: '10 mins ago',
      read: false,
      type: 'info',
    },
    {
      id: 'notif-2',
      title: 'Payment Confirmed',
      message: 'Payment of ₹4,295 received for Booking RR-8914 (Royal Enfield).',
      timestamp: '2 hrs ago',
      read: false,
      type: 'success',
    },
  ]);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('rr_vehicles', JSON.stringify(vehicles));
  }, [vehicles]);

  useEffect(() => {
    localStorage.setItem('rr_bookings', JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem('rr_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('rr_transactions', JSON.stringify(transactions));
  }, [transactions]);

  const addNotification = (title: string, message: string, type: 'info' | 'success' | 'alert') => {
    const newNotif: NotificationItem = {
      id: 'notif-' + Date.now(),
      title,
      message,
      timestamp: 'Just now',
      read: false,
      type,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const triggerSearch = (criteria: Partial<SearchCriteria>) => {
    setSearchCriteria((prev) => ({ ...prev, ...criteria }));
    setCustomerScreen('explore');
  };

  const getVehicleById = (id: string) => {
    return vehicles.find((v) => v.id === id);
  };

  const addVehicle = (newVeh: Omit<Vehicle, 'id'>) => {
    const created: Vehicle = {
      ...newVeh,
      id: `veh-${newVeh.type}-${Date.now().toString().slice(-4)}`,
    };
    setVehicles((prev) => [created, ...prev]);
    addNotification('Fleet Updated', `${created.name} was added to the fleet.`, 'success');
  };

  const updateVehicle = (id: string, updates: Partial<Vehicle>) => {
    setVehicles((prev) =>
      prev.map((v) => (v.id === id ? { ...v, ...updates } : v))
    );
  };

  const deleteVehicle = (id: string) => {
    const veh = vehicles.find((v) => v.id === id);
    setVehicles((prev) => prev.filter((v) => v.id !== id));
    if (veh) {
      addNotification('Fleet Updated', `${veh.name} was removed from the fleet.`, 'alert');
    }
  };

  const createBooking = (newBookingData: Omit<Booking, 'id' | 'createdAt' | 'statusHistory'>): string => {
    const id = `RR-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    const formattedNow = `${now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const newBooking: Booking = {
      ...newBookingData,
      id,
      createdAt: formattedNow,
      pickupOtp: Math.floor(1000 + Math.random() * 9000).toString(),
      returnOtp: Math.floor(1000 + Math.random() * 9000).toString(),
      statusHistory: [
        {
          status: newBookingData.bookingStatus,
          timestamp: formattedNow,
          note: 'Booking requested by customer. Verification queue assigned.',
        },
      ],
    };

    setBookings((prev) => [newBooking, ...prev]);

    // Update customer stats
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === newBooking.customerId
          ? {
              ...c,
              totalBookings: c.totalBookings + 1,
              licenceStatus: newBooking.licenceStatus,
            }
          : c
      )
    );

    addNotification(
      'New Booking Received',
      `Booking ${id} submitted for ${newBooking.vehicleName}.`,
      'info'
    );

    return id;
  };

  const approveBooking = (bookingId: string) => {
    const now = new Date();
    const formattedNow = `${now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === bookingId) {
          return {
            ...b,
            bookingStatus: 'approved',
            licenceStatus: 'verified',
            statusHistory: [
              {
                status: 'approved',
                timestamp: formattedNow,
                note: 'Driving licence documents verified by Fleet Administrator. Approved for payment.',
              },
              ...b.statusHistory,
            ],
          };
        }
        return b;
      })
    );

    // Update customer licence to verified
    const booking = bookings.find((b) => b.id === bookingId);
    if (booking) {
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === booking.customerId ? { ...c, licenceStatus: 'verified' } : c
        )
      );
    }

    addNotification(
      'Booking Approved',
      `Booking ${bookingId} approved. Customer can proceed to payment.`,
      'success'
    );
  };

  const rejectBooking = (bookingId: string, reason: string) => {
    const now = new Date();
    const formattedNow = `${now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === bookingId) {
          return {
            ...b,
            bookingStatus: 'rejected',
            licenceStatus: 'rejected',
            rejectionReason: reason,
            statusHistory: [
              {
                status: 'rejected',
                timestamp: formattedNow,
                note: `Booking rejected by administrator: ${reason}`,
              },
              ...b.statusHistory,
            ],
          };
        }
        return b;
      })
    );

    addNotification(
      'Booking Rejected',
      `Booking ${bookingId} was marked as rejected (${reason}).`,
      'alert'
    );
  };

  const payBooking = (
    bookingId: string,
    paymentMethod: 'UPI' | 'Credit Card' | 'Debit Card' | 'NetBanking'
  ) => {
    const now = new Date();
    const formattedNow = `${now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    let targetBooking: Booking | undefined;

    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === bookingId) {
          targetBooking = b;
          return {
            ...b,
            bookingStatus: 'confirmed',
            paymentStatus: 'paid',
            statusHistory: [
              {
                status: 'confirmed',
                timestamp: formattedNow,
                note: `Payment of ₹${b.totalAmount.toLocaleString('en-IN')} received via ${paymentMethod}. Vehicle confirmed with Digital Pickup Pass.`,
              },
              ...b.statusHistory,
            ],
          };
        }
        return b;
      })
    );

    // Create transaction ledger entry
    if (targetBooking) {
      const txnId = `TXN-${Math.floor(10000 + Math.random() * 90000)}`;
      const newTxn: Transaction = {
        id: txnId,
        bookingId: targetBooking.id,
        customerName: targetBooking.customerName,
        customerEmail: targetBooking.customerEmail,
        amount: targetBooking.totalAmount,
        paymentMethod,
        transactionDate: formattedNow,
        status: 'success',
        type: 'rental_charge',
      };
      setTransactions((prev) => [newTxn, ...prev]);

      // Update customer total spending
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === targetBooking!.customerId
            ? { ...c, totalSpent: c.totalSpent + targetBooking!.totalAmount }
            : c
        )
      );

      // Set vehicle to booked status
      updateVehicle(targetBooking.vehicleId, { status: 'booked' });
    }

    addNotification(
      'Payment Received',
      `₹${targetBooking?.totalAmount.toLocaleString('en-IN') || ''} confirmed for Booking ${bookingId}.`,
      'success'
    );
  };

  const cancelBooking = (bookingId: string) => {
    const now = new Date();
    const formattedNow = `${now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === bookingId) {
          // make vehicle available again
          updateVehicle(b.vehicleId, { status: 'available' });
          return {
            ...b,
            bookingStatus: 'cancelled',
            paymentStatus: b.paymentStatus === 'paid' ? 'refunded' : 'pending',
            statusHistory: [
              {
                status: 'cancelled',
                timestamp: formattedNow,
                note: 'Booking cancelled by customer. Refund initiated per policy.',
              },
              ...b.statusHistory,
            ],
          };
        }
        return b;
      })
    );

    addNotification(
      'Booking Cancelled',
      `Booking ${bookingId} was cancelled.`,
      'info'
    );
  };

  const completeBooking = (bookingId: string) => {
    const now = new Date();
    const formattedNow = `${now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === bookingId) {
          updateVehicle(b.vehicleId, { status: 'available' });
          return {
            ...b,
            bookingStatus: 'completed',
            statusHistory: [
              {
                status: 'completed',
                timestamp: formattedNow,
                note: 'Vehicle returned in inspected condition. Security deposit refund initiated.',
              },
              ...b.statusHistory,
            ],
          };
        }
        return b;
      })
    );

    addNotification('Rental Completed', `Booking ${bookingId} completed successfully.`, 'success');
  };

  const verifyLicence = (customerId: string, status: 'verified' | 'rejected') => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === customerId ? { ...c, licenceStatus: status } : c))
    );
    // Also update any pending bookings for this customer
    setBookings((prev) =>
      prev.map((b) => (b.customerId === customerId ? { ...b, licenceStatus: status } : b))
    );
  };

  const addBlockedDate = (block: Omit<BlockedDateRange, 'id'>) => {
    const id = `block-${Date.now().toString().slice(-4)}`;
    setBlockedDates((prev) => [...prev, { ...block, id }]);
  };

  const deleteBlockedDate = (id: string) => {
    setBlockedDates((prev) => prev.filter((b) => b.id !== id));
  };

  const loginAs = (email: string): boolean => {
    const user = customers.find((c) => c.email.toLowerCase() === email.toLowerCase());
    if (user) {
      setCurrentUser(user);
      setIsAuthModalOpen(false);
      return true;
    }
    return false;
  };

  const registerUser = (name: string, email: string, phone: string) => {
    const newUser: Customer = {
      id: `cust-${Math.floor(100 + Math.random() * 900)}`,
      name,
      email,
      phone,
      joinedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      licenceStatus: 'unverified',
      totalBookings: 0,
      totalSpent: 0,
      status: 'active',
      rating: 5.0,
    };
    setCustomers((prev) => [newUser, ...prev]);
    setCurrentUser(newUser);
    setIsAuthModalOpen(false);
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const formatCurrency = (val: number) => {
    return '₹' + Math.round(val).toLocaleString('en-IN');
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  return (
    <AppContext.Provider
      value={{
        mode,
        setMode,
        customerScreen,
        setCustomerScreen,
        adminScreen,
        setAdminScreen,
        selectedVehicleId,
        setSelectedVehicleId,
        searchCriteria,
        setSearchCriteria,
        triggerSearch,
        vehicles,
        addVehicle,
        updateVehicle,
        deleteVehicle,
        getVehicleById,
        bookings,
        createBooking,
        approveBooking,
        rejectBooking,
        payBooking,
        cancelBooking,
        completeBooking,
        verifyLicence,
        customers,
        currentUser,
        setCurrentUser,
        loginAs,
        registerUser,
        logout,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalMode,
        setAuthModalMode,
        transactions,
        hubs,
        blockedDates,
        addBlockedDate,
        deleteBlockedDate,
        weekendSurgePercent,
        setWeekendSurgePercent,
        gstRate,
        setGstRate,
        notifications,
        markNotificationRead,
        clearNotifications,
        addNotification,
        formatCurrency,
        formatDisplayDate,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
