import React, { useState } from 'react';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Clock,
  CreditCard,
  CheckCircle,
  X,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { useRecommendations } from '../../contexts/RecommendationContext';
import { paymentMethods, processPayment, generatePaymentReceipt, PaymentMethod } from '../../lib/payments';
import toast from 'react-hot-toast';
import { MenuItem } from '../../types';

export const Cart: React.FC = () => {
  const { user } = useAuth();
  const { getCartRecommendations, checkAllergen } = useRecommendations();
  const {
    cartItems,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    cartTotal,
    timeSlots,
    createOrder
  } = useApp();

  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderToken, setOrderToken] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'details' | 'payment' | 'processing'>('details');

  const handleAddToCart = (item: MenuItem, quantity: number) => {
    const isAddingFirstTime = cartItems.find(i => i.id === item.id) === undefined;
    if (isAddingFirstTime) {
      checkAllergen(item, () => {
        updateCartQuantity(item.id, quantity);
      });
    } else {
      updateCartQuantity(item.id, quantity);
    }
  };

  const handleCheckout = async () => {
    if (!selectedTimeSlot) {
      toast.error('Please select a pickup time');
      return;
    }
    
    if (!selectedPaymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    setPaymentStep('processing');
    setIsProcessingPayment(true);

    try {
      // Process payment
      const paymentResult = await processPayment({
        amount: cartTotal * 1.05, // Including tax
        currency: 'INR',
        orderId: `temp_${Date.now()}`,
        customerEmail: user?.email || '',
        customerName: user?.name || '',
        paymentMethodId: selectedPaymentMethod.id
      });

      if (paymentResult.success && paymentResult.paymentId) {
        // Create order after successful payment
        const orderId = await createOrder(selectedTimeSlot, specialInstructions, paymentResult.paymentId);
        
        if (orderId) {
          // Generate receipt
          const receipt = generatePaymentReceipt({
            id: orderId,
            token: `TOKEN_${Date.now()}`,
            totalAmount: cartTotal,
            items: cartItems,
            customerName: user?.name,
            customerEmail: user?.email,
            paymentMethod: selectedPaymentMethod.name
          }, paymentResult.paymentId);

          setOrderToken(receipt.orderToken);
          setShowSuccess(true);
          setShowCheckout(false);
          setSelectedTimeSlot('');
          setSpecialInstructions('');
          setSelectedPaymentMethod(null);
          setPaymentStep('details');
          
          toast.success('Order placed successfully!');
        } else {
          toast.error('Failed to create order. Please contact support.');
        }
      } else {
        toast.error(paymentResult.error || 'Payment failed. Please try again.');
        setPaymentStep('payment');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Checkout failed. Please try again.');
      setPaymentStep('payment');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setSelectedPaymentMethod(method);
    setPaymentStep('payment');
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h2>
          <p className="text-gray-600 mb-6">
            Your order has been confirmed and the kitchen has been notified.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800 font-medium">Your Pickup Token</p>
            <p className="text-2xl font-bold text-blue-900">{orderToken}</p>
            <p className="text-xs text-blue-600 mt-1">
              Show this token at the counter for pickup
            </p>
          </div>
          <button
            onClick={() => setShowSuccess(false)}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <ShoppingCart className="w-24 h-24 text-gray-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-8">Add some delicious items from our menu!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map(item => (
              <div key={item.id} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-start space-x-4">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                        <p className="text-gray-600 text-sm">{item.description}</p>
                        <p className="text-blue-600 font-bold mt-1">₹{item.price}</p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleAddToCart(item, item.quantity - 1)}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="text-lg font-medium">{item.quantity}</span>
                        <button
                          onClick={() => handleAddToCart(item, item.quantity + 1)}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 mt-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>Prep time: {item.preparationTime}m</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">₹{cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax (5%)</span>
                  <span className="font-medium">₹{(cartTotal * 0.05).toFixed(2)}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-lg font-bold text-blue-600">
                      ₹{(cartTotal * 1.05).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => setShowCheckout(true)}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center justify-center space-x-2"
                >
                  <CreditCard className="w-5 h-5" />
                  <span>Proceed to Checkout</span>
                </button>

                <button
                  onClick={clearCart}
                  className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Clear Cart
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Customers also like</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {getCartRecommendations(cartItems).map(item => (
              <div key={item.id} className="bg-white rounded-lg shadow-sm border p-4">
                <img src={item.image} alt={item.name} className="w-full h-32 object-cover rounded-lg mb-4" />
                <h3 className="font-semibold text-gray-900">{item.name}</h3>
                <p className="text-gray-600 text-sm">₹{item.price}</p>
                <button
                  onClick={() => handleAddToCart(item, 1)}
                  className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        </div>


        {/* Checkout Modal */}
        {showCheckout && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-xl font-semibold text-gray-900">
                  {paymentStep === 'details' && 'Order Details'}
                  {paymentStep === 'payment' && 'Payment Method'}
                  {paymentStep === 'processing' && 'Processing Payment'}
                </h3>
                <button
                  onClick={() => {
                    setShowCheckout(false);
                    setPaymentStep('details');
                    setSelectedPaymentMethod(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                  disabled={isProcessingPayment}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {paymentStep === 'details' && (
                  <>
                    {/* Time Slot Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Select Pickup Time
                      </label>
                      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                        {timeSlots.slice(0, 20).map(slot => (
                          <button
                            key={slot.time}
                            onClick={() => setSelectedTimeSlot(slot.time)}
                            className={`p-3 border rounded-lg text-sm transition-colors ${
                              selectedTimeSlot === slot.time
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                            } ${!slot.available ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={!slot.available}
                          >
                            <div className="font-medium">{slot.time}</div>
                            <div className="text-xs opacity-75">
                              {slot.booked}/{slot.capacity} booked
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Special Instructions */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Special Instructions (Optional)
                      </label>
                      <textarea
                        value={specialInstructions}
                        onChange={(e) => setSpecialInstructions(e.target.value)}
                        placeholder="Any special requests or dietary requirements..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                      />
                    </div>

                    {/* Order Total */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Subtotal</span>
                          <span>₹{cartTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Tax (5%)</span>
                          <span>₹{(cartTotal * 0.05).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center font-semibold text-lg border-t pt-2">
                          <span>Total Amount</span>
                          <span className="text-blue-600">₹{(cartTotal * 1.05).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (!selectedTimeSlot) {
                          toast.error('Please select a pickup time');
                          return;
                        }
                        setPaymentStep('payment');
                      }}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Continue to Payment
                    </button>
                  </>
                )}

                {paymentStep === 'payment' && (
                  <>
                    {/* Payment Methods */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Select Payment Method
                      </label>
                      <div className="space-y-3">
                        {paymentMethods.map(method => (
                          <button
                            key={method.id}
                            onClick={() => handlePaymentMethodSelect(method)}
                            className={`w-full p-4 border rounded-lg text-left transition-colors ${
                              selectedPaymentMethod?.id === method.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-300 hover:border-blue-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <span className="text-2xl">{method.icon}</span>
                              <div>
                                <p className="font-medium text-gray-900">{method.name}</p>
                                <p className="text-sm text-gray-600">{method.description}</p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Order Summary */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Total Amount</span>
                        <span className="text-xl font-bold text-blue-600">
                          ₹{(cartTotal * 1.05).toFixed(2)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Pickup: {selectedTimeSlot}
                      </p>
                    </div>

                    <div className="flex space-x-3">
                      <button
                        onClick={() => setPaymentStep('details')}
                        className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleCheckout}
                        disabled={!selectedPaymentMethod}
                        className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Pay Now
                      </button>
                    </div>
                  </>
                )}

                {paymentStep === 'processing' && (
                  <div className="text-center py-8">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing Payment</h3>
                    <p className="text-gray-600">Please wait while we process your payment...</p>
                    <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-800">
                        <strong>Do not close this window</strong> or refresh the page during payment processing.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};