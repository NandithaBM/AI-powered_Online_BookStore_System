// src/pages/Payment.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PaymentForm from '../components/PaymentForm';

const Payment: React.FC = () => {
  const [orderData, setOrderData] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('pendingOrder');
    if (!stored) {
      navigate('/checkout');
    } else {
      setOrderData(JSON.parse(stored));
    }
  }, [navigate]);

  if (!orderData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Complete Your Payment</h1>
        <PaymentForm
          totalAmount={orderData.total}
          orderItems={orderData.items}
          shippingAddress={orderData.shippingAddress}
          billingAddress={orderData.billingAddress}
          onPaymentSuccess={(orderId) => {
            localStorage.removeItem('pendingOrder');
            navigate(`/orders/${orderId}`);
          }}
          onPaymentError={(err) => {
            console.error('Payment failed:', err);
          }}
        />
      </div>
    </div>
  );
};

export default Payment;
