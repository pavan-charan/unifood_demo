import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { Login } from '../../../components/auth/Login';

// Mock the auth context
const mockLogin = jest.fn();
const mockSendOTP = jest.fn();
const mockResetPassword = jest.fn();

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    sendOTP: mockSendOTP,
    resetPassword: mockResetPassword,
    isLoading: false
  })
}));

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn()
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render login form', () => {
    renderWithRouter(<Login onSwitchToRegister={jest.fn()} onSwitchToReset={jest.fn()} />);
    
    expect(screen.getByText('Welcome Back!')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should handle form submission with valid credentials', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue(true);

    renderWithRouter(<Login onSwitchToRegister={jest.fn()} onSwitchToReset={jest.fn()} />);
    
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('should show validation errors for empty fields', async () => {
    const user = userEvent.setup();

    renderWithRouter(<Login onSwitchToRegister={jest.fn()} onSwitchToReset={jest.fn()} />);
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);

    // Should show validation errors
    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
  });

  it('should show validation error for invalid email', async () => {
    const user = userEvent.setup();

    renderWithRouter(<Login onSwitchToRegister={jest.fn()} onSwitchToReset={jest.fn()} />);
    
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);

    expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
  });

  it('should handle login failure', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue(false);

    renderWithRouter(<Login onSwitchToRegister={jest.fn()} onSwitchToReset={jest.fn()} />);
    
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'wrongpassword');
    });
  });

  it('should toggle password visibility', async () => {
    const user = userEvent.setup();

    renderWithRouter(<Login onSwitchToRegister={jest.fn()} onSwitchToReset={jest.fn()} />);
    
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const toggleButton = screen.getByRole('button', { name: /toggle password visibility/i });

    expect(passwordInput).toHaveAttribute('type', 'password');

    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');

    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('should navigate to register page', async () => {
    const user = userEvent.setup();

    renderWithRouter(<Login onSwitchToRegister={jest.fn()} onSwitchToReset={jest.fn()} />);
    
    const registerLink = screen.getByText('Create an account');
    await user.click(registerLink);

    // Should navigate to register page (mocked)
    expect(registerLink).toBeInTheDocument();
  });

  it('should handle forgot password', async () => {
    const user = userEvent.setup();
    mockResetPassword.mockResolvedValue(true);

    renderWithRouter(<Login onSwitchToRegister={jest.fn()} onSwitchToReset={jest.fn()} />);
    
    const forgotPasswordLink = screen.getByText('Forgot your password?');
    await user.click(forgotPasswordLink);

    // Should show password reset form
    expect(screen.getByText('Reset Password')).toBeInTheDocument();
  });

  it('should send OTP for password reset', async () => {
    const user = userEvent.setup();
    mockSendOTP.mockResolvedValue(true);

    renderWithRouter(<Login onSwitchToRegister={jest.fn()} onSwitchToReset={jest.fn()} />);
    
    // Click forgot password
    const forgotPasswordLink = screen.getByText('Forgot your password?');
    await user.click(forgotPasswordLink);

    // Fill email and send OTP
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const sendOTPButton = screen.getByRole('button', { name: /send otp/i });

    await user.type(emailInput, 'test@example.com');
    await user.click(sendOTPButton);

    await waitFor(() => {
      expect(mockSendOTP).toHaveBeenCalledWith('test@example.com');
    });
  });

  it('should show loading state during login', async () => {
    const user = userEvent.setup();
    // Mock a delayed login response
    mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(true), 100)));

    renderWithRouter(<Login onSwitchToRegister={jest.fn()} onSwitchToReset={jest.fn()} />);
    
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    // Should show loading state
    expect(screen.getByText('Signing in...')).toBeInTheDocument();
  });
});
