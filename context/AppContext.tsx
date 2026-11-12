'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Vehicle,
  Booking,
  Customer,
  Transaction,
  HubLocation,
  BlockedDateRange,
  VehicleType,
  PricingRuleConfig,
  PublicReviewItem,
} from '@/types';
import { SEED_VEHICLES } from '@/lib/seed-catalog';
import { getAllTNHubs, DEFAULT_TN_HUB } from '@/lib/tn-locations';
import { calculateBookingPrice, formatINR } from '@/lib/pricing/calculator';
import {
  signUpWithEmail,
  signInWithEmail,
  signOutUser,
  sendPasswordResetEmail,
  resendVerificationEmail,
  getCurrentUserProfile,
} from '@/lib/supabase/auth';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

export type CustomerScreen = 'home' | 'explore' | 'detail' | 'checkout' | 'dashboard';
export type AdminScreen =
  | 'overview'
  | 'bookings'
  | 'vehicles'
  | 'pricing'
  | 'customers'
  | 'payments'
  | 'locations'
  | 'reviews'
  | 'availability'
  | 'settings';

export type AuthModalMode = 'login' | 'register' | 'forgot-password' | 'admin-login';

export interface SearchCriteria {
  type: 'all' | VehicleType;
  category?: string;
  city: string;
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

export interface ApiActionResult {
  success: boolean;
  error?: string;
  data?: any;
}

function getDefaultDates() {
  const start = new Date();
  start.setDate(start.getDate() + 2);
  const end = new Date(start);
  end.setDate(end.getDate() + 3);
  return {
    pickupDate: start.toISOString().slice(0, 10),
    returnDate: end.toISOString().slice(0, 10),
  };
}

interface AppContextType {
  mode: 'customer' | 'admin';
  setMode: (mode: 'customer' | 'admin') => void;
  customerScreen: CustomerScreen;
  setCustomerScreen: (screen: CustomerScreen) => void;
  adminScreen: AdminScreen;
  setAdminScreen: (screen: AdminScreen) => void;
  selectedVehicleId: string | null;
  setSelectedVehicleId: (id: string | null) => void;

  searchCriteria: SearchCriteria;
  setSearchCriteria: React.Dispatch<React.SetStateAction<SearchCriteria>>;
  triggerSearch: (criteria: Partial<SearchCriteria>) => void;

  vehicles: Vehicle[];
  isVehiclesLoading: boolean;
  refreshVehicles: (includeInactive?: boolean) => Promise<void>;
  addVehicle: (vehicle: Omit<Vehicle, 'id'>) => Promise<ApiActionResult>;
  updateVehicle: (id: string, updates: Partial<Vehicle>) => Promise<ApiActionResult>;
  deleteVehicle: (id: string) => Promise<ApiActionResult>;
  getVehicleById: (id: string) => Vehicle | undefined;

  bookings: Booking[];
  refreshBookings: () => Promise<void>;
  submitBookingToApi: (payload: {
    vehicleId: string;
    pickupDate: string;
    pickupTime: string;
    returnDate: string;
    returnTime: string;
    pickupLocation: string;
    pickupLocationId?: string;
    returnLocation: string;
    deliveryType: 'hub' | 'doorstep';
    deliveryAddress?: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    licenceNumber?: string;
    licenceFrontImage?: string;
    licenceBackImage?: string;
  }) => Promise<{ success: boolean; bookingId?: string; pickupOtp?: string; booking?: Booking; error?: string }>;
  approveBooking: (bookingId: string) => Promise<ApiActionResult>;
  rejectBooking: (bookingId: string, reason: string) => Promise<ApiActionResult>;
  activateBooking: (bookingId: string) => Promise<ApiActionResult>;
  cancelBooking: (bookingId: string, reason?: string) => Promise<ApiActionResult>;
  completeBooking: (bookingId: string) => Promise<ApiActionResult>;
  verifyLicence: (customerId: string, status: 'verified' | 'rejected', reason?: string) => Promise<ApiActionResult>;

  customers: Customer[];
  currentUser: Customer | null;
  setCurrentUser: (user: Customer | null) => void;
  loginAs: (email: string) => boolean;
  registerUser: (name: string, email: string, phone: string) => void;
  logout: () => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalMode: AuthModalMode;
  setAuthModalMode: (mode: AuthModalMode) => void;

  signInWithSupabase: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string; role?: string; needsEmailVerification?: boolean }>;
  signUpWithSupabase: (params: {
    email: string;
    password: string;
    fullName: string;
    phone: string;
  }) => Promise<{ success: boolean; error?: string; requiresEmailConfirmation?: boolean }>;
  resendVerificationWithSupabase: (email: string) => Promise<{ success: boolean; error?: string }>;
  resetPasswordWithSupabase: (email: string) => Promise<{ success: boolean; error?: string }>;
  signOutWithSupabase: () => Promise<void>;
  updateCustomerProfile: (updates: {
    fullName: string;
    phone: string;
  }) => Promise<{ success: boolean; error?: string }>;
  refreshCurrentSessionData: () => Promise<void>;
  isAuthLoading: boolean;
  authNotice: { type: 'success' | 'error' | 'info'; message: string } | null;
  clearAuthNotice: () => void;
  isSupabaseActive: boolean;

  transactions: Transaction[];
  recordCounterPayment: (payload: {
    bookingId: string;
    amount: number;
    paymentMethod: 'UPI' | 'Credit Card' | 'Debit Card' | 'NetBanking' | 'Cash';
    type?: 'rental_charge' | 'security_deposit' | 'deposit_refund' | 'cancellation_refund' | 'late_fee';
    referenceNote?: string;
  }) => Promise<ApiActionResult>;
  refreshPayments: () => Promise<void>;

  hubs: HubLocation[];
  refreshLocations: () => Promise<void>;

  blockedDates: BlockedDateRange[];
  addBlockedDate: (block: Omit<BlockedDateRange, 'id'>) => Promise<ApiActionResult>;
  updateBlockedDate: (
    id: string,
    updates: Partial<Omit<BlockedDateRange, 'id' | 'vehicleId'>> & { isCompleted?: boolean }
  ) => Promise<ApiActionResult>;
  deleteBlockedDate: (id: string) => Promise<ApiActionResult>;

  pricingRule: PricingRuleConfig;
  refreshPricingRules: () => Promise<void>;
  weekendSurgePercent: number;
  setWeekendSurgePercent: (val: number) => void;
  gstRate: number;
  setGstRate: (val: number) => void;

  publicReviews: PublicReviewItem[];
  refreshPublicReviews: () => Promise<void>;

  notifications: NotificationItem[];
  markNotificationRead: (id: string) => Promise<void>;
  clearNotifications: () => void;
  addNotification: (title: string, message: string, type: 'info' | 'success' | 'alert') => void;
  refreshAdminNotifications: () => Promise<void>;

  formatCurrency: (amount: number) => string;
  formatDisplayDate: (dateStr: string) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_PRICING_RULE: PricingRuleConfig = {
  ruleName: 'Tamil Nadu Standard Statutory Pricing',
  targetType: 'all',
  weekendSurgePercent: 15,
  gstPercentage: 18,
  doorstepDeliveryFee: 299,
  carInsuranceFee: 499,
  bikeInsuranceFee: 199,
  isActive: true,
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<'customer' | 'admin'>('customer');
  const [customerScreen, setCustomerScreen] = useState<CustomerScreen>('home');
  const [adminScreen, setAdminScreen] = useState<AdminScreen>('overview');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  const defaults = useMemo(() => getDefaultDates(), []);
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({
    type: 'all',
    category: 'all',
    city: 'chennai',
    location: DEFAULT_TN_HUB.displayName,
    pickupDate: defaults.pickupDate,
    pickupTime: '09:00',
    returnDate: defaults.returnDate,
    returnTime: '18:00',
  });

  const isSupabaseActive = useMemo(() => isSupabaseConfigured(), []);

  // Production vehicles hydrated strictly from PostgreSQL via GET /api/vehicles
  const [vehicles, setVehicles] = useState<Vehicle[]>(() =>
    isSupabaseConfigured() ? [] : SEED_VEHICLES
  );
  const [isVehiclesLoading, setIsVehiclesLoading] = useState<boolean>(isSupabaseActive);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [hubs, setHubs] = useState<HubLocation[]>(() =>
    isSupabaseConfigured()
      ? []
      : getAllTNHubs().map((h) => ({
          id: h.id,
          cityId: h.cityId,
          areaName: h.areaName,
          name: h.displayName,
          city: h.cityName,
          address: h.address,
          operatingHours: h.operatingHours,
          contactNumber: h.contactNumber,
          vehiclesAvailable: 0,
          isActive: true,
        }))
  );
  const [blockedDates, setBlockedDates] = useState<BlockedDateRange[]>([]);
  const [pricingRule, setPricingRule] = useState<PricingRuleConfig>(DEFAULT_PRICING_RULE);
  const [weekendSurgePercent, setWeekendSurgePercent] = useState<number>(15);
  const [gstRate, setGstRate] = useState<number>(18);
  const [publicReviews, setPublicReviews] = useState<PublicReviewItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const [currentUser, setCurrentUser] = useState<Customer | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(isSupabaseActive);
  const [authNotice, setAuthNotice] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthModalMode>('login');

  const clearAuthNotice = () => setAuthNotice(null);

  const refreshVehicles = useCallback(async (includeInactive = false) => {
    if (!isSupabaseConfigured()) return;
    setIsVehiclesLoading(true);
    try {
      const qs = includeInactive ? '?includeInactive=true' : '';
      const res = await fetch(`/api/vehicles${qs}`, { credentials: 'include' });
      const data = await res.json();
      if (res.ok && Array.isArray(data.vehicles)) {
        setVehicles(data.vehicles);
        setSelectedVehicleId((prev) => prev || data.vehicles[0]?.id || null);
      }
    } catch (err) {
      console.error('Failed to refresh vehicles from database:', err);
    } finally {
      setIsVehiclesLoading(false);
    }
  }, []);

  const refreshLocations = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    try {
      const res = await fetch('/api/locations?activeOnly=false', { credentials: 'include' });
      const data = await res.json();
      if (res.ok && Array.isArray(data.locations)) {
        const mapped: HubLocation[] = data.locations.map((loc: any) => ({
          id: loc.id,
          cityId: loc.cityId,
          areaName: loc.areaName,
          name: loc.displayName,
          city: loc.cityName,
          address: loc.address,
          landmark: loc.landmark,
          pincode: loc.pincode,
          operatingHours: loc.operatingHours,
          contactNumber: loc.contactNumber,
          vehiclesAvailable: 0,
          isActive: loc.isActive ?? true,
        }));
        setHubs(mapped);
      }
    } catch (err) {
      console.error('Failed to refresh locations:', err);
    }
  }, []);

  const refreshPricingRules = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    try {
      const res = await fetch('/api/pricing/rules', { credentials: 'include' });
      const data = await res.json();
      if (res.ok && Array.isArray(data.rules) && data.rules.length > 0) {
        const active = data.rules.find((r: any) => r.is_active) || data.rules[0];
        const nextRule: PricingRuleConfig = {
          id: active.id,
          ruleName: active.rule_name || 'Tamil Nadu Standard Statutory Pricing',
          targetType: active.target_type || 'all',
          weekendSurgePercent: Number(active.weekend_surge_percent ?? 15),
          gstPercentage: Number(active.gst_percentage ?? 18),
          doorstepDeliveryFee: Number(active.doorstep_delivery_fee ?? 299),
          carInsuranceFee: Number(active.car_insurance_fee ?? 499),
          bikeInsuranceFee: Number(active.bike_insurance_fee ?? 199),
          isActive: Boolean(active.is_active ?? true),
        };
        setPricingRule(nextRule);
        setWeekendSurgePercent(nextRule.weekendSurgePercent);
        setGstRate(nextRule.gstPercentage);
      }
    } catch (err) {
      console.error('Failed to load pricing rules:', err);
    }
  }, []);

  const refreshPublicReviews = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    try {
      const res = await fetch('/api/reviews', { credentials: 'include' });
      const data = await res.json();
      if (res.ok && Array.isArray(data.reviews)) {
        setPublicReviews(data.reviews);
      }
    } catch (err) {
      console.error('Failed to fetch approved reviews:', err);
    }
  }, []);

  const refreshPayments = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    try {
      const res = await fetch('/api/payments', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.transactions)) {
          setTransactions(data.transactions);
        }
      }
    } catch (err) {
      console.error('Failed to fetch payment ledger:', err);
    }
  }, []);

  const refreshAdminNotifications = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    try {
      const res = await fetch('/api/notifications?recipient=fleet-admin', {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.notifications)) {
          setNotifications(
            data.notifications.map((n: any) => ({
              id: n.id,
              title: n.title || 'Fleet Notification',
              message: n.message_payload,
              timestamp: n.created_at
                ? new Date(n.created_at).toLocaleString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Recent',
              read: Boolean(n.is_read),
              type: 'info',
            }))
          );
        }
      }
    } catch (err) {
      console.error('Failed to fetch admin notifications:', err);
    }
  }, []);

  const refreshMaintenanceBlocks = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    try {
      const res = await fetch('/api/maintenance', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.blockedDates)) {
          setBlockedDates(data.blockedDates);
        }
      }
    } catch (err) {
      console.error('Failed to fetch maintenance blocks:', err);
    }
  }, []);

  const refreshBookings = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    try {
      const res = await fetch('/api/bookings', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.bookings)) {
          setBookings(data.bookings);
        }
      }
    } catch (err) {
      console.error('Failed to refresh bookings:', err);
    }
  }, []);

  // Recompute per-customer booking stats whenever bookings or customers refresh
  const enrichCustomersWithStats = useCallback((rawCustomers: Customer[], rawBookings: Booking[]) => {
    return rawCustomers.map((c) => {
      const cBookings = rawBookings.filter(
        (b) => b.customerId === c.id || b.customerEmail?.toLowerCase() === c.email?.toLowerCase()
      );
      const totalSpent = cBookings
        .filter((b) => b.paymentStatus === 'paid' || b.paymentStatus === 'success')
        .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
      return {
        ...c,
        totalBookings: cBookings.length,
        totalSpent,
      };
    });
  }, []);

  // Hydrate authenticated user profile & scoped bookings/admin records from server APIs
  const hydrateAuthenticatedUser = useCallback(
    async (userId: string, email?: string, metadata?: any, createdAt?: string) => {
      const profile = await getCurrentUserProfile(userId);
      const resolvedRole: 'customer' | 'admin' | 'fleet_manager' =
        profile?.role === 'admin' || profile?.role === 'fleet_manager' ? profile.role : 'customer';

      const mappedUser: Customer = {
        id: userId,
        name:
          profile?.fullName ||
          metadata?.full_name ||
          metadata?.name ||
          email?.split('@')[0] ||
          'User',
        email: email || profile?.email || '',
        phone: profile?.phone || metadata?.phone || '',
        role: resolvedRole,
        joinedDate: profile?.createdAt
          ? new Date(profile.createdAt).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })
          : createdAt
          ? new Date(createdAt).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })
          : 'Recently',
        licenceStatus: profile?.licenceStatus || 'unverified',
        totalBookings: 0,
        totalSpent: 0,
        status: 'active',
        avatar: profile?.avatarUrl,
        rating: 5.0,
      };

      setCurrentUser(mappedUser);

      try {
        if (resolvedRole === 'admin' || resolvedRole === 'fleet_manager') {
          const [bookingsRes, customersRes] = await Promise.all([
            fetch('/api/bookings', { credentials: 'include' }),
            fetch('/api/customers', { credentials: 'include' }),
          ]);

          let loadedBookings: Booking[] = [];
          if (bookingsRes.ok) {
            const bData = await bookingsRes.json();
            if (Array.isArray(bData.bookings)) {
              loadedBookings = bData.bookings;
              setBookings(loadedBookings);
            }
          }

          if (customersRes.ok) {
            const cData = await customersRes.json();
            if (Array.isArray(cData.customers)) {
              setCustomers(enrichCustomersWithStats(cData.customers, loadedBookings));
            }
          }

          await Promise.all([
            refreshVehicles(true),
            refreshLocations(),
            refreshPayments(),
            refreshAdminNotifications(),
            refreshMaintenanceBlocks(),
          ]);
        } else {
          const meRes = await fetch('/api/customers/me', { credentials: 'include' });
          if (meRes.ok) {
            const meData = await meRes.json();
            if (meData.profile) {
              setCurrentUser((prev) =>
                prev
                  ? {
                      ...prev,
                      ...meData.profile,
                      role: meData.profile.role || resolvedRole,
                    }
                  : meData.profile
              );
            }
            if (Array.isArray(meData.bookings)) {
              setBookings(meData.bookings);
            }
          }
          setCustomers([]);
          setTransactions([]);
          setNotifications([]);
          setBlockedDates([]);
        }
      } catch (err) {
        console.warn('Authenticated hydration warning:', err);
      }

      return mappedUser;
    },
    [
      enrichCustomersWithStats,
      refreshAdminNotifications,
      refreshLocations,
      refreshMaintenanceBlocks,
      refreshPayments,
      refreshVehicles,
    ]
  );

  // URL Auth Callback feedback handling (?verified=true, ?auth_error=..., ?open_auth=...)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const verified = params.get('verified');
    const authError = params.get('auth_error');
    const message = params.get('message');
    const openAuth = params.get('open_auth');

    let changedUrl = false;
    if (verified === 'true') {
      setAuthNotice({
        type: 'success',
        message: 'Email address verified successfully! Your RentRide account is active.',
      });
      changedUrl = true;
    } else if (authError) {
      setAuthNotice({
        type: 'error',
        message:
          message ||
          'Verification link has expired or is invalid. Please request a new confirmation email.',
      });
      changedUrl = true;
    }

    if (openAuth === 'login' || openAuth === 'register' || openAuth === 'forgot-password') {
      setAuthModalMode(openAuth);
      setIsAuthModalOpen(true);
      changedUrl = true;
    }

    if (changedUrl) {
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    }
  }, []);

  // Supabase Auth and Public Fleet Data Synchronization
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setIsAuthLoading(false);
      setIsVehiclesLoading(false);
      return;
    }
    const supabase = createClient();
    let mounted = true;

    // Clear any legacy localStorage caches
    if (typeof window !== 'undefined') {
      localStorage.removeItem('rr_vehicles_v2');
      localStorage.removeItem('rr_bookings_v2');
      localStorage.removeItem('rr_customers_v2');
      localStorage.removeItem('rr_transactions_v2');
    }

    // Load public fleet catalog, hubs, pricing rules, and approved reviews immediately
    refreshVehicles();
    refreshLocations();
    refreshPricingRules();
    refreshPublicReviews();

    // 1. Server-verified initial auth check via supabase.auth.getUser()
    supabase.auth
      .getUser()
      .then(async ({ data: { user }, error }) => {
        if (!mounted) return;
        if (!error && user) {
          await hydrateAuthenticatedUser(user.id, user.email, user.user_metadata, user.created_at);
        } else {
          setCurrentUser(null);
          setBookings([]);
          setCustomers([]);
          setTransactions([]);
        }
      })
      .finally(() => {
        if (mounted) setIsAuthLoading(false);
      });

    // 2. Realtime Auth State synchronization
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (event === 'SIGNED_OUT' || !session?.user) {
        setCurrentUser(null);
        setBookings([]);
        setCustomers([]);
        setTransactions([]);
        setNotifications([]);
        setBlockedDates([]);
        setMode('customer');
        setCustomerScreen((prev) => (prev === 'dashboard' || prev === 'checkout' ? 'home' : prev));
        return;
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user && mounted) {
          await hydrateAuthenticatedUser(user.id, user.email, user.user_metadata, user.created_at);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [
    hydrateAuthenticatedUser,
    refreshLocations,
    refreshPricingRules,
    refreshPublicReviews,
    refreshVehicles,
  ]);

  const refreshCurrentSessionData = useCallback(async () => {
    if (!currentUser) return;
    await hydrateAuthenticatedUser(currentUser.id, currentUser.email);
  }, [currentUser, hydrateAuthenticatedUser]);

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

  const markNotificationRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    if (isSupabaseConfigured()) {
      try {
        await fetch(`/api/notifications/${id}/read`, {
          method: 'PATCH',
          credentials: 'include',
        });
      } catch (err) {
        console.warn('Mark notification read error:', err);
      }
    }
  };

  const clearNotifications = () => {
    const unread = notifications.filter((n) => !n.read);
    unread.forEach((n) => {
      markNotificationRead(n.id);
    });
  };

  const triggerSearch = (criteria: Partial<SearchCriteria>) => {
    setSearchCriteria((prev) => ({
      ...prev,
      ...criteria,
      category: criteria.category !== undefined ? criteria.category : 'all',
    }));
    setCustomerScreen('explore');
  };

  const getVehicleById = (id: string) => {
    return vehicles.find((v) => v.id === id || v.slug === id);
  };

  // --- VEHICLE MUTATIONS (API -> PostgreSQL) ---
  const addVehicle = async (newVeh: Omit<Vehicle, 'id'>): Promise<ApiActionResult> => {
    try {
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newVeh),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to add vehicle to fleet.' };
      }
      await refreshVehicles(true);
      return { success: true, data: data.vehicle };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error adding vehicle.' };
    }
  };

  const updateVehicle = async (id: string, updates: Partial<Vehicle>): Promise<ApiActionResult> => {
    try {
      const res = await fetch(`/api/vehicles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to update vehicle.' };
      }
      await refreshVehicles(true);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error updating vehicle.' };
    }
  };

  const deleteVehicle = async (id: string): Promise<ApiActionResult> => {
    try {
      const res = await fetch(`/api/vehicles/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to deactivate vehicle.' };
      }
      await refreshVehicles(true);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error removing vehicle.' };
    }
  };

  // --- BOOKING & PAYMENT MUTATIONS (API -> PostgreSQL) ---
  const submitBookingToApi = async (payload: {
    vehicleId: string;
    pickupDate: string;
    pickupTime: string;
    returnDate: string;
    returnTime: string;
    pickupLocation: string;
    pickupLocationId?: string;
    returnLocation: string;
    deliveryType: 'hub' | 'doorstep';
    deliveryAddress?: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    licenceNumber?: string;
    licenceFrontImage?: string;
    licenceBackImage?: string;
  }) => {
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Booking submission failed.' };
      }

      if (currentUser) {
        await hydrateAuthenticatedUser(currentUser.id, currentUser.email);
      }

      return {
        success: true,
        bookingId: data.bookingId,
        pickupOtp: data.pickupOtp,
        booking: data.booking,
      };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error submitting booking.' };
    }
  };

  const runBookingAction = async (
    bookingId: string,
    action: 'approve' | 'reject' | 'cancel' | 'activate' | 'complete',
    reason?: string
  ): Promise<ApiActionResult> => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action, reason }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || `Failed to ${action} booking.` };
      }
      if (currentUser) {
        await hydrateAuthenticatedUser(currentUser.id, currentUser.email);
      } else {
        await refreshBookings();
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || `Network error processing ${action}.` };
    }
  };

  const approveBooking = (bookingId: string) => runBookingAction(bookingId, 'approve');
  const rejectBooking = (bookingId: string, reason: string) => runBookingAction(bookingId, 'reject', reason);
  const activateBooking = (bookingId: string) => runBookingAction(bookingId, 'activate');
  const completeBooking = (bookingId: string) => runBookingAction(bookingId, 'complete');
  const cancelBooking = (bookingId: string, reason?: string) => runBookingAction(bookingId, 'cancel', reason);

  const recordCounterPayment = async (payload: {
    bookingId: string;
    amount: number;
    paymentMethod: 'UPI' | 'Credit Card' | 'Debit Card' | 'NetBanking' | 'Cash';
    type?: 'rental_charge' | 'security_deposit' | 'deposit_refund' | 'cancellation_refund' | 'late_fee';
    referenceNote?: string;
  }): Promise<ApiActionResult> => {
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to record counter settlement.' };
      }
      if (currentUser) {
        await hydrateAuthenticatedUser(currentUser.id, currentUser.email);
      } else {
        await refreshPayments();
      }
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error recording settlement.' };
    }
  };

  const verifyLicence = async (
    customerId: string,
    status: 'verified' | 'rejected',
    reason?: string
  ): Promise<ApiActionResult> => {
    try {
      const res = await fetch(`/api/customers/${customerId}/licence`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          status,
          reason: status === 'rejected' ? reason || 'Rejected during admin KYC review' : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to update licence KYC status.' };
      }
      if (currentUser) {
        await hydrateAuthenticatedUser(currentUser.id, currentUser.email);
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error verifying KYC.' };
    }
  };

  const addBlockedDate = async (block: Omit<BlockedDateRange, 'id'>): Promise<ApiActionResult> => {
    try {
      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(block),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to add maintenance block.' };
      }
      await refreshMaintenanceBlocks();
      return { success: true, data: data.block };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error creating block.' };
    }
  };

  const updateBlockedDate = async (
    id: string,
    updates: Partial<Omit<BlockedDateRange, 'id' | 'vehicleId'>> & { isCompleted?: boolean }
  ): Promise<ApiActionResult> => {
    try {
      const res = await fetch(`/api/maintenance/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to update maintenance block.' };
      }
      await refreshMaintenanceBlocks();
      return { success: true, data: data.block };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error updating block.' };
    }
  };

  const deleteBlockedDate = async (id: string): Promise<ApiActionResult> => {
    try {
      const res = await fetch(`/api/maintenance/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to remove maintenance block.' };
      }
      await refreshMaintenanceBlocks();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error deleting block.' };
    }
  };

  // Disabled passwordless sandbox login bypasses
  const loginAs = (_email: string): boolean => false;
  const registerUser = (_name: string, _email: string, _phone: string) => {};

  const clearAuthClientState = () => {
    setCurrentUser(null);
    setBookings([]);
    setCustomers([]);
    setTransactions([]);
    setNotifications([]);
    setBlockedDates([]);
    setMode('customer');
    setCustomerScreen((prev) => (prev === 'dashboard' || prev === 'checkout' ? 'home' : prev));
  };

  const logout = () => {
    if (isSupabaseConfigured()) {
      signOutUser().catch(console.error);
    }
    clearAuthClientState();
  };

  const signInWithSupabase = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string; role?: string; needsEmailVerification?: boolean }> => {
    if (!isSupabaseConfigured()) {
      return {
        success: false,
        error: 'Supabase authentication is not configured. Please check .env.local.',
      };
    }

    const res = await signInWithEmail(email, password);
    if (res.error) {
      return {
        success: false,
        error: res.error,
        needsEmailVerification: res.needsEmailVerification,
      };
    }

    if (res.user) {
      const mapped = await hydrateAuthenticatedUser(
        res.user.id,
        res.user.email,
        res.user.user_metadata,
        res.user.created_at
      );
      return { success: true, role: mapped.role || 'customer' };
    }

    return { success: false, error: 'Authentication could not be verified.' };
  };

  const signUpWithSupabase = async (params: {
    email: string;
    password: string;
    fullName: string;
    phone: string;
  }): Promise<{ success: boolean; error?: string; requiresEmailConfirmation?: boolean }> => {
    if (!isSupabaseConfigured()) {
      return {
        success: false,
        error: 'Supabase authentication is not configured. Please check .env.local.',
      };
    }

    const res = await signUpWithEmail(params);
    if (res.error) {
      return { success: false, error: res.error };
    }

    if (res.session?.user) {
      await hydrateAuthenticatedUser(
        res.session.user.id,
        res.session.user.email,
        res.session.user.user_metadata,
        res.session.user.created_at
      );
    }

    return {
      success: true,
      requiresEmailConfirmation: Boolean(res.requiresEmailConfirmation),
    };
  };

  const resendVerificationWithSupabase = async (
    email: string
  ): Promise<{ success: boolean; error?: string }> => {
    return await resendVerificationEmail(email);
  };

  const resetPasswordWithSupabase = async (
    email: string
  ): Promise<{ success: boolean; error?: string }> => {
    return await sendPasswordResetEmail(email);
  };

  const signOutWithSupabase = async (): Promise<void> => {
    if (isSupabaseConfigured()) {
      await signOutUser();
    }
    clearAuthClientState();
  };

  const updateCustomerProfile = async (updates: {
    fullName: string;
    phone: string;
  }): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Authentication service is not configured.' };
    }

    try {
      const res = await fetch('/api/customers/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          fullName: updates.fullName.trim(),
          phone: updates.phone.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to update profile.' };
      }

      if (data.profile) {
        setCurrentUser((prev) =>
          prev
            ? {
                ...prev,
                name: data.profile.name || updates.fullName.trim(),
                phone: data.profile.phone || updates.phone.trim(),
              }
            : data.profile
        );
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error updating profile.' };
    }
  };

  // Enrich hubs with dynamic live vehicle counts
  const enrichedHubs = useMemo(() => {
    return hubs.map((h) => ({
      ...h,
      vehiclesAvailable: vehicles.filter(
        (v) =>
          v.status === 'available' &&
          (v.pickupLocationId === h.id ||
            v.location.toLowerCase().includes(h.name.toLowerCase()) ||
            v.location.toLowerCase().includes(h.city.toLowerCase()))
      ).length,
    }));
  }, [hubs, vehicles]);

  const formatCurrency = (amount: number) => formatINR(amount);

  const formatDisplayDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const value: AppContextType = {
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
    isVehiclesLoading,
    refreshVehicles,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    getVehicleById,
    bookings,
    refreshBookings,
    submitBookingToApi,
    approveBooking,
    rejectBooking,
    activateBooking,
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
    signInWithSupabase,
    signUpWithSupabase,
    resendVerificationWithSupabase,
    resetPasswordWithSupabase,
    signOutWithSupabase,
    updateCustomerProfile,
    refreshCurrentSessionData,
    isAuthLoading,
    authNotice,
    clearAuthNotice,
    isSupabaseActive,
    transactions,
    recordCounterPayment,
    refreshPayments,
    hubs: enrichedHubs,
    refreshLocations,
    blockedDates,
    addBlockedDate,
    updateBlockedDate,
    deleteBlockedDate,
    pricingRule,
    refreshPricingRules,
    weekendSurgePercent,
    setWeekendSurgePercent,
    gstRate,
    setGstRate,
    publicReviews,
    refreshPublicReviews,
    notifications,
    markNotificationRead,
    clearNotifications,
    addNotification,
    refreshAdminNotifications,
    formatCurrency,
    formatDisplayDate,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
