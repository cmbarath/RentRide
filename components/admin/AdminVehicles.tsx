'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Vehicle, VehicleType, VehicleStatus, FuelType, TransmissionType, VehicleCategory } from '@/types';
import {
  Car,
  Bike,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Wrench,
  Fuel,
  Gauge,
  Users,
  MapPin,
  X,
  Check,
  Upload,
  Loader2,
} from 'lucide-react';
import { getVehicleImagePath } from '@/lib/vehicle-images';

const CAR_CATEGORIES: VehicleCategory[] = ['Hatchback', 'Sedan', 'SUV', 'Family MPV', 'Luxury', 'Electric SUV'];
const BIKE_CATEGORIES: VehicleCategory[] = [
  'Family & Commuter',
  'City & Street',
  'Touring & Highway',
  'Scooter',
  'Scrambler',
  'Cruiser',
  'Naked Sport',
  'Adventure',
];

export const AdminVehicles: React.FC = () => {
  const {
    vehicles,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    hubs,
    formatCurrency,
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    'all' | 'cars' | 'bikes' | 'available' | 'booked' | 'rented' | 'maintenance'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [deleteConfirmVehicle, setDeleteConfirmVehicle] = useState<Vehicle | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [pageFeedback, setPageFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form Fields
  const [formType, setFormType] = useState<VehicleType>('car');
  const [formName, setFormName] = useState('');
  const [formBrand, setFormBrand] = useState('');
  const [formModel, setFormModel] = useState('');
  const [formVariant, setFormVariant] = useState('');
  const [formYear, setFormYear] = useState(2024);
  const [formRegNo, setFormRegNo] = useState('');
  const [formTransmission, setFormTransmission] = useState<TransmissionType>('Automatic');
  const [formFuel, setFormFuel] = useState<FuelType>('Petrol');
  const [formCategory, setFormCategory] = useState<VehicleCategory>('SUV');
  const [formSeats, setFormSeats] = useState<number>(5);
  const [formEngine, setFormEngine] = useState('1497 cc');
  const [formMileage, setFormMileage] = useState('16.5 km/l');
  const [formPrice, setFormPrice] = useState(2800);
  const [formDeposit, setFormDeposit] = useState(3500);
  const [formPickupLocationId, setFormPickupLocationId] = useState(hubs[0]?.id || 'hub-chn-tnagar');
  const [formLocation, setFormLocation] = useState(hubs[0]?.name ? `${hubs[0].name}, ${hubs[0].city}` : 'T. Nagar Hub, Chennai');
  const [formDescription, setFormDescription] = useState('');
  const [formStatus, setFormStatus] = useState<VehicleStatus>('available');
  const [formCoverImage, setFormCoverImage] = useState('/images/vehicles/cars/hyundai-creta.jpg');

  // Filtered vehicles
  const filteredVehicles = vehicles.filter((v) => {
    if (activeTab === 'cars' && v.type !== 'car') return false;
    if (activeTab === 'bikes' && v.type !== 'bike') return false;
    if (activeTab === 'available' && v.status !== 'available') return false;
    if (activeTab === 'booked' && v.status !== 'booked') return false;
    if (activeTab === 'rented' && v.status !== 'rented') return false;
    if (activeTab === 'maintenance' && v.status !== 'maintenance') return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        v.name.toLowerCase().includes(q) ||
        v.brand.toLowerCase().includes(q) ||
        v.registrationNumber.toLowerCase().includes(q) ||
        v.location.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const openAddModal = () => {
    const defaultHub = hubs.find((h) => h.isActive !== false) || hubs[0];
    setEditingVehicle(null);
    setModalError(null);
    setFormType('car');
    setFormName('');
    setFormBrand('');
    setFormModel('');
    setFormVariant('');
    setFormYear(2024);
    setFormRegNo('');
    setFormTransmission('Automatic');
    setFormFuel('Petrol');
    setFormCategory('SUV');
    setFormSeats(5);
    setFormEngine('1497 cc');
    setFormMileage('16.5 km/l');
    setFormPrice(2800);
    setFormDeposit(3500);
    setFormPickupLocationId(defaultHub?.id || 'hub-chn-tnagar');
    setFormLocation(defaultHub ? `${defaultHub.name}, ${defaultHub.city}` : 'T. Nagar Hub, Chennai');
    setFormDescription('');
    setFormStatus('available');
    setFormCoverImage(getVehicleImagePath('Hyundai Creta', 'car'));
    setIsModalOpen(true);
  };

  const openEditModal = (v: Vehicle) => {
    const matchedHub = hubs.find(
      (h) => h.id === v.pickupLocationId || `${h.name}, ${h.city}` === v.location || h.name === v.location
    );
    setEditingVehicle(v);
    setModalError(null);
    setFormType(v.type);
    setFormName(v.name);
    setFormBrand(v.brand);
    setFormModel(v.model);
    setFormVariant(v.variant || '');
    setFormYear(v.year);
    setFormRegNo(v.registrationNumber);
    setFormTransmission(v.transmission);
    setFormFuel(v.fuelType);
    setFormCategory(v.category);
    setFormSeats(v.seatingCapacity || 5);
    setFormEngine(v.engineCapacity || '');
    setFormMileage(v.mileage);
    setFormPrice(v.pricePerDay);
    setFormDeposit(v.securityDeposit);
    setFormPickupLocationId(v.pickupLocationId || matchedHub?.id || hubs[0]?.id || 'hub-chn-tnagar');
    setFormLocation(v.location);
    setFormDescription(v.description);
    setFormStatus(v.status);
    setFormCoverImage(v.coverImage);
    setIsModalOpen(true);
  };

  const handleUploadImage = async (file: File | undefined) => {
    if (!file) return;
    setModalError(null);
    setIsUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      if (editingVehicle?.id) fd.append('vehicleId', editingVehicle.id);
      const res = await fetch('/api/vehicles/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setModalError(data.error || 'Failed to upload image to Supabase Storage.');
      } else {
        setFormCoverImage(data.publicUrl);
      }
    } catch {
      setModalError('Network error while uploading image.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setPageFeedback(null);

    if (!formName.trim() || !formBrand.trim() || !formModel.trim() || !formRegNo.trim()) {
      setModalError('Name, brand, model, and registration number are required.');
      return;
    }

    setIsSaving(true);
    const resolvedImage = formCoverImage.trim() || getVehicleImagePath(formName, formType);
    const selectedHub = hubs.find((h) => h.id === formPickupLocationId);
    const resolvedLocation = selectedHub ? `${selectedHub.name}, ${selectedHub.city}` : formLocation;

    const result = editingVehicle
      ? await updateVehicle(editingVehicle.id, {
          name: formName.trim(),
          brand: formBrand.trim(),
          model: formModel.trim(),
          variant: formVariant.trim(),
          year: Number(formYear) || 2024,
          registrationNumber: formRegNo.trim().toUpperCase(),
          transmission: formTransmission,
          fuelType: formFuel,
          category: formCategory,
          seatingCapacity: formType === 'car' ? Number(formSeats) || 5 : undefined,
          engineCapacity: formEngine.trim() || undefined,
          mileage: formMileage.trim() || '16 km/l',
          pricePerDay: Number(formPrice),
          securityDeposit: Number(formDeposit),
          location: resolvedLocation,
          pickupLocationId: formPickupLocationId,
          description: formDescription.trim(),
          status: formStatus,
          coverImage: resolvedImage,
        })
      : await addVehicle({
          name: formName.trim(),
          brand: formBrand.trim(),
          model: formModel.trim(),
          variant: formVariant.trim(),
          year: Number(formYear) || 2024,
          registrationNumber: formRegNo.trim().toUpperCase(),
          type: formType,
          category: formCategory,
          transmission: formTransmission,
          fuelType: formFuel,
          seatingCapacity: formType === 'car' ? Number(formSeats) || 5 : undefined,
          engineCapacity: formEngine.trim() || undefined,
          mileage: formMileage.trim() || '16 km/l',
          pricePerDay: Number(formPrice),
          securityDeposit: Number(formDeposit),
          location: resolvedLocation,
          pickupLocationId: formPickupLocationId,
          description: formDescription.trim() || `${formBrand.trim()} ${formModel.trim()} maintained at ${resolvedLocation}.`,
          features: ['Bluetooth Audio', 'Fastag Enabled', '24x7 Roadside Support'],
          coverImage: resolvedImage,
          images: [resolvedImage],
          status: formStatus,
          rating: 4.8,
          reviewCount: 0,
          minRentalHours: 24,
          odometer: 12000,
          isActive: true,
        });

    setIsSaving(false);

    if (!result.success) {
      setModalError(result.error || 'Unable to save vehicle.');
      return;
    }

    setPageFeedback({
      type: 'success',
      message: editingVehicle ? `${formName} updated in fleet database.` : `${formName} added to live fleet.`,
    });
    setIsModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmVehicle) return;
    setIsDeleting(true);
    setPageFeedback(null);
    const res = await deleteVehicle(deleteConfirmVehicle.id);
    setIsDeleting(false);
    if (!res.success) {
      setPageFeedback({ type: 'error', message: res.error || 'Failed to deactivate vehicle.' });
    } else {
      setPageFeedback({ type: 'success', message: `${deleteConfirmVehicle.name} deactivated from active fleet.` });
    }
    setDeleteConfirmVehicle(null);
  };

  const getStatusBadge = (status: VehicleStatus) => {
    switch (status) {
      case 'available':
        return <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200">Available</span>;
      case 'booked':
        return <span className="bg-blue-50 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-200">Booked</span>;
      case 'rented':
        return <span className="bg-purple-50 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded border border-purple-200">Rented</span>;
      case 'maintenance':
        return <span className="bg-amber-50 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-200">Maintenance</span>;
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Fleet Management & Vehicle Inventory
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage your fleet of {vehicles.length} verified cars and bikes across all Tamil Nadu hubs.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-[#111827] hover:bg-black text-[#C7F36B] rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Vehicle</span>
        </button>
      </div>

      {pageFeedback && (
        <div
          className={`px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between border ${
            pageFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          <span className="flex items-center gap-2">
            {pageFeedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {pageFeedback.message}
          </span>
          <button type="button" onClick={() => setPageFeedback(null)} className="opacity-60 hover:opacity-100">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by model, brand, reg number or hub..."
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#111827]"
            />
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto p-1 bg-gray-50 rounded-xl border border-gray-200 text-xs font-semibold">
            {(
              [
                { id: 'all', label: `All (${vehicles.length})` },
                { id: 'cars', label: 'Cars' },
                { id: 'bikes', label: 'Bikes' },
                { id: 'available', label: 'Available' },
                { id: 'booked', label: 'Booked' },
                { id: 'maintenance', label: 'Service' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[#111827] text-[#C7F36B] shadow-sm font-bold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Vehicles Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 font-semibold border-y border-gray-200">
              <tr>
                <th className="py-3 px-3">Vehicle</th>
                <th className="py-3 px-3">Type & Category</th>
                <th className="py-3 px-3">Reg. Number</th>
                <th className="py-3 px-3">Transmission & Fuel</th>
                <th className="py-3 px-3">Hub Location</th>
                <th className="py-3 px-3">Daily Rent</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">
                    No vehicles found matching filter criteria.
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-9 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                          <img
                            src={v.coverImage}
                            alt={v.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = getVehicleImagePath(v.name, v.type);
                            }}
                          />
                        </div>
                        <div>
                          <span className="font-bold text-gray-900 block leading-tight">{v.name}</span>
                          <span className="text-[10px] text-gray-400 font-medium">{v.brand} · {v.year}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="capitalize font-semibold text-gray-800">{v.type}</span>
                      <span className="text-[10px] text-gray-400 block">{v.category}</span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-gray-800">
                      {v.registrationNumber}
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-gray-800 font-medium">{v.transmission}</span>
                      <span className="text-[10px] text-gray-400 block">{v.fuelType}</span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1 text-gray-700">
                        <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                        <span className="truncate max-w-[140px]">{v.location}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-gray-900">{formatCurrency(v.pricePerDay)}</span>
                      <span className="text-[10px] text-gray-400 block">/day</span>
                    </td>
                    <td className="py-3 px-3">{getStatusBadge(v.status)}</td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(v)}
                          className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors cursor-pointer"
                          title="Edit Vehicle"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmVehicle(v)}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors cursor-pointer"
                          title="Delete Vehicle"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Vehicle Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-100">
            <div className="bg-[#111827] text-white px-6 py-4 flex items-center justify-between sticky top-0 z-10">
              <h3 className="font-bold text-sm">
                {editingVehicle ? `Edit ${editingVehicle.name}` : 'Add New Fleet Vehicle'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVehicle} className="p-6 space-y-4 text-xs">
              {modalError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Type Switcher */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setFormType('car');
                    setFormCategory('SUV');
                    setFormSeats(5);
                    setFormCoverImage(getVehicleImagePath(formName || 'Hyundai Creta', 'car'));
                  }}
                  className={`flex-1 py-2 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all ${
                    formType === 'car'
                      ? 'bg-[#111827] text-[#C7F36B] border-[#111827]'
                      : 'bg-gray-50 text-gray-600 border-gray-200'
                  }`}
                >
                  <Car className="w-4 h-4" />
                  <span>Car</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormType('bike');
                    setFormCategory('Touring & Highway');
                    setFormSeats(2);
                    setFormCoverImage(getVehicleImagePath(formName || 'Royal Enfield Hunter 350', 'bike'));
                  }}
                  className={`flex-1 py-2 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all ${
                    formType === 'bike'
                      ? 'bg-[#111827] text-[#C7F36B] border-[#111827]'
                      : 'bg-gray-50 text-gray-600 border-gray-200'
                  }`}
                >
                  <Bike className="w-4 h-4" />
                  <span>Bike / Scooter</span>
                </button>
              </div>

              {/* Segment / Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Vehicle Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as VehicleCategory)}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg"
                  >
                    {(formType === 'car' ? CAR_CATEGORIES : BIKE_CATEGORIES).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Model Year</label>
                  <input
                    type="number"
                    min={2016}
                    max={2027}
                    value={formYear}
                    onChange={(e) => setFormYear(Number(e.target.value))}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg"
                  />
                </div>
              </div>

              {/* Basic Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Vehicle Full Name</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => {
                      setFormName(e.target.value);
                      setFormCoverImage(getVehicleImagePath(e.target.value, formType));
                    }}
                    placeholder="e.g. Royal Enfield Hunter 350"
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Brand / Manufacturer</label>
                  <input
                    type="text"
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    placeholder="e.g. Royal Enfield, Tata, Hyundai"
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Model Name</label>
                  <input
                    type="text"
                    value={formModel}
                    onChange={(e) => setFormModel(e.target.value)}
                    placeholder="e.g. Hunter 350, Creta, Safari"
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Registration Number (TN RTO)</label>
                  <input
                    type="text"
                    value={formRegNo}
                    onChange={(e) => setFormRegNo(e.target.value)}
                    placeholder="e.g. TN 09 BK 8921"
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white font-mono uppercase"
                    required
                  />
                </div>
              </div>

              {/* Specs & Pricing */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Transmission</label>
                  <select
                    value={formTransmission}
                    onChange={(e) => setFormTransmission(e.target.value as TransmissionType)}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg"
                  >
                    <option value="Manual">Manual</option>
                    <option value="Automatic">Automatic</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Fuel Type</label>
                  <select
                    value={formFuel}
                    onChange={(e) => setFormFuel(e.target.value as FuelType)}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg"
                  >
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Electric">Electric</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Daily Rent (₹)</label>
                  <input
                    type="number"
                    min={100}
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Security Deposit (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={formDeposit}
                    onChange={(e) => setFormDeposit(Number(e.target.value))}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg"
                    required
                  />
                </div>
              </div>

              {/* Tamil Nadu Hub Location & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Assigned Tamil Nadu Hub</label>
                  <select
                    value={formPickupLocationId}
                    onChange={(e) => {
                      const nextId = e.target.value;
                      setFormPickupLocationId(nextId);
                      const matched = hubs.find((h) => h.id === nextId);
                      if (matched) setFormLocation(`${matched.name}, ${matched.city}`);
                    }}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg"
                  >
                    {hubs.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name} ({h.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Current Fleet Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as VehicleStatus)}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg font-bold"
                  >
                    <option value="available">Available at Hub</option>
                    <option value="booked">Booked (Upcoming)</option>
                    <option value="rented">Rented (Out on Road)</option>
                    <option value="maintenance">Under Service / Maintenance</option>
                  </select>
                </div>
              </div>

              {/* Verified Image Preview & Supabase Upload */}
              <div>
                <label className="font-semibold text-gray-700 block mb-1">
                  Vehicle Photo (Upload to Supabase Storage or specify URL / path)
                </label>
                <div className="flex flex-wrap gap-2 items-center">
                  <input
                    type="text"
                    value={formCoverImage}
                    onChange={(e) => setFormCoverImage(e.target.value)}
                    className="flex-1 min-w-[200px] p-2 bg-gray-50 border border-gray-200 rounded-lg font-mono text-[11px]"
                  />
                  <label className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold cursor-pointer inline-flex items-center gap-1.5">
                    {isUploadingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    <span>{isUploadingImage ? 'Uploading...' : 'Upload Photo'}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => handleUploadImage(e.target.files?.[0])}
                      disabled={isUploadingImage}
                    />
                  </label>
                  <div className="w-16 h-12 rounded-lg overflow-hidden border border-gray-300 bg-gray-100 shrink-0">
                    <img
                      src={formCoverImage}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = getVehicleImagePath(formName, formType);
                      }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || isUploadingImage}
                  className="px-5 py-2 bg-[#111827] text-[#C7F36B] font-bold rounded-xl hover:bg-black disabled:opacity-60 shadow-md cursor-pointer inline-flex items-center gap-1.5"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSaving ? 'Saving...' : editingVehicle ? 'Update Vehicle' : 'Add Vehicle to Fleet'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-900">Remove from Fleet?</h3>
              <p className="text-xs text-gray-500 mt-1">
                Are you sure you want to remove <span className="font-bold text-gray-800">{deleteConfirmVehicle.name}</span> ({deleteConfirmVehicle.registrationNumber})?
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteConfirmVehicle(null)}
                className="flex-1 py-2 text-xs font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="flex-1 py-2 text-xs font-bold bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-60 shadow-sm"
              >
                {isDeleting ? 'Removing...' : 'Yes, Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
