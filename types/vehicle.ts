export type VehicleType = 'car' | 'bike';

export type CarCategory =
  | 'Hatchback'
  | 'Sedan'
  | 'SUV'
  | 'Family MPV'
  | 'Luxury'
  | 'Electric SUV';

export type BikeCategory =
  | 'Family & Commuter'
  | 'City & Street'
  | 'Touring & Highway'
  | 'Scooter'
  | 'Scrambler'
  | 'Cruiser'
  | 'Naked Sport'
  | 'Adventure';

export type VehicleCategory = CarCategory | BikeCategory;

export type TransmissionType = 'Manual' | 'Automatic';
export type FuelType = 'Petrol' | 'Diesel' | 'Electric' | 'Hybrid';

export type VehicleStatus = 'available' | 'booked' | 'rented' | 'maintenance' | 'inactive';

export interface Vehicle {
  id: string;
  slug?: string;
  name: string;
  brand: string;
  model: string;
  variant: string;
  year: number;
  type: VehicleType;
  category: VehicleCategory;
  bodyType?: string;
  bikeSegment?: string;
  registrationNumber: string;
  transmission: TransmissionType;
  fuelType: FuelType;
  seatingCapacity?: number; // for cars
  engineCapacity?: string; // for bikes
  mileage: string;
  pricePerDay: number; // in INR
  weekendPrice?: number;
  securityDeposit: number; // in INR
  rating: number;
  reviewCount: number;
  images: string[];
  coverImage: string;
  location: string;
  pickupLocationId?: string;
  description: string;
  features: string[];
  status: VehicleStatus;
  minRentalHours: number;
  odometer: number; // in km
  isActive: boolean;
}
