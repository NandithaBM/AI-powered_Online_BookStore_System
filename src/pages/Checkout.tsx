import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Lock, MapPin, User } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

interface ShippingAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

const Checkout = () => {
  const { items, getTotalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ')[1] || '',
    email: user?.email || '',
    phone: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
  });

  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [sameAsBilling, setSameAsBilling] = useState(true);

  // Add state for UPI ID
  const [upiId, setUpiId] = useState('');

  const subtotal = getTotalPrice();
  const tax = subtotal * 0.085; // 8.5% tax
  const shipping = subtotal > 50 ? 0 : 9.99; // Free shipping over $50
  const total = subtotal + tax + shipping;

  // Country code mapping for dropdown
  const countryOptions = [
    { label: 'India', value: 'India', code: '+91' },
    { label: 'Japan', value: 'Japan', code: '+81' },
    { label: 'South Korea', value: 'South Korea', code: '+82' },
    { label: 'United States', value: 'United States', code: '+1' },
    { label: 'Canada', value: 'Canada', code: '+1' },
    { label: 'United Kingdom', value: 'United Kingdom', code: '+44' },
  ];

  // Validation state
  const [validation, setValidation] = useState({
    lastName: '',
    email: '',
    phone: '',
    postalCode: '',
    city: '',
    state: '',
    country: '',
  });

  // Country code for phone
  const selectedCountry = countryOptions.find(c => c.value === shippingAddress.country) || countryOptions[0];
  const [countryCode, setCountryCode] = useState(selectedCountry.code);

  // Update country code when country changes
  useEffect(() => {
    const found = countryOptions.find(c => c.value === shippingAddress.country);
    setCountryCode(found ? found.code : countryOptions[0].code);
  }, [shippingAddress.country]);

  // Update country when country code changes
  const handleCountryCodeChange = (code: string) => {
    setCountryCode(code);
    const found = countryOptions.find(c => c.code === code);
    if (found) {
      setShippingAddress(prev => ({ ...prev, country: found.value }));
    }
  };

  // Update country and code when country changes
  const handleCountryChange = (value: string) => {
    handleAddressChange('country', value);
    const found = countryOptions.find(c => c.value === value);
    if (found) {
      setCountryCode(found.code);
    }
  };

  // Validation helpers
  const isAlpha = (str: string) => /^[A-Za-z]+$/.test(str);
  const isAlphaOrSpace = (str: string) => /^[A-Za-z ]+$/.test(str);
  const isNumeric = (str: string) => /^\d+$/.test(str);

  const handleAddressChange = (field: keyof ShippingAddress, value: string) => {
    // Validation logic
    let message = '';
    if (field === 'lastName') {
      if (value.length > 10) value = value.slice(0, 10);
      if (value && !isAlpha(value)) message = 'Only letters allowed';
    }
    if (field === 'email') {
      if (value && !value.endsWith('@gmail.com')) message = 'Only @gmail.com email is accepted';
    }
    if (field === 'postalCode') {
      if (value && !isNumeric(value)) message = 'Postal code must be numeric';
    }
    if (field === 'city') {
      if (value && /\d/.test(value)) message = 'Only letters allowed';
    }
    if (field === 'state') {
      if (value && /\d/.test(value)) message = 'Only letters allowed';
    }
    if (field === 'country') {
      if (value && /\d/.test(value)) message = 'Only letters allowed';
    }
    setValidation(prev => ({ ...prev, [field]: message }));
    setShippingAddress(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Phone validation handler
  const handlePhoneChange = (value: string) => {
    // Remove non-numeric
    let digits = value.replace(/\D/g, '');
    if (digits.length > 10) digits = digits.slice(0, 10);
    let message = '';
    if (digits.length !== 10 && digits.length > 0) message = 'Phone number must be exactly 10 digits';
    setValidation(prev => ({ ...prev, phone: message }));
    setShippingAddress(prev => ({ ...prev, phone: digits }));
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Extend orderData to allow paymentStatus and upiId
      const orderData: any = {
        items: items.map(item => ({
          bookId: item.id,
          title: item.title,
          price: item.price,
          quantity: item.quantity,
        })),
        shippingAddress,
        billingAddress: sameAsBilling ? shippingAddress : shippingAddress,
        paymentMethod,
        shipping: {
          cost: shipping,
          method: 'standard',
        },
        subtotal,
        tax,
        total,
      };

      if (paymentMethod === 'paypal') {
        localStorage.setItem('pendingOrder', JSON.stringify(orderData));
        navigate('/payment');
        return;
      }

      if (paymentMethod === 'upi') {
        if (!upiId || !upiId.includes('@')) {
          toast.error('Please enter a valid UPI ID');
          setLoading(false);
          return;
        }
        toast.success('UPI payment successful!');
        orderData.paymentStatus = 'paid';
        orderData.upiId = upiId;
      } else if (paymentMethod === 'cod') {
        toast.success('Order placed successfully!');
        orderData.paymentStatus = 'pending';
      }

      const response = await axios.post('/orders', orderData);
      if (paymentMethod !== 'cod') {
        toast.success('Order placed successfully!');
      }
      clearCart();
      navigate(`/orders/${response.data.order._id}`);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error placing order';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Checkout Form */}
          <div className="space-y-6">
            {/* Progress Steps */}
            <div className="flex items-center space-x-4 mb-8">
              <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-primary-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200'
                }`}>
                  1
                </div>
                <span className="font-medium">Shipping</span>
              </div>
              <div className="flex-1 h-px bg-gray-300"></div>
              <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-primary-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200'
                }`}>
                  2
                </div>
                <span className="font-medium">Payment</span>
              </div>
            </div>

            <form onSubmit={handleSubmitOrder} className="space-y-6">
              {/* Shipping Information */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <MapPin className="h-5 w-5 text-primary-600" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Shipping Information</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingAddress.firstName}
                      onChange={(e) => handleAddressChange('firstName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-white bg-white dark:bg-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingAddress.lastName}
                      onChange={(e) => handleAddressChange('lastName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-white bg-white dark:bg-gray-900"
                      maxLength={10}
                    />
                    {validation.lastName && (
                      <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">{validation.lastName}</div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={shippingAddress.email}
                      onChange={(e) => handleAddressChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-white bg-white dark:bg-gray-900"
                    />
                    {validation.email && (
                      <div className="text-xs text-yellow-600 mt-1">{validation.email}</div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                      Phone
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={countryCode}
                        onChange={e => handleCountryCodeChange(e.target.value)}
                        className="px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
                        style={{ minWidth: 80 }}
                      >
                        {countryOptions.map(opt => (
                          <option key={opt.code} value={opt.code}>{opt.code}</option>
                        ))}
                      </select>
                      <input
                        type="tel"
                        required
                        value={shippingAddress.phone}
                        onChange={e => handlePhoneChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-white bg-white dark:bg-gray-900"
                        maxLength={10}
                        placeholder="10 digits"
                      />
                    </div>
                    {validation.phone && (
                      <div className="text-xs text-yellow-600 mt-1">{validation.phone}</div>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                      Street Address
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingAddress.street}
                      onChange={(e) => handleAddressChange('street', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-white bg-white dark:bg-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingAddress.city}
                      onChange={(e) => handleAddressChange('city', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-white bg-white dark:bg-gray-900"
                    />
                    {validation.city && (
                      <div className="text-xs text-yellow-600 mt-1">{validation.city}</div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingAddress.state}
                      onChange={(e) => handleAddressChange('state', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-white bg-white dark:bg-gray-900"
                    />
                    {validation.state && (
                      <div className="text-xs text-yellow-600 mt-1">{validation.state}</div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingAddress.postalCode}
                      onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-white bg-white dark:bg-gray-900"
                    />
                    {validation.postalCode && (
                      <div className="text-xs text-yellow-600 mt-1">{validation.postalCode}</div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                      Country
                    </label>
                    <select
                      value={shippingAddress.country}
                      onChange={(e) => handleCountryChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-white bg-white dark:bg-gray-900"
                    >
                      {countryOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    {validation.country && (
                      <div className="text-xs text-yellow-600 mt-1">{validation.country}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <CreditCard className="h-5 w-5 text-primary-600" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Payment Information</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                      Payment Method
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="credit_card"
                          checked={paymentMethod === 'credit_card'}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-gray-900 dark:text-white">Credit Card</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="paypal"
                          checked={paymentMethod === 'paypal'}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-gray-900 dark:text-white">PayPal</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="upi"
                          checked={paymentMethod === 'upi'}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-gray-900 dark:text-white">UPI</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="cod"
                          checked={paymentMethod === 'cod'}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-gray-900 dark:text-white">Cash on Delivery</span>
                      </label>
                    </div>
                  </div>

                  {paymentMethod === 'credit_card' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                          Card Number
                        </label>
                        <input
                          type="text"
                          placeholder="1234 5678 9012 3456"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-white bg-white dark:bg-gray-900"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                            Expiry Date
                          </label>
                          <input
                            type="text"
                            placeholder="MM/YY"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-white bg-white dark:bg-gray-900"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                            CVV
                          </label>
                          <input
                            type="text"
                            placeholder="123"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-white bg-white dark:bg-gray-900"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  {paymentMethod === 'upi' && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">UPI ID</label>
                      <input
                        type="text"
                        value={upiId}
                        onChange={e => setUpiId(e.target.value)}
                        placeholder="yourname@bank"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white bg-white dark:bg-gray-900"
                        required
                      />
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                <Lock className="h-5 w-5 mr-2" />
                {loading ? 'Processing...' : `Place Order - $${total.toFixed(2)}`}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 h-fit">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Order Summary</h2>

            <div className="space-y-4 mb-6">
              {items.map((item) => (
                <div key={item.id} className="flex items-center space-x-3">
                  <img
                    src={item.coverImage}
                    alt={item.title}
                    className="w-12 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm">{item.title}</h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">{item.author}</p>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">Subtotal</span>
                <span className="text-gray-900 dark:text-white">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">Shipping</span>
                <span className="text-gray-900 dark:text-white">
                  {shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">Tax</span>
                <span className="text-gray-900 dark:text-white">₹{tax.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-200 pt-2">
                <div className="flex justify-between font-semibold">
                  <span className="text-gray-900 dark:text-white">Total</span>
                  <span className="text-gray-900 dark:text-white">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {subtotal < 50 && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Add ₹{(50 - subtotal).toFixed(2)} more for free shipping!
                </p>
              </div>
            )}
            {paymentMethod === 'cod' && (
              <div className="mt-4 text-green-600 font-semibold">
                You will pay in cash when your order is delivered.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;