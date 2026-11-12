import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BookingStatus, PaymentStatus } from '../../types';
import {
  Car,
  MapPin,
  Calendar,
  Clock,
  ShieldCheck,
  Upload,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  QrCode,
  ArrowRight,
  ChevronLeft,
  FileText,
  Lock,
  Sparkles,
  Truck,
  Check,
} from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  const {
    selectedVehicleId,
    getVehicleById,
    vehicles,
    setCustomerScreen,
    currentUser,
    createBooking,
    payBooking,
    formatCurrency,
    formatDisplayDate,
    searchCriteria,
    hubs,
    setMode,
    setAdminScreen,
  } = useApp();

  const vehicle = getVehicleById(selectedVehicleId || 'veh-car-01') || vehicles[0];

  // Booking Form State
  const [deliveryType, setDeliveryType] = useState<'hub' | 'doorstep'>('hub');
  const [pickupHub, setPickupHub] = useState(searchCriteria.location);
  const [deliveryAddress, setDeliveryAddress] = useState('Flat 402, Oakwood Residency, Indiranagar, Bengaluru');
  const [pickupDate, setPickupDate] = useState(searchCriteria.pickupDate);
  const [pickupTime, setPickupTime] = useState(searchCriteria.pickupTime);
  const [returnDate, setReturnDate] = useState(searchCriteria.returnDate);
  const [returnTime, setReturnTime] = useState(searchCriteria.returnTime);

  // Customer KYC details
  const [customerName, setCustomerName] = useState(currentUser?.name || 'Rohan Sharma');
  const [customerEmail, setCustomerEmail] = useState(currentUser?.email || 'rohan.sharma@gmail.com');
  const [customerPhone, setCustomerPhone] = useState(currentUser?.phone || '+91 98450 12345');
  const [emergencyPhone, setEmergencyPhone] = useState('+91 98200 44102');
  const [licenceNumber, setLicenceNumber] = useState(currentUser?.licenceNumber || 'KA-03-2019-0048192');

  // Licence file simulations
  const [frontUploaded, setFrontUploaded] = useState(true);
  const [backUploaded, setBackUploaded] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(100);

  // Flow State Machine
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);
  const [lifecycleStage, setLifecycleStage] = useState<
    'form' | 'submitted' | 'awaiting_licence' | 'approved' | 'confirmed'
  >('form');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Credit Card' | 'Debit Card' | 'NetBanking'>('UPI');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Duration & Pricing calculation
  const days = Math.max(
    1,
    Math.ceil(
      (new Date(`${returnDate}T${returnTime}`).getTime() -
        new Date(`${pickupDate}T${pickupTime}`).getTime()) /
        (1000 * 60 * 60 * 24)
    ) || 1
  );

  const baseRental = vehicle.pricePerDay * days;
  const doorstepFee = deliveryType === 'doorstep' ? 299 : 0;
  const subtotal = baseRental + doorstepFee;
  const gst = Math.round(subtotal * 0.18);
  const insurance = vehicle.type === 'car' ? 499 : 199;
  const totalAmount = subtotal + gst + insurance;
  const securityDeposit = vehicle.securityDeposit;

  const handleSubmitBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!frontUploaded || !backUploaded) {
      alert('Please upload both Front and Back sides of your Driving Licence.');
      return;
    }

    const bookingId = createBooking({
      vehicleId: vehicle.id,
      vehicleName: vehicle.name,
      vehicleBrand: vehicle.brand,
      vehicleType: vehicle.type,
      vehicleImage: vehicle.coverImage,
      customerName,
      customerEmail,
      customerPhone,
      customerId: currentUser?.id || 'cust-temp',
      pickupDate,
      pickupTime,
      returnDate,
      returnTime,
      pickupLocation: deliveryType === 'hub' ? pickupHub : deliveryAddress,
      returnLocation: deliveryType === 'hub' ? pickupHub : deliveryAddress,
      deliveryType,
      deliveryAddress: deliveryType === 'doorstep' ? deliveryAddress : undefined,
      durationDays: days,
      rentalCharges: baseRental,
      securityDeposit,
      gstAmount: gst,
      insuranceFee: insurance,
      totalAmount,
      bookingStatus: 'awaiting_licence',
      paymentStatus: 'pending',
      licenceStatus: 'pending',
      licenceNumber,
      licenceFrontImage: '/src/assets/images/hero_automotive_duo_1793632402154.jpg',
      licenceBackImage: '/src/assets/images/car_creta_suv_1793632403661.jpg',
    });

    setCreatedBookingId(bookingId);
    setLifecycleStage('awaiting_licence');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSimulateAdminApprove = () => {
    setLifecycleStage('approved');
  };

  const handleSimulatePayment = () => {
    setIsProcessingPayment(true);
    setTimeout(() => {
      if (createdBookingId) {
        payBooking(createdBookingId, paymentMethod);
      }
      setIsProcessingPayment(false);
      setLifecycleStage('confirmed');
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20">
      
      {/* Top Header / Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <button
            onClick={() => setCustomerScreen('detail')}
            className="flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-black"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Vehicle Details</span>
          </button>

          {/* Stepper indicator */}
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className={`px-2.5 py-1 rounded-md ${lifecycleStage === 'form' ? 'bg-[#111827] text-[#C7F36B]' : 'bg-gray-100 text-gray-600'}`}>
              1. Details & KYC
            </span>
            <span className="text-gray-300">→</span>
            <span className={`px-2.5 py-1 rounded-md ${lifecycleStage === 'awaiting_licence' ? 'bg-[#111827] text-[#C7F36B]' : 'bg-gray-100 text-gray-600'}`}>
              2. Admin Review
            </span>
            <span className="text-gray-300">→</span>
            <span className={`px-2.5 py-1 rounded-md ${lifecycleStage === 'approved' ? 'bg-[#111827] text-[#C7F36B]' : 'bg-gray-100 text-gray-600'}`}>
              3. Payment
            </span>
            <span className="text-gray-300">→</span>
            <span className={`px-2.5 py-1 rounded-md ${lifecycleStage === 'confirmed' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
              4. Confirmed Pass
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* ================= STAGE 1: CHECKOUT FORM ================= */}
        {lifecycleStage === 'form' && (
          <form onSubmit={handleSubmitBooking}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left 2 Columns: Sections 1 to 5 */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* 1. Selected Vehicle Summary */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img
                      src={vehicle.coverImage}
                      alt={vehicle.name}
                      className="w-24 h-20 rounded-xl object-cover bg-gray-100 border border-gray-200"
                    />
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                        <span>{vehicle.brand}</span>
                        <span>·</span>
                        <span>{vehicle.category}</span>
                        <span>·</span>
                        <span className="text-emerald-700 font-semibold">{vehicle.registrationNumber}</span>
                      </div>
                      <h2 className="text-lg font-bold text-gray-900 leading-tight">
                        {vehicle.name}
                      </h2>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {vehicle.transmission} · {vehicle.fuelType} · {vehicle.mileage}
                      </p>
                    </div>
                  </div>

                  <div className="sm:text-right">
                    <div className="text-base font-black text-gray-900 tabular-nums">
                      {formatCurrency(vehicle.pricePerDay)} <span className="text-xs font-normal text-gray-500">/ day</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      +{formatCurrency(vehicle.securityDeposit)} ref. deposit
                    </div>
                  </div>
                </div>

                {/* 2 & 3. Trip Dates & Handover Method */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-5">
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-600" />
                    <span>Trip Schedule & Handover</span>
                  </h3>

                  {/* Handover method */}
                  <div className="grid grid-cols-2 gap-3 p-1 bg-gray-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setDeliveryType('hub')}
                      className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                        deliveryType === 'hub' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                      }`}
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Pick Up at Fleet Hub (Free)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryType('doorstep')}
                      className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                        deliveryType === 'doorstep' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                      }`}
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Doorstep Delivery (+₹299)</span>
                    </button>
                  </div>

                  {deliveryType === 'hub' ? (
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">
                        Select Pickup & Return Hub
                      </label>
                      <select
                        value={pickupHub}
                        onChange={(e) => setPickupHub(e.target.value)}
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#111827]"
                      >
                        {hubs.map((hub) => (
                          <option key={hub.id} value={`${hub.name}, ${hub.city}`}>
                            {hub.name}, {hub.city} ({hub.operatingHours})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">
                        Enter Exact Delivery Address
                      </label>
                      <input
                        type="text"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="Apartment / Office address with landmark..."
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#111827]"
                        required
                      />
                    </div>
                  )}

                  {/* Dates */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                        Pickup Date & Time
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          value={pickupDate}
                          onChange={(e) => setPickupDate(e.target.value)}
                          className="bg-transparent text-xs font-bold text-gray-900 focus:outline-none"
                        />
                        <input
                          type="time"
                          value={pickupTime}
                          onChange={(e) => setPickupTime(e.target.value)}
                          className="bg-transparent text-xs font-bold text-gray-900 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                        Return Date & Time
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          value={returnDate}
                          onChange={(e) => setReturnDate(e.target.value)}
                          className="bg-transparent text-xs font-bold text-gray-900 focus:outline-none"
                        />
                        <input
                          type="time"
                          value={returnTime}
                          onChange={(e) => setReturnTime(e.target.value)}
                          className="bg-transparent text-xs font-bold text-gray-900 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Customer KYC Contact Information */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                  <h3 className="text-base font-bold text-gray-900">
                    Primary Driver Information
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="font-semibold text-gray-700 block mb-1">Full Legal Name</label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#111827]"
                        required
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-gray-700 block mb-1">Email Address</label>
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#111827]"
                        required
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-gray-700 block mb-1">Mobile Number (for OTP)</label>
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#111827]"
                        required
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-gray-700 block mb-1">Emergency Contact</label>
                      <input
                        type="tel"
                        value={emergencyPhone}
                        onChange={(e) => setEmergencyPhone(e.target.value)}
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#111827]"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* 5. Driving Licence Upload (Front & Back) */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-gray-900">
                        Driving Licence Verification
                      </h3>
                      <p className="text-xs text-gray-500">
                        Uploaded documents are verified by our 24/7 fleet managers within 15 minutes.
                      </p>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                      SSL 256-Bit Encrypted
                    </span>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      Driving Licence Number
                    </label>
                    <input
                      type="text"
                      value={licenceNumber}
                      onChange={(e) => setLicenceNumber(e.target.value)}
                      placeholder="e.g. KA-03-2019-0048192"
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#111827]"
                      required
                    />
                  </div>

                  {/* Upload Slots */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Front side */}
                    <div className="p-4 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 hover:bg-gray-100/70 transition-all text-center">
                      <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-2 text-gray-600">
                        <Upload className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-gray-800">Licence Front Side</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">JPEG, PNG or PDF up to 10MB</p>

                      {frontUploaded ? (
                        <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 py-1 px-2 rounded-lg border border-emerald-200">
                          <Check className="w-3.5 h-3.5" />
                          <span>Front Side Attached</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setFrontUploaded(true)}
                          className="mt-3 text-xs font-bold text-[#111827] underline"
                        >
                          Attach Photo
                        </button>
                      )}
                    </div>

                    {/* Back side */}
                    <div className="p-4 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 hover:bg-gray-100/70 transition-all text-center">
                      <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-2 text-gray-600">
                        <Upload className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-gray-800">Licence Back Side</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">JPEG, PNG or PDF up to 10MB</p>

                      {backUploaded ? (
                        <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 py-1 px-2 rounded-lg border border-emerald-200">
                          <Check className="w-3.5 h-3.5" />
                          <span>Back Side Attached</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setBackUploaded(true)}
                          className="mt-3 text-xs font-bold text-[#111827] underline"
                        >
                          Attach Photo
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Verification Notice */}
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2 text-xs text-amber-900">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Important Notice:</strong> Your booking will be reviewed by the rental administrator. Once approved, you can complete your payment to lock in the reservation.
                    </span>
                  </div>
                </div>

              </div>

              {/* Right Column: Price Breakdown & Submission */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6 sticky top-24 space-y-5">
                  <h3 className="font-bold text-base text-gray-900 border-b border-gray-100 pb-3">
                    Fare Breakdown
                  </h3>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between text-gray-600">
                      <span>Rental Fare ({days} {days === 1 ? 'day' : 'days'})</span>
                      <span className="font-semibold text-gray-900 tabular-nums">
                        {formatCurrency(baseRental)}
                      </span>
                    </div>

                    {deliveryType === 'doorstep' && (
                      <div className="flex justify-between text-gray-600">
                        <span>Doorstep Delivery Charge</span>
                        <span className="font-semibold text-gray-900 tabular-nums">₹299</span>
                      </div>
                    )}

                    <div className="flex justify-between text-gray-600">
                      <span>GST (18%)</span>
                      <span className="font-semibold text-gray-900 tabular-nums">
                        {formatCurrency(gst)}
                      </span>
                    </div>

                    <div className="flex justify-between text-gray-600">
                      <span>Comprehensive Damage Waiver</span>
                      <span className="font-semibold text-gray-900 tabular-nums">
                        {formatCurrency(insurance)}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex justify-between text-sm font-bold text-gray-900">
                      <span>Total Amount to Pay</span>
                      <span className="text-base font-black text-gray-900 tabular-nums">
                        {formatCurrency(totalAmount)}
                      </span>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-600 space-y-1">
                      <div className="flex justify-between font-bold text-gray-900">
                        <span>Refundable Security Deposit:</span>
                        <span>{formatCurrency(securityDeposit)}</span>
                      </div>
                      <p className="text-[10px] text-gray-400">
                        Held during trip, auto-refunded to your source account within 24h of return.
                      </p>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-[#111827] hover:bg-black text-[#C7F36B] rounded-xl font-bold text-xs tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    <span>Submit Booking for Verification</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <p className="text-[11px] text-center text-gray-400">
                    🔒 No payment required now. You pay only after document approval.
                  </p>
                </div>
              </div>

            </div>
          </form>
        )}

        {/* ================= STAGE 2: AWAITING LICENCE VERIFICATION ================= */}
        {lifecycleStage === 'awaiting_licence' && (
          <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-xl p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8 animate-pulse" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                Awaiting Admin Verification
              </span>
              <h2 className="text-2xl font-extrabold text-gray-900 mt-3">
                Booking Request Submitted!
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Booking ID: <strong className="text-gray-900 font-mono">{createdBookingId || 'RR-8925'}</strong>
              </p>
            </div>

            <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200 text-left text-xs space-y-2.5">
              <div className="flex justify-between">
                <span className="text-gray-500">Vehicle:</span>
                <span className="font-bold text-gray-900">{vehicle.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Pickup Date & Time:</span>
                <span className="font-semibold text-gray-900">{formatDisplayDate(pickupDate)} at {pickupTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Licence Number:</span>
                <span className="font-mono font-semibold text-gray-900">{licenceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Payable:</span>
                <span className="font-bold text-gray-900 tabular-nums">{formatCurrency(totalAmount)}</span>
              </div>
            </div>

            <div className="p-4 bg-blue-50 text-blue-900 rounded-xl text-xs leading-relaxed border border-blue-200 text-left">
              Our 24/7 fleet manager desk is reviewing your driving licence and schedule. You will receive an instant approval notification to proceed with the online payment.
            </div>

            {/* Simulation Shortcuts */}
            <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleSimulateAdminApprove}
                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simulate Admin Approval (Instant Test)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('admin');
                  setAdminScreen('bookings');
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#111827] text-white rounded-xl text-xs font-bold hover:bg-black transition-all flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-[#C7F36B]" />
                <span>Open in Admin Console</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= STAGE 3: APPROVED, PAYMENT PENDING ================= */}
        {lifecycleStage === 'approved' && (
          <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-xl p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                KYC Approved By Fleet Manager
              </span>
              <h2 className="text-2xl font-extrabold text-gray-900">
                Complete Payment to Lock Your Ride
              </h2>
              <p className="text-xs text-gray-500">
                Booking ID: <strong className="text-gray-900 font-mono">{createdBookingId || 'RR-8925'}</strong> · {vehicle.name}
              </p>
            </div>

            {/* Select Payment Method */}
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-2">
                Choose Payment Method
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {(['UPI', 'Credit Card', 'Debit Card', 'NetBanking'] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`py-3 px-2 rounded-xl border text-xs font-bold transition-all text-center flex flex-col items-center gap-1.5 ${
                      paymentMethod === method
                        ? 'border-[#111827] bg-[#111827] text-[#C7F36B] shadow-sm'
                        : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>{method}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Amount Summary */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">Payable Amount Now</p>
                <p className="text-xs text-gray-400">Includes rental + GST + damage waiver</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-gray-900 tabular-nums">
                  {formatCurrency(totalAmount)}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSimulatePayment}
              disabled={isProcessingPayment}
              className="w-full py-3.5 bg-[#111827] hover:bg-black text-[#C7F36B] rounded-xl font-bold text-xs tracking-wide transition-all shadow-lg flex items-center justify-center gap-2"
            >
              {isProcessingPayment ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>Processing Payment via {paymentMethod}...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Pay {formatCurrency(totalAmount)} Securely</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}

        {/* ================= STAGE 4: CONFIRMED DIGITAL PASS ================= */}
        {lifecycleStage === 'confirmed' && (
          <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden space-y-6 pb-8">
            <div className="bg-[#111827] text-white p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-[#C7F36B] text-[#111827] flex items-center justify-center mx-auto mb-3 font-bold">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight">Booking Confirmed!</h2>
              <p className="text-xs text-gray-300 mt-1">
                Your digital pickup pass is ready. Show this at vehicle handover.
              </p>
            </div>

            <div className="px-8 space-y-6">
              {/* Digital Pass Card */}
              <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded uppercase">
                    Paid & Confirmed
                  </span>
                  <h3 className="text-xl font-black text-gray-900 mt-1">{vehicle.name}</h3>
                  <p className="text-xs font-semibold text-gray-600 mt-0.5">
                    Registration: {vehicle.registrationNumber}
                  </p>
                  
                  <div className="mt-4 space-y-1 text-xs text-gray-500">
                    <p>Pickup: <strong>{formatDisplayDate(pickupDate)} ({pickupTime})</strong></p>
                    <p>Location: <strong>{deliveryType === 'hub' ? pickupHub : deliveryAddress}</strong></p>
                    <p>Booking ID: <strong className="font-mono text-gray-900">{createdBookingId || 'RR-8925'}</strong></p>
                  </div>
                </div>

                <div className="text-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm shrink-0">
                  <div className="w-28 h-28 bg-gray-900 text-[#C7F36B] rounded-lg flex flex-col items-center justify-center mx-auto mb-2">
                    <QrCode className="w-16 h-16 text-[#C7F36B]" />
                    <span className="text-[9px] font-mono tracking-widest text-white">SCAN AT HUB</span>
                  </div>
                  <p className="text-[11px] font-bold text-gray-500">Handover OTP</p>
                  <p className="text-lg font-black text-gray-900 tracking-wider font-mono">7291</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setCustomerScreen('dashboard');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex-1 py-3 bg-[#111827] text-[#C7F36B] font-bold text-xs rounded-xl hover:bg-black transition-all text-center"
                >
                  Go to My Bookings Dashboard
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCustomerScreen('home');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="py-3 px-5 border border-gray-200 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-50 transition-all text-center"
                >
                  Back to Home
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
