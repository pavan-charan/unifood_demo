import { paymentMethods, processPayment, generatePaymentReceipt, PaymentData } from '../../lib/payments';

// Mock Stripe
jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn(() => Promise.resolve({
    elements: jest.fn(),
    createPaymentMethod: jest.fn(),
    confirmPayment: jest.fn(),
  }))
}));

describe('Payments Utilities', () => {
  describe('paymentMethods', () => {
    it('should have all required payment methods', () => {
      expect(paymentMethods).toHaveLength(4);
      
      const types = paymentMethods.map(method => method.type);
      expect(types).toContain('card');
      expect(types).toContain('upi');
      expect(types).toContain('wallet');
      expect(types).toContain('netbanking');
    });

    it('should have valid payment method structure', () => {
      paymentMethods.forEach(method => {
        expect(method).toHaveProperty('id');
        expect(method).toHaveProperty('type');
        expect(method).toHaveProperty('name');
        expect(method).toHaveProperty('icon');
        expect(method).toHaveProperty('description');
        expect(typeof method.id).toBe('string');
        expect(typeof method.name).toBe('string');
        expect(typeof method.icon).toBe('string');
        expect(typeof method.description).toBe('string');
      });
    });

    it('should have unique IDs', () => {
      const ids = paymentMethods.map(method => method.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('processPayment', () => {
    const mockPaymentData: PaymentData = {
      amount: 100,
      currency: 'INR',
      orderId: 'order_123',
      customerEmail: 'test@example.com',
      customerName: 'Test User',
      paymentMethodId: 'card'
    };

    it('should process payment successfully', async () => {
      // Mock Math.random to return a value > 0.1 (success case)
      const originalRandom = Math.random;
      Math.random = jest.fn(() => 0.5);

      const result = await processPayment(mockPaymentData);
      
      expect(result.success).toBe(true);
      expect(result.paymentId).toBeDefined();
      expect(result.paymentId).toMatch(/^pay_\d+_[a-z0-9]+$/);
      expect(result.error).toBeUndefined();

      // Restore original Math.random
      Math.random = originalRandom;
    }, 10000);

    it('should handle payment failure', async () => {
      // Mock Math.random to return a value <= 0.1 (failure case)
      const originalRandom = Math.random;
      Math.random = jest.fn(() => 0.05);

      const result = await processPayment(mockPaymentData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Payment failed. Please try again.');
      expect(result.paymentId).toBeUndefined();

      // Restore original Math.random
      Math.random = originalRandom;
    }, 10000);

    it('should handle payment processing errors', async () => {
      // Mock setTimeout to throw an error
      const originalSetTimeout = global.setTimeout;
      (global as any).setTimeout = jest.fn(() => {
        throw new Error('Processing error');
      });

      const result = await processPayment(mockPaymentData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Payment processing error. Please try again.');
      expect(result.paymentId).toBeUndefined();

      // Restore original setTimeout
      global.setTimeout = originalSetTimeout;
    });

    it('should validate payment data structure', async () => {
      const invalidPaymentData = {
        amount: 'invalid',
        currency: 'INR',
        orderId: 'order_123',
        customerEmail: 'test@example.com',
        customerName: 'Test User',
        paymentMethodId: 'card'
      } as any;

      const result = await processPayment(invalidPaymentData);
      
      // Should still process but might fail due to invalid data
      expect(result).toHaveProperty('success');
      expect(typeof result.success).toBe('boolean');
    });
  });

  describe('generatePaymentReceipt', () => {
    const mockOrder = {
      id: 'order_123',
      token: 'TOKEN_456',
      totalAmount: 100,
      items: [
        { name: 'Pizza', quantity: 1, price: 50 },
        { name: 'Burger', quantity: 1, price: 50 }
      ],
      customerName: 'Test User',
      customerEmail: 'test@example.com',
      paymentMethod: 'card'
    };

    it('should generate valid receipt structure', () => {
      const receipt = generatePaymentReceipt(mockOrder, 'pay_123');
      
      expect(receipt).toHaveProperty('receiptId');
      expect(receipt).toHaveProperty('orderId');
      expect(receipt).toHaveProperty('orderToken');
      expect(receipt).toHaveProperty('paymentId');
      expect(receipt).toHaveProperty('amount');
      expect(receipt).toHaveProperty('tax');
      expect(receipt).toHaveProperty('subtotal');
      expect(receipt).toHaveProperty('items');
      expect(receipt).toHaveProperty('customerName');
      expect(receipt).toHaveProperty('customerEmail');
      expect(receipt).toHaveProperty('paymentMethod');
      expect(receipt).toHaveProperty('timestamp');
      expect(receipt).toHaveProperty('status');
    });

    it('should calculate tax correctly', () => {
      const receipt = generatePaymentReceipt(mockOrder, 'pay_123');
      
      expect(receipt.subtotal).toBe(100);
      expect(receipt.tax).toBe(5); // 5% tax
      expect(receipt.amount).toBe(105); // subtotal + tax
    });

    it('should generate unique receipt IDs', () => {
      const receipt1 = generatePaymentReceipt(mockOrder, 'pay_123');
      const receipt2 = generatePaymentReceipt(mockOrder, 'pay_456');
      
      expect(receipt1.receiptId).not.toBe(receipt2.receiptId);
      expect(receipt1.receiptId).toMatch(/^RCP_\d+$/);
      expect(receipt2.receiptId).toMatch(/^RCP_\d+$/);
    });

    it('should set correct status', () => {
      const receipt = generatePaymentReceipt(mockOrder, 'pay_123');
      expect(receipt.status).toBe('paid');
    });

    it('should include all order items', () => {
      const receipt = generatePaymentReceipt(mockOrder, 'pay_123');
      expect(receipt.items).toEqual(mockOrder.items);
    });
  });
});
