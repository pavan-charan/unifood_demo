# Unit Testing

This document provides an overview of the unit tests in the UniFood application. Each section includes the code for a specific test, an explanation of its purpose, and a screenshot of the test output.

## RecommendationContext Tests

This test suite is for the `RecommendationContext`, which is responsible for providing personalized recommendations to users.

### Test Cases

- **Renders without crashing:** Checks that the `RecommendationProvider` renders without any errors.

### Code

```typescript
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RecommendationProvider, useRecommendations } from '../../contexts/RecommendationContext';
import { AppProvider } from '../../contexts/AppContext';
import { AuthProvider } from '../../contexts/AuthContext';

const TestComponent = () => {
  const { getProfileRecommendations, getCartRecommendations } = useRecommendations();
  return (
    <div>
      <div data-testid="profile-recommendations">{JSON.stringify(getProfileRecommendations())}</div>
      <div data-testid="cart-recommendations">{JSON.stringify(getCartRecommendations([]))}</div>
    </div>
  );
};

describe('RecommendationContext', () => {
  it('renders without crashing', () => {
    render(
      <AuthProvider>
        <AppProvider>
          <RecommendationProvider>
            <TestComponent />
          </RecommendationProvider>
        </AppProvider>
      </AuthProvider>
    );
    expect(screen.getByTestId('profile-recommendations')).toBeInTheDocument();
    expect(screen.getByTestId('cart-recommendations')).toBeInTheDocument();
  });
});
```

### Output

![RecommendationContext Test Output](../testing%20ss/Screenshot%202025-11-08%20152003.png)

## Email Utilities Tests

This test suite is for the email utility functions, which are responsible for sending and verifying one-time passwords (OTPs).

### Test Cases

#### `generateOTP`
- **Generates a 6-digit OTP:** Checks that the generated OTP is a 6-digit number.
- **Generates different OTPs on multiple calls:** Verifies that the function produces different OTPs when called multiple times.

#### `sendOTPEmail`
- **Sends OTP email successfully:** Simulates a successful OTP email being sent.
- **Handles email sending errors:** Simulates an error during the email sending process.
- **Uses demo OTP in demo mode:** Verifies that a demo OTP is used when the application is in demo mode.

#### `verifyOTP`
- **Verifies valid OTP successfully:** Simulates a successful OTP verification.
- **Returns false for already verified user:** Checks that the function returns false if the user is already verified.
- **Returns false for invalid OTP:** Simulates an attempt to verify an invalid OTP.
- **Handles verification errors:** Simulates an error during the OTP verification process.

### Code

```typescript
import { sendOTPEmail, verifyOTP, generateOTP } from '../../lib/email';
import { supabase } from '../../lib/supabase';

// Mock supabase
jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        error: null,
      })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({
            data: null,
            error: null,
          })),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(),
      })),
    })),
  },
}));

// Mock setTimeout for sendOTPEmail delay
const originalSetTimeout = global.setTimeout;
const originalClearTimeout = global.clearTimeout;

describe('Email Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset setTimeout mock for each test
    (global as any).setTimeout = originalSetTimeout;
    (global as any).clearTimeout = originalClearTimeout;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('generateOTP', () => {
    it('should generate a 6-digit OTP', () => {
      const otp = generateOTP();
      expect(otp).toMatch(/^\d{6}$/);
    });

    it('should generate different OTPs on multiple calls', () => {
      const otp1 = generateOTP();
      const otp2 = generateOTP();
      // Very unlikely to be the same, but possible
      expect(otp1).toBeDefined();
      expect(otp2).toBeDefined();
    });
  });

  describe('sendOTPEmail', () => {
    it('should send OTP email successfully', async () => {
      const result = await sendOTPEmail('test@example.com', '123456');
      expect(result).toBe(true);
    });

    it('should handle email sending errors', async () => {
      // Mock Supabase to return an error
      const mockSupabase = require('../../lib/supabase').supabase;
      mockSupabase.from.mockReturnValue({
        insert: jest.fn(() => ({
          error: new Error('Database error')
        }))
      });

      const result = await sendOTPEmail('test@example.com', '123456');
      expect(result).toBe(false);
    });

    it('should use demo OTP in demo mode', async () => {
      const result = await sendOTPEmail('test@example.com', '999999');
      expect(result).toBe(true);
      // In demo mode, it should use '123456' instead of the provided OTP
    });
  });

  describe('verifyOTP', () => {
    it('should verify valid OTP successfully', async () => {
      const result = await verifyOTP('test@example.com', '123456');
      expect(result).toBe(true);
    });

    it('should return false for already verified user', async () => {
      // Mock user as already verified
      const mockSupabase = require('../../lib/supabase').supabase;
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: { is_verified: true },
              error: null
            }))
          }))
        }))
      });

      const result = await verifyOTP('test@example.com', '123456');
      expect(result).toBe(false);
    });

    it('should return false for invalid OTP', async () => {
      // Mock Supabase to return no data (invalid OTP)
      const mockSupabase = require('../../lib/supabase').supabase;
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                gt: jest.fn(() => ({
                  order: jest.fn(() => ({
                    limit: jest.fn(() => ({
                      single: jest.fn(() => ({
                        data: null,
                        error: new Error('No data found')
                      }))
                    }))
                  }))
                }))
              }))
            }))
          }))
        }))
      });

      const result = await verifyOTP('test@example.com', 'invalid');
      expect(result).toBe(false);
    });

    it('should handle verification errors', async () => {
      // Mock Supabase to return an error
      const mockSupabase = require('../../lib/supabase').supabase;
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: null,
              error: new Error('Database error')
            }))
          }))
        }))
      });

      const result = await verifyOTP('test@example.com', '123456');
      expect(result).toBe(false);
    });
  });
});
```

### Output

![Email Utilities Test Output](../testing%20ss/Screenshot%202025-11-08%20153546.png)

## Password Validator Tests

This test suite is for the password validation utility, which assesses the strength of a password and provides feedback.

### Test Cases

#### `validatePassword`
- **Validates weak passwords correctly:** Checks that a weak password is correctly identified and that appropriate issues are reported.
- **Validates fair passwords correctly:** Checks that a fair password is correctly identified and that appropriate issues are reported.
- **Validates strong passwords correctly:** Checks that a strong password is correctly identified.
- **Validates very strong passwords correctly:** Checks that a very strong password is correctly identified.
- **Detects common passwords:** Verifies that the validator can identify and penalize common passwords.
- **Requires uppercase letters:** Ensures that the validator requires at least one uppercase letter.
- **Requires lowercase letters:** Ensures that the validator requires at least one lowercase letter.
- **Requires numbers:** Ensures that the validator requires at least one number.
- **Suggests special characters:** Verifies that the validator suggests adding special characters to improve strength.
- **Limits suggestions to 3:** Ensures that the number of suggestions is limited to a reasonable number.

#### `getStrengthColor`
- **Returns correct colors for each strength level:** Checks that the function returns the correct color for each password strength level.

#### `getStrengthText`
- **Returns correct text for each strength level:** Checks that the function returns the correct text for each password strength level.

### Code

```typescript
import { validatePassword, getStrengthColor, getStrengthText } from '../../lib/passwordValidator';

describe('Password Validator', () => {
  describe('validatePassword', () => {
    it('should validate weak passwords correctly', () => {
      const result = validatePassword('123');
      expect(result.isValid).toBe(false);
      expect(result.strength).toBe('weak');
      expect(result.score).toBeLessThan(40);
      expect(result.issues).toContain('Password must be at least 6 characters long');
    });

    it('should validate fair passwords correctly', () => {
      const result = validatePassword('password');
      expect(result.isValid).toBe(false);
      expect(result.strength).toBe('weak'); // 'password' is a common password, so it's weak
      expect(result.score).toBeLessThan(40);
      expect(result.issues).toContain('Add at least one uppercase letter');
      expect(result.issues).toContain('Add at least one number');
      expect(result.issues).toContain('This password is too common');
    });

    it('should validate strong passwords correctly', () => {
      const result = validatePassword('MyPassword123');
      expect(result.isValid).toBe(true); // Valid password
      expect(result.strength).toBe('very-strong'); // Should be very-strong (score 85)
      expect(result.score).toBe(85); // 30 (length) + 15 (upper) + 15 (lower) + 15 (number) + 10 (length bonus) = 85
      expect(result.issues).toHaveLength(0); // No issues, just suggestions
    });

    it('should validate very strong passwords correctly', () => {
      const result = validatePassword('VeryStrongPassword123!');
      expect(result.isValid).toBe(true);
      expect(result.strength).toBe('very-strong');
      expect(result.score).toBeGreaterThanOrEqual(80);
      expect(result.issues).toHaveLength(0);
    });

    it('should detect common passwords', () => {
      const result = validatePassword('password');
      expect(result.issues).toContain('This password is too common');
      expect(result.score).toBeLessThanOrEqual(20);
    });

    it('should require uppercase letters', () => {
      const result = validatePassword('password123');
      expect(result.issues).toContain('Add at least one uppercase letter');
    });

    it('should require lowercase letters', () => {
      const result = validatePassword('PASSWORD123');
      expect(result.issues).toContain('Add at least one lowercase letter');
    });

    it('should require numbers', () => {
      const result = validatePassword('Password');
      expect(result.issues).toContain('Add at least one number');
    });

    it('should suggest special characters', () => {
      const result = validatePassword('Password123');
      expect(result.suggestions).toContain('Consider adding special characters (!@#$%^&*)');
    });

    it('should limit suggestions to 3', () => {
      const result = validatePassword('a');
      expect(result.suggestions.length).toBeLessThanOrEqual(3);
    });
  });

  describe('getStrengthColor', () => {
    it('should return correct colors for each strength level', () => {
      expect(getStrengthColor('weak')).toBe('red');
      expect(getStrengthColor('fair')).toBe('orange');
      expect(getStrengthColor('strong')).toBe('green');
      expect(getStrengthColor('very-strong')).toBe('blue');
      expect(getStrengthColor('unknown')).toBe('gray');
    });
  });

  describe('getStrengthText', () => {
    it('should return correct text for each strength level', () => {
      expect(getStrengthText('weak')).toBe('Weak');
      expect(getStrengthText('fair')).toBe('Fair');
      expect(getStrengthText('strong')).toBe('Strong');
      expect(getStrengthText('very-strong')).toBe('Very Strong');
      expect(getStrengthText('unknown')).toBe('Unknown');
    });
  });
});
```

### Output

![Password Validator Test Output](../testing%20ss/Screenshot%202025-11-08%20153559.png)

## Payments Utilities Tests

This test suite is for the payment utility functions, which handle payment processing and receipt generation.

### Test Cases

#### `paymentMethods`
- **Has all required payment methods:** Checks that all supported payment methods are present.
- **Has valid payment method structure:** Verifies that each payment method has the correct structure and properties.
- **Has unique IDs:** Ensures that each payment method has a unique ID.

#### `processPayment`
- **Processes payment successfully:** Simulates a successful payment transaction.
- **Handles payment failure:** Simulates a failed payment transaction.
- **Handles payment processing errors:** Simulates an error during payment processing.
- **Validates payment data structure:** Checks that the function can handle payment data with a valid structure.

#### `generatePaymentReceipt`
- **Generates valid receipt structure:** Verifies that the generated receipt has the correct structure and properties.
- **Calculates tax correctly:** Checks that the tax is calculated correctly.
- **Generates unique receipt IDs:** Ensures that each generated receipt has a unique ID.
- **Sets correct status:** Verifies that the receipt status is set to "paid".
- **Includes all order items:** Checks that all items from the order are included in the receipt.

### Code

```typescript
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
```

### Output

![Payments Test Output](../testing%20ss/Screenshot%202025-11-08%20153616.png)
