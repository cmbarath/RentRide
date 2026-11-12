export * from './vehicle';
export * from './booking';
export * from './payment';
export * from './customer';

export interface HubLocation {
  id: string;
  cityId?: string;
  areaName?: string;
  name: string;
  city: string;
  address: string;
  landmark?: string;
  pincode?: string;
  operatingHours: string;
  contactNumber: string;
  vehiclesAvailable: number;
  isActive?: boolean;
}

export interface BlockedDateRange {
  id: string;
  vehicleId: string;
  startDate: string;
  endDate: string;
  reason: 'maintenance' | 'vip_reservation' | 'inspection' | 'relocation';
  notes: string;
}

export interface PricingRuleConfig {
  id?: string;
  ruleName: string;
  targetType?: string;
  weekendSurgePercent: number;
  gstPercentage: number;
  doorstepDeliveryFee: number;
  carInsuranceFee: number;
  bikeInsuranceFee: number;
  isActive: boolean;
}

export interface PublicReviewItem {
  id: string;
  booking_id: string;
  vehicle_id: string;
  user_name: string;
  rating: number;
  comment: string;
  is_approved: boolean;
  created_at: string;
}
