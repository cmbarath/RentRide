import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Vehicle, VehicleType, VehicleStatus, FuelType, TransmissionType, VehicleCategory } from '../../types';
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
} from 'lucide-react';

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
  const [formEngine, setFormEngine] = useState('349 cc');
  const [formMileage, setFormMileage] = useState('16 km/l');
  const [formPrice, setFormPrice] = useState(3000);
  const [formDeposit, setFormDeposit] = useState(3000);
  const [formLocation, setFormLocation] = useState(hubs[0]?.name ? `${hubs[0].name}, ${hubs[0].city}` : 'Indiranagar Hub, Bengaluru');
  const [formDescription, setFormDescription] = useState('');
  const [formStatus, setFormStatus] = useState<VehicleStatus>('available');
  const [formCoverImage, setFormCoverImage] = useState('/src/assets/images/car_creta_suv_1793632403661.jpg');

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
    setEditingVehicle(null);
    setFormType('car');
    setFormName('Tata Safari Dark Edition');
    setFormBrand('Tata');
    setFormModel('Safari');
    setFormVariant('XZA Plus 2.0 Kryotec AT');
    setFormYear(2024);
    setFormRegNo('KA 01 ME 6620');
    setFormTransmission('Automatic');
    setFormFuel('Diesel');
    setFormCategory('SUV');
    setFormSeats(7);
    setFormMileage('14.5 km/l');
    setFormPrice(4500);
    setFormDeposit(5000);
    setFormLocation('Indiranagar Hub, Bengaluru');
    setFormDescription('Flagship 7-seater SUV with panoramic sunroof, ventilated seats, and terrain response modes.');
    setFormStatus('available');
    setFormCoverImage('/src/assets/images/car_creta_suv_1793632403661.jpg');
    setIsModalOpen(true);
  };

  const openEditModal = (veh: Vehicle) => {
    setEditingVehicle(veh);
    setFormType(veh.type);
    setFormName(veh.name);
    setFormBrand(veh.brand);
    setFormModel(veh.model);
    setFormVariant(veh.variant);
    setFormYear(veh.year);
    setFormRegNo(veh.registrationNumber);
    setFormTransmission(veh.transmission);
    setFormFuel(veh.fuelType);
    setFormCategory(veh.category);
    setFormSeats(veh.seatingCapacity || 5);
    setFormEngine(veh.engineCapacity || '349 cc');
    setFormMileage(veh.mileage);
    setFormPrice(veh.pricePerDay);
    setFormDeposit(veh.securityDeposit);
    setFormLocation(veh.location);
    setFormDescription(veh.description);
    setFormStatus(veh.status);
    setFormCoverImage(veh.coverImage);
    setIsModalOpen(true);
  };

  const handleSaveVehicle = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingVehicle) {
      updateVehicle(editingVehicle.id, {
        name: formName,
        brand: formBrand,
        model: formModel,
        variant: formVariant,
        year: Number(formYear),
        type: formType,
        category: formCategory,
        registrationNumber: formRegNo,
        transmission: formTransmission,
        fuelType: formFuel,
        seatingCapacity: formType === 'car' ? Number(formSeats) : undefined,
        engineCapacity: formType === 'bike' ? formEngine : undefined,
        mileage: formMileage,
        pricePerDay: Number(formPrice),
        securityDeposit: Number(formDeposit),
        location: formLocation,
        description: formDescription,
        status: formStatus,
        coverImage: formCoverImage,
      });
    } else {
      addVehicle({
        name: formName,
        brand: formBrand,
        model: formModel,
        variant: formVariant,
        year: Number(formYear),
        type: formType,
        category: formCategory,
        registrationNumber: formRegNo,
        transmission: formTransmission,
        fuelType: formFuel,
        seatingCapacity: formType === 'car' ? Number(formSeats) : undefined,
        engineCapacity: formType === 'bike' ? formEngine : undefined,
        mileage: formMileage,
        pricePerDay: Number(formPrice),
        securityDeposit: Number(formDeposit),
        rating: 5.0,
        reviewCount: 0,
        images: [formCoverImage],
        coverImage: formCoverImage,
        location: formLocation,
        description: formDescription,
        features: ['GPS Live Tracking', 'Airbags / ABS', 'Bluetooth Infotainment', 'Sanitized Fleet Pass'],
        status: formStatus,
        minRentalHours: 24,
        odometer: 1200,
      });
    }

    setIsModalOpen(false);
  };

  const getStatusBadge = (status: VehicleStatus) => {
    switch (status) {
      case 'available':
        return <span className="bg-emerald-50 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded border border-emerald-200">Available</span>;
      case 'booked':
        return <span className="bg-blue-50 text-blue-800 text-[11px] font-bold px-2 py-0.5 rounded border border-blue-200">Booked</span>;
      case 'rented':
        return <span className="bg-purple-50 text-purple-800 text-[11px] font-bold px-2 py-0.5 rounded border border-purple-200">On Rent</span>;
      case 'maintenance':
        return <span className="bg-amber-50 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded border border-amber-200">Maintenance</span>;
    }
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Fleet Asset Management
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Add new cars or bikes, update registration details, daily rates, and service schedules.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-[#111827] hover:bg-black text-[#C7F36B] font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add New Vehicle</span>
        </button>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs font-bold">
          {[
            { id: 'all', label: 'All Fleet', count: vehicles.length },
            { id: 'cars', label: 'Cars', count: vehicles.filter((v) => v.type === 'car').length },
            { id: 'bikes', label: 'Bikes & EV', count: vehicles.filter((v) => v.type === 'bike').length },
            { id: 'available', label: 'Available', count: vehicles.filter((v) => v.status === 'available').length },
            { id: 'booked', label: 'Booked', count: vehicles.filter((v) => v.status === 'booked').length },
            { id: 'rented', label: 'On Rent', count: vehicles.filter((v) => v.status === 'rented').length },
            { id: 'maintenance', label: 'Maintenance', count: vehicles.filter((v) => v.status === 'maintenance').length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-[#111827] text-[#C7F36B] shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${activeTab === tab.id ? 'bg-gray-800 text-[#C7F36B]' : 'bg-gray-200 text-gray-700'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search fleet by model, brand, registration plate, hub..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#111827]"
          />
        </div>
      </div>

      {/* Fleet Grid / Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {filteredVehicles.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Vehicle</th>
                  <th className="py-3 px-4">Registration</th>
                  <th className="py-3 px-4">Type & Category</th>
                  <th className="py-3 px-4">Powertrain</th>
                  <th className="py-3 px-4">Daily Rate</th>
                  <th className="py-3 px-4">Deposit</th>
                  <th className="py-3 px-4">Current Hub</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredVehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={v.coverImage}
                          alt=""
                          className="w-12 h-9 object-cover rounded bg-gray-100 shrink-0"
                        />
                        <div>
                          <span className="font-bold text-gray-900 block">{v.name}</span>
                          <span className="text-[11px] text-gray-400">{v.variant}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-gray-800">
                      {v.registrationNumber}
                    </td>

                    <td className="py-3 px-4 text-gray-600">
                      <span className="capitalize font-semibold text-gray-900">{v.type}</span> · {v.category}
                    </td>

                    <td className="py-3 px-4 text-gray-600">
                      {v.transmission} · {v.fuelType}
                    </td>

                    <td className="py-3 px-4 font-bold text-gray-900 tabular-nums">
                      {formatCurrency(v.pricePerDay)}/d
                    </td>

                    <td className="py-3 px-4 text-gray-500 tabular-nums">
                      {formatCurrency(v.securityDeposit)}
                    </td>

                    <td className="py-3 px-4 text-gray-600 truncate max-w-[140px]">
                      {v.location}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {getStatusBadge(v.status)}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(v)}
                          className="p-1.5 text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg"
                          title="Edit Vehicle"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmVehicle(v)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                          title="Delete Vehicle"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-gray-400">
            No vehicles match this filter.
          </div>
        )}
      </div>

      {/* Add / Edit Vehicle Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto border border-gray-200 p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">
                {editingVehicle ? `Edit ${editingVehicle.name}` : 'Add New Fleet Vehicle'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVehicle} className="space-y-4 text-xs">
              
              {/* Type Switcher */}
              <div>
                <label className="font-bold text-gray-700 block mb-1">Vehicle Classification</label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setFormType('car');
                      setFormCategory('SUV');
                    }}
                    className={`py-2 rounded-lg font-bold flex items-center justify-center gap-2 ${
                      formType === 'car' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                    }`}
                  >
                    <Car className="w-4 h-4" />
                    <span>Self-Drive Car</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormType('bike');
                      setFormCategory('Scrambler');
                    }}
                    className={`py-2 rounded-lg font-bold flex items-center justify-center gap-2 ${
                      formType === 'bike' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                    }`}
                  >
                    <Bike className="w-4 h-4" />
                    <span>Bike / Scooter</span>
                  </button>
                </div>
              </div>

              {/* Brand & Name */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Brand</label>
                  <input
                    type="text"
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    placeholder="e.g. Hyundai, Tata, Royal Enfield"
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-bold text-gray-700 block mb-1">Display Model Name</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Hyundai Creta SX (O) Turbo"
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                    required
                  />
                </div>
              </div>

              {/* Variant, Year, Registration Number */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Variant</label>
                  <input
                    type="text"
                    value={formVariant}
                    onChange={(e) => setFormVariant(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Mfg Year</label>
                  <input
                    type="number"
                    value={formYear}
                    onChange={(e) => setFormYear(Number(e.target.value))}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Registration No.</label>
                  <input
                    type="text"
                    value={formRegNo}
                    onChange={(e) => setFormRegNo(e.target.value)}
                    placeholder="KA 03 MX 8912"
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-mono uppercase font-bold"
                    required
                  />
                </div>
              </div>

              {/* Transmission, Fuel & Capacity */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Transmission</label>
                  <select
                    value={formTransmission}
                    onChange={(e) => setFormTransmission(e.target.value as any)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                  >
                    <option value="Automatic">Automatic</option>
                    <option value="Manual">Manual</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Fuel Type</label>
                  <select
                    value={formFuel}
                    onChange={(e) => setFormFuel(e.target.value as any)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                  >
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Electric">Electric</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">
                    {formType === 'car' ? 'Seating Capacity' : 'Engine / Battery'}
                  </label>
                  {formType === 'car' ? (
                    <input
                      type="number"
                      value={formSeats}
                      onChange={(e) => setFormSeats(Number(e.target.value))}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                    />
                  ) : (
                    <input
                      type="text"
                      value={formEngine}
                      onChange={(e) => setFormEngine(e.target.value)}
                      placeholder="e.g. 349 cc"
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                    />
                  )}
                </div>
              </div>

              {/* Pricing & Deposit */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Daily Rental Price (₹)</label>
                  <input
                    type="number"
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Refundable Deposit (₹)</label>
                  <input
                    type="number"
                    value={formDeposit}
                    onChange={(e) => setFormDeposit(Number(e.target.value))}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                  >
                    <option value="available">Available</option>
                    <option value="booked">Booked</option>
                    <option value="rented">Rented</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>

              {/* Location & Image preset */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Assigned Fleet Hub</label>
                  <select
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                  >
                    {hubs.map((h) => (
                      <option key={h.id} value={`${h.name}, ${h.city}`}>
                        {h.name}, {h.city}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Cover Image Source</label>
                  <select
                    value={formCoverImage}
                    onChange={(e) => setFormCoverImage(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                  >
                    <option value="/src/assets/images/car_creta_suv_1793632403661.jpg">Pearl White SUV (Creta)</option>
                    <option value="/src/assets/images/bike_hunter_scrambler_1793632403490.jpg">Scrambler Motorcycle (Hunter 350)</option>
                    <option value="/src/assets/images/car_luxury_sedan_1793632404262.jpg">Executive Luxury Sedan (E-Class)</option>
                    <option value="/src/assets/images/bike_electric_scooter_1793632404753.jpg">Electric Commuter Scooter (Ather)</option>
                    <option value="/src/assets/images/hero_automotive_duo_1793632402154.jpg">Off-Road 4x4 Thar / Fleet Duo</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="font-bold text-gray-700 block mb-1">Vehicle Description</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                  required
                />
              </div>

              <div className="pt-3 border-t border-gray-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#111827] text-[#C7F36B] font-bold rounded-xl hover:bg-black shadow-md"
                >
                  {editingVehicle ? 'Save Vehicle Updates' : 'Add to Fleet'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-gray-900">Delete Fleet Vehicle?</h3>
            <p className="text-xs text-gray-500">
              Are you sure you want to remove <strong>{deleteConfirmVehicle.name}</strong> ({deleteConfirmVehicle.registrationNumber}) from active fleet? This cannot be undone.
            </p>

            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmVehicle(null)}
                className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteVehicle(deleteConfirmVehicle.id);
                  setDeleteConfirmVehicle(null);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 shadow-md"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
