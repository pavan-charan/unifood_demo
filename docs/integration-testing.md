# Integration Testing

This document provides an overview of the integration tests in the UniFood application. Each section includes the code for a specific test, an explanation of its purpose, and a screenshot of the test output.

## User Flow Integration Tests

This test suite simulates a complete user flow through the application, from authentication to interacting with the main features.

### Test Cases

- **Redirects to auth when not logged in:** Checks that an unauthenticated user is redirected to the login page.
- **Handles complete login flow:** Simulates a user successfully logging in.
- **Handles registration flow:** Simulates a user successfully registering for a new account.
- **Handles password reset flow:** Simulates the process of a user resetting their password.
- **Handles OTP verification flow:** Simulates the process of a user verifying their email address with an OTP.
- **Shows loading states during async operations:** Verifies that loading indicators are displayed during asynchronous operations like logging in.

### Code

```typescript
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import App from '../../App';

// Mock all external dependencies
jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(() => Promise.resolve({ data: { session: null } })),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } }
      }))
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({
            data: null,
            error: null
          }))
        })),
        order: jest.fn(() => ({
          data: [],
          error: null
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => ({
            data: { id: '1' },
            error: null
          }))
        }))
      }))
    }))
  }
}));

jest.mock('../../lib/email', () => ({
  sendOTPEmail: jest.fn(() => Promise.resolve(true)),
  verifyOTP: jest.fn(() => Promise.resolve(true)),
  generateOTP: jest.fn(() => '123456')
}));

jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  },
  Toaster: () => <div data-testid="toaster" />
}));

const renderApp = () => {
  return render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
};

describe('User Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should redirect to auth when not logged in', async () => {
    renderApp();

    await waitFor(() => {
      // Should redirect to auth page
      expect(screen.getByText('Welcome Back!')).toBeInTheDocument();
    });
  });

  it('should handle complete login flow', async () => {
    const user = userEvent.setup();

    // Mock successful login
    const mockSupabase = require('../../lib/supabase').supabase;
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      error: null
    });

    mockSupabase.from.mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({
            data: {
              id: '1',
              name: 'Test User',
              email: 'test@example.com',
              student_id: 'ST001',
              role: 'student',
              is_verified: true,
              loyalty_points: 0,
              created_at: new Date().toISOString()
            },
            error: null
          }))
        }))
      }))
    });

    renderApp();

    // Wait for auth page to load
    await waitFor(() => {
      expect(screen.getByText('Welcome Back!')).toBeInTheDocument();
    });

    // Fill login form
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const loginButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(loginButton);

    // Should attempt login
    await waitFor(() => {
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });
  });

  it('should handle registration flow', async () => {
    const user = userEvent.setup();

    // Mock successful registration
    const mockSupabase = require('../../lib/supabase').supabase;
    mockSupabase.from.mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({
            data: null,
            error: { code: 'PGRST116' } // No rows found
          }))
        }))
      })),
      insert: jest.fn(() => ({
        error: null
      }))
    });

    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: { id: '1' } },
      error: null
    });

    renderApp();

    // Wait for auth page to load
    await waitFor(() => {
      expect(screen.getByText('Welcome Back!')).toBeInTheDocument();
    });

    // Navigate to register
    const registerLink = screen.getByText('Create an account');
    await user.click(registerLink);

    // Should show registration form
    await waitFor(() => {
      expect(screen.getByText('Create Account')).toBeInTheDocument();
    });
  });

  it('should handle password reset flow', async () => {
    const user = userEvent.setup();

    const mockSupabase = require('../../lib/supabase').supabase;
    mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
      error: null
    });

    renderApp();

    // Wait for auth page to load
    await waitFor(() => {
      expect(screen.getByText('Welcome Back!')).toBeInTheDocument();
    });

    // Click forgot password
    const forgotPasswordLink = screen.getByText('Forgot your password?');
    await user.click(forgotPasswordLink);

    // Should show password reset form
    await waitFor(() => {
      expect(screen.getByText('Reset Password')).toBeInTheDocument();
    });

    // Fill email and send reset
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const sendResetButton = screen.getByRole('button', { name: /send reset link/i });

    await user.type(emailInput, 'test@example.com');
    await user.click(sendResetButton);

    // Should attempt password reset
    await waitFor(() => {
      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.objectContaining({
          redirectTo: expect.stringContaining('/reset-password')
        })
      );
    });
  });

  it('should handle OTP verification flow', async () => {
    const user = userEvent.setup();

    const mockSupabase = require('../../lib/supabase').supabase;
    mockSupabase.from.mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({
            data: { is_verified: false },
            error: null
          }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          error: null
        }))
      }))
    });

    renderApp();

    // Wait for auth page to load
    await waitFor(() => {
      expect(screen.getByText('Welcome Back!')).toBeInTheDocument();
    });

    // Navigate to OTP verification
    const registerLink = screen.getByText('Create an account');
    await user.click(registerLink);

    // Fill registration form and submit
    const nameInput = screen.getByPlaceholderText('Enter your full name');
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('Create a password');
    const registerButton = screen.getByRole('button', { name: /create account/i });

    await user.type(nameInput, 'Test User');
    await user.type(emailInput, 'test@iiitkottayam.ac.in');
    await user.type(passwordInput, 'Password123!');
    await user.click(registerButton);

    // Should show OTP verification form
    await waitFor(() => {
      expect(screen.getByText('Verify Your Email')).toBeInTheDocument();
    });

    // Enter OTP
    const otpInput = screen.getByPlaceholderText('Enter 6-digit OTP');
    const verifyButton = screen.getByRole('button', { name: /verify email/i });

    await user.type(otpInput, '123456');
    await user.click(verifyButton);

    // Should attempt OTP verification
    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith('users');
    });
  });

  it('should show loading states during async operations', async () => {
    const user = userEvent.setup();

    // Mock delayed response
    const mockSupabase = require('../../lib/supabase').supabase;
    mockSupabase.auth.signInWithPassword.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ error: null }), 100))
    );

    renderApp();

    // Wait for auth page to load
    await waitFor(() => {
      expect(screen.getByText('Welcome Back!')).toBeInTheDocument();
    });

    // Fill login form
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const loginButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(loginButton);

    // Should show loading state
    expect(screen.getByText('Signing in...')).toBeInTheDocument();
  });
});
```

### Output

![User Flow Test Output](placeholder_user_flow_test_output.png)
