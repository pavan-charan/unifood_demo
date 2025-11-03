import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { Header } from '../../../components/common/Header';

// Mock the auth context
const mockLogout = jest.fn();

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'student',
      isVerified: true
    },
    logout: mockLogout
  })
}));

// Mock the app context
jest.mock('../../../contexts/AppContext', () => ({
  useApp: () => ({
    cartItems: [
      {
        id: '1',
        name: 'Test Item',
        price: 100,
        quantity: 2
      }
    ],
    notifications: [
      {
        id: '1',
        title: 'Test Notification',
        message: 'Test message',
        type: 'info',
        read: false,
        createdAt: new Date()
      }
    ],
    markNotificationRead: jest.fn()
  })
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

describe('Header Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render header with user information', () => {
    renderWithRouter(<Header onNavigate={jest.fn()} currentPage="profile" />);
    
    expect(screen.getByText('UniFood')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('should show cart count', () => {
    renderWithRouter(<Header onNavigate={jest.fn()} currentPage="profile" />);
    
    expect(screen.getByText('2')).toBeInTheDocument(); // Cart quantity
  });

  it('should show notification count', () => {
    renderWithRouter(<Header onNavigate={jest.fn()} currentPage="profile" />);
    
    expect(screen.getByText('1')).toBeInTheDocument(); // Notification count
  });

  it('should handle navigation clicks', async () => {
    const user = userEvent.setup();
    const mockOnNavigate = jest.fn();

    renderWithRouter(<Header onNavigate={mockOnNavigate} currentPage="profile" />);
    
    const cartButton = screen.getByRole('button', { name: /cart/i });
    await user.click(cartButton);

    expect(mockOnNavigate).toHaveBeenCalledWith('cart');
  });

  it('should handle logout', async () => {
    const user = userEvent.setup();

    renderWithRouter(<Header onNavigate={jest.fn()} currentPage="profile" />);
    
    const logoutButton = screen.getByRole('button', { name: /logout/i });
    await user.click(logoutButton);

    expect(mockLogout).toHaveBeenCalled();
  });

  it('should show active page indicator', () => {
    renderWithRouter(<Header onNavigate={jest.fn()} currentPage="cart" />);
    
    // Should show cart as active
    const cartButton = screen.getByRole('button', { name: /cart/i });
    expect(cartButton).toHaveClass('bg-blue-600'); // Active state class
  });

  it('should toggle mobile menu', async () => {
    const user = userEvent.setup();

    renderWithRouter(<Header onNavigate={jest.fn()} currentPage="profile" />);
    
    const mobileMenuButton = screen.getByRole('button', { name: /menu/i });
    await user.click(mobileMenuButton);

    // Should show mobile menu
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('should show user role in header', () => {
    renderWithRouter(<Header onNavigate={jest.fn()} currentPage="profile" />);
    
    expect(screen.getByText('Student')).toBeInTheDocument();
  });

  it('should handle profile navigation', async () => {
    const user = userEvent.setup();
    const mockOnNavigate = jest.fn();

    renderWithRouter(<Header onNavigate={mockOnNavigate} currentPage="cart" />);
    
    const profileButton = screen.getByRole('button', { name: /profile/i });
    await user.click(profileButton);

    expect(mockOnNavigate).toHaveBeenCalledWith('profile');
  });

  it('should show settings option for managers', () => {
    // Mock manager role
    jest.doMock('../../../contexts/AuthContext', () => ({
      useAuth: () => ({
        user: {
          id: '1',
          name: 'Manager User',
          email: 'manager@example.com',
          role: 'manager',
          isVerified: true
        },
        logout: mockLogout
      })
    }));

    renderWithRouter(<Header onNavigate={jest.fn()} currentPage="profile" />);
    
    expect(screen.getByText('Manager')).toBeInTheDocument();
  });
});
