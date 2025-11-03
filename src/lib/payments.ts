import { loadStripe } from '@stripe/stripe-js'

// Handle Vite/browser environment safely (avoid process.env in browser)
const getStripeKey = () => {
  const env = (import.meta as any)?.env || {};
  return env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_...'
}

const stripePromise = loadStripe(getStripeKey())

export interface PaymentMethod {
  id: string
  type: 'card' | 'upi' | 'wallet' | 'netbanking'
  name: string
  icon: string
  description: string
}

export const paymentMethods: PaymentMethod[] = [
  {
    id: 'card',
    type: 'card',
    name: 'Credit/Debit Card',
    icon: '💳',
    description: 'Visa, Mastercard, RuPay'
  },
  {
    id: 'upi',
    type: 'upi',
    name: 'UPI',
    icon: '📱',
    description: 'PhonePe, Google Pay, Paytm'
  },
  {
    id: 'wallet',
    type: 'wallet',
    name: 'Digital Wallet',
    icon: '👛',
    description: 'Paytm, Mobikwik, Amazon Pay'
  },
  {
    id: 'netbanking',
    type: 'netbanking',
    name: 'Net Banking',
    icon: '🏦',
    description: 'All major banks'
  }
]

export interface PaymentData {
  amount: number
  currency: string
  orderId: string
  customerEmail: string
  customerName: string
  paymentMethodId: string
}

export const processPayment = async (paymentData: PaymentData): Promise<{ success: boolean; paymentId?: string; error?: string }> => {
  try {
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // In a real application, you would integrate with actual payment gateways
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Simulate payment success/failure (90% success rate)
    const isSuccess = Math.random() > 0.1
    
    if (isSuccess) {
      return {
        success: true,
        paymentId
      }
    } else {
      return {
        success: false,
        error: 'Payment failed. Please try again.'
      }
    }
  } catch (error) {
    return {
      success: false,
      error: 'Payment processing error. Please try again.'
    }
  }
}

export const generatePaymentReceipt = (order: any, paymentId: string) => {
  const receipt = {
    receiptId: `RCP_${Date.now()}`,
    orderId: order.id,
    orderToken: order.token,
    paymentId,
    amount: order.totalAmount * 1.05, // Including tax
    tax: order.totalAmount * 0.05,
    subtotal: order.totalAmount,
    items: order.items,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    paymentMethod: order.paymentMethod,
    timestamp: new Date().toISOString(),
    status: 'paid'
  }
  
  return receipt
}