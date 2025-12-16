import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { motion } from 'framer-motion';
import { CreditCard, Lock, Shield, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

interface PaymentFormProps {
  totalAmount: number;
  orderItems: Array<{
    bookId: string;
    title: string;
    price: number;
    quantity: number;
  }>;
  shippingAddress: any;
  billingAddress: any;
  onPaymentSuccess: (orderId: string) => void;
  onPaymentError: (error: string) => void;
}

const PaymentFormContent: React.FC<PaymentFormProps> = ({
  totalAmount,
  orderItems,
  shippingAddress,
  billingAddress,
  onPaymentSuccess,
  onPaymentError
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'form' | 'processing' | 'success'>('form');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setPaymentStep('processing');

    try {
      // Create payment intent
      const response = await fetch('/api/payments/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          items: orderItems,
          shippingAddress,
          billingAddress
        })
      });

      const { clientSecret, orderId } = await response.json();

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      // Confirm payment
      const cardElement = elements.getElement(CardElement);
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement!,
          billing_details: {
            name: billingAddress.name,
            email: billingAddress.email,
            address: {
              line1: billingAddress.address,
              city: billingAddress.city,
              state: billingAddress.state,
              postal_code: billingAddress.zipCode,
              country: billingAddress.country || 'US'
            }
          }
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (paymentIntent.status === 'succeeded') {
        // Confirm the order
        await fetch('/api/payments/confirm-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id,
            orderId
          })
        });

        setPaymentStep('success');
        toast.success('Payment successful! Your order is confirmed.');
        onPaymentSuccess(orderId);
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error instanceof Error ? error.message : 'Payment failed');
      onPaymentError(error instanceof Error ? error.message : 'Payment failed');
      setPaymentStep('form');
    } finally {
      setProcessing(false);
    }
  };

  if (paymentStep === 'processing') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12"
      >
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Processing Payment</h3>
        <p className="text-gray-600">Please don't close this window...</p>
      </motion.div>
    );
  }

  if (paymentStep === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12"
      >
        <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h3>
        <p className="text-gray-600 mb-4">Your order has been confirmed and you'll receive an email confirmation shortly.</p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Security Badge */}
      <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-4 flex items-center space-x-3">
        <Shield className="w-6 h-6 text-green-600" />
        <div>
          <p className="text-sm font-medium text-green-800 dark:text-green-200">Secure Payment</p>
          <p className="text-xs text-green-600 dark:text-green-300">Your payment information is encrypted and secure</p>
        </div>
        <Lock className="w-5 h-5 text-green-600" />
      </div>

      {/* Order Summary */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
        <h4 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center">
          <CreditCard className="w-5 h-5 mr-2" />
          Payment Summary
        </h4>
        <div className="space-y-2 text-sm">
          {orderItems.map((item, index) => (
            <div key={index} className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">
                {item.title} × {item.quantity}
              </span>
              <span className="font-medium text-gray-900 dark:text-white">${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
            <div className="flex justify-between font-semibold text-lg">
              <span className="text-gray-900 dark:text-white">Total:</span>
              <span className="text-blue-600 dark:text-blue-400">${totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Card Element */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-white">
          Card Information
        </label>
        <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#fff',
                  fontFamily: 'Arial, sans-serif',
                  '::placeholder': {
                    color: '#aab7c4'
                  }
                },
                invalid: {
                  color: '#9e2146'
                }
              }
            }}
          />
        </div>
      </div>

      {/* Payment Button */}
      <motion.button
        type="submit"
        disabled={!stripe || processing}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        {processing ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>Processing...</span>
          </>
        ) : (
          <>
            <Lock className="w-5 h-5" />
            <span>Pay ${totalAmount.toFixed(2)}</span>
          </>
        )}
      </motion.button>

      {/* Trust Indicators */}
      <div className="flex items-center justify-center space-x-6 text-xs text-gray-500 dark:text-gray-400 pt-4">
        <div className="flex items-center space-x-1">
          <Shield className="w-4 h-4" />
          <span>SSL Encrypted</span>
        </div>
        <div className="flex items-center space-x-1">
          <CreditCard className="w-4 h-4" />
          <span>Stripe Secure</span>
        </div>
        <div className="flex items-center space-x-1">
          <Lock className="w-4 h-4" />
          <span>PCI Compliant</span>
        </div>
      </div>
    </form>
  );
};

const PaymentForm: React.FC<PaymentFormProps> = (props) => {
  return (
    <Elements stripe={stripePromise}>
      <PaymentFormContent {...props} />
    </Elements>
  );
};

export default PaymentForm;