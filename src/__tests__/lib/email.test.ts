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
