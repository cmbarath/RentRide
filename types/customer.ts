import { LicenceVerificationStatus } from './booking';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  role?: 'customer' | 'admin' | 'fleet_manager';
  joinedDate: string;
  licenceStatus: LicenceVerificationStatus;
  licenceNumber?: string;
  licenceFront?: string;
  licenceBack?: string;
  rejectionReason?: string;
  totalBookings: number;
  totalSpent: number;
  status: 'active' | 'suspended';
  avatar?: string;
  rating: number;
}
