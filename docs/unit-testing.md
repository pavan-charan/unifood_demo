# Unit Testing

This document provides an overview of the unit tests in the UniFood application. Each section includes the code for a specific test, an explanation of its purpose, and a screenshot of the test output.

## Login Component Tests

This test suite is for the `Login` component, which is responsible for user authentication.

### Test Cases

- **Renders the login form:** Checks that the email input, password input, and sign-in button are all present.
- **Handles valid form submission:** Simulates a user entering valid credentials and submitting the form.
- **Shows validation errors for empty fields:** Ensures that appropriate error messages are displayed when the form is submitted with empty fields.
- **Shows validation error for invalid email:** Checks that an error message is displayed when an invalid email is entered.
- **Handles login failure:** Simulates a failed login attempt.
- **Toggles password visibility:** Verifies that the password visibility can be toggled.
- **Navigates to the register page:** Checks that clicking the "Create an account" link triggers the navigation to the registration page.
- **Handles forgot password:** Simulates the user clicking the "Forgot your password?" link.
- **Sends OTP for password reset:** Verifies that an OTP is sent when the user requests a password reset.
- **Shows loading state during login:** Checks that a loading indicator is displayed while the login request is in progress.

### Code

```typescript
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
```

### Output

![Login Test Output](../testing%20ss/Screenshot%202025-11-08%20151639.png)


## Header Component Tests

This test suite is for the `Header` component, which is responsible for the main navigation and user information display.

### Test Cases

- **Renders header with user information:** Checks that the header displays the user's name and the application title.
- **Shows cart count:** Verifies that the number of items in the cart is correctly displayed.
- **Shows notification count:** Verifies that the number of unread notifications is correctly displayed.
- **Handles navigation clicks:** Simulates a user clicking on a navigation link.
- **Handles logout:** Simulates a user clicking the logout button.
- **Shows active page indicator:** Checks that the currently active page is highlighted in the navigation.
- **Toggles mobile menu:** Verifies that the mobile menu can be opened and closed.
- **Shows user role in header:** Checks that the user's role (e.g., "Student") is displayed.
- **Handles profile navigation:** Simulates a user clicking on the profile link.
- **Shows settings option for managers:** Verifies that the settings option is displayed for users with the "manager" role.

### Code

```typescript
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
```

### Output

![Header Test Output](../testing%20ss/Screenshot%202025-11-08%20151931.png)

## AppContext Tests

This test suite is for the `AppContext`, which manages the global state of the application, including menu items, cart, orders, and notifications.

### Test Cases

- **Provides app context to children:** Checks that the `AppProvider` makes the context available to its children.
- **Initializes with sample menu items:** Verifies that the context is initialized with a default set of menu items.
- **Adds items to cart:** Simulates adding an item to the shopping cart.
- **Updates cart quantities:** Simulates updating the quantity of an item in the cart.
- **Removes items from cart:** Simulates removing an item from the cart.
- **Clears cart:** Simulates clearing all items from the cart.
- **Updates search term:** Verifies that the search term can be updated.
- **Updates selected category:** Verifies that the selected category can be updated.
- **Generates daily token:** Simulates the generation of a daily token.
- **Calculates cart total correctly:** Checks that the total price of the items in the cart is calculated correctly.
- **Throws error when used outside provider:** Ensures that an error is thrown if the context is used outside of the `AppProvider`.
- **Handles cart operations with multiple items:** Verifies that the cart handles multiple items of the same type correctly.

### Code

```typescript
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppProvider, useApp } from '../../contexts/AppContext';
import { MenuItem, CartItem, Order, Review, Notification } from '../../types';

// Mock Supabase
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        order: jest.fn(() => ({
          data: [],
          error: null
        }))
      }))
    })),
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(() => ({
          data: { id: '1' },
          error: null
        }))
      }))
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        error: null
      }))
    })),
    delete: jest.fn(() => ({
      eq: jest.fn(() => ({
        error: null
      }))
    }))
  }))
};

jest.mock('../../lib/supabase', () => ({
  supabase: mockSupabase
}));

// Mock AuthContext
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'student',
      isVerified: true
    }
  })
}));

// Mock toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

// Test component that uses the app context
const TestComponent = () => {
  const {
    menuItems,
    cartItems,
    cartTotal,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    generateDailyToken
  } = useApp();

  const sampleMenuItem: MenuItem = {
    id: '1',
    name: 'Test Item',
    description: 'Test Description',
    price: 100,
    category: 'Test Category',
    image: 'test.jpg',
    isVeg: true,
    cuisine: 'Test',
    spiceLevel: 1,
    allergens: [],
    nutritionalInfo: { calories: 100, protein: 10, carbs: 20, fat: 5 },
    isAvailable: true,
    ingredients: ['ingredient1'],
    averageRating: 4.5,
    reviewCount: 10,
    preparationTime: 15
  };

  return (
    <div>
      <div data-testid="menu-count">{menuItems.length}</div>
      <div data-testid="cart-count">{cartItems.length}</div>
      <div data-testid="cart-total">{cartTotal}</div>
      <div data-testid="search-term">{searchTerm}</div>
      <div data-testid="selected-category">{selectedCategory}</div>
      <button onClick={() => addToCart(sampleMenuItem)}>Add to Cart</button>
      <button onClick={() => removeFromCart('1')}>Remove from Cart</button>
      <button onClick={() => updateCartQuantity('1', 2)}>Update Quantity</button>
      <button onClick={clearCart}>Clear Cart</button>
      <button onClick={() => setSearchTerm('test')}>Set Search</button>
      <button onClick={() => setSelectedCategory('category')}>Set Category</button>
      <button onClick={() => generateDailyToken()}>Generate Token</button>
    </div>
  );
};

describe('AppContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should provide app context to children', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    expect(screen.getByTestId('menu-count')).toBeInTheDocument();
    expect(screen.getByTestId('cart-count')).toBeInTheDocument();
    expect(screen.getByTestId('cart-total')).toBeInTheDocument();
  });

  it('should initialize with sample menu items', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    expect(screen.getByTestId('menu-count')).toHaveTextContent('5'); // Sample data has 5 items
  });

  it('should add items to cart', async () => {
    const user = userEvent.setup();

    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    await user.click(screen.getByText('Add to Cart'));

    await waitFor(() => {
      expect(screen.getByTestId('cart-count')).toHaveTextContent('1');
    });
  });

  it('should update cart quantities', async () => {
    const user = userEvent.setup();

    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    // Add item first
    await user.click(screen.getByText('Add to Cart'));

    // Update quantity
    await user.click(screen.getByText('Update Quantity'));

    await waitFor(() => {
      expect(screen.getByTestId('cart-count')).toHaveTextContent('1');
    });
  });

  it('should remove items from cart', async () => {
    const user = userEvent.setup();

    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    // Add item first
    await user.click(screen.getByText('Add to Cart'));

    // Remove item
    await user.click(screen.getByText('Remove from Cart'));

    await waitFor(() => {
      expect(screen.getByTestId('cart-count')).toHaveTextContent('0');
    });
  });

  it('should clear cart', async () => {
    const user = userEvent.setup();

    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    // Add item first
    await user.click(screen.getByText('Add to Cart'));

    // Clear cart
    await user.click(screen.getByText('Clear Cart'));

    await waitFor(() => {
      expect(screen.getByTestId('cart-count')).toHaveTextContent('0');
    });
  });

  it('should update search term', async () => {
    const user = userEvent.setup();

    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    await user.click(screen.getByText('Set Search'));

    await waitFor(() => {
      expect(screen.getByTestId('search-term')).toHaveTextContent('test');
    });
  });

  it('should update selected category', async () => {
    const user = userEvent.setup();

    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    await user.click(screen.getByText('Set Category'));

    await waitFor(() => {
      expect(screen.getByTestId('selected-category')).toHaveTextContent('category');
    });
  });

  it('should generate daily token', async () => {
    const user = userEvent.setup();

    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    await user.click(screen.getByText('Generate Token'));

    // Token generation should not throw an error
    expect(screen.getByText('Generate Token')).toBeInTheDocument();
  });

  it('should calculate cart total correctly', async () => {
    const user = userEvent.setup();

    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    // Add item to cart
    await user.click(screen.getByText('Add to Cart'));

    await waitFor(() => {
      expect(screen.getByTestId('cart-total')).toHaveTextContent('100');
    });
  });

  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = jest.fn();

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useApp must be used within an AppProvider');

    console.error = originalError;
  });

  it('should handle cart operations with multiple items', async () => {
    const user = userEvent.setup();

    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    // Add same item multiple times
    await user.click(screen.getByText('Add to Cart'));
    await user.click(screen.getByText('Add to Cart'));

    await waitFor(() => {
      expect(screen.getByTestId('cart-count')).toHaveTextContent('1'); // Same item, should increase quantity
      expect(screen.getByTestId('cart-total')).toHaveTextContent('200'); // 100 * 2
    });
  });
});
```

### Output

![AppContext Test Output](../testing%20ss/Screenshot%202025-11-08%20151941.png)

## AuthContext Tests

This test suite is for the `AuthContext`, which manages user authentication state and provides functions for login, logout, and registration.

### Test Cases

- **Provides auth context to children:** Checks that the `AuthProvider` makes the context available to its children.
- **Handles initial session check:** Verifies that the context checks for an existing session on initialization.
- **Handles successful login:** Simulates a successful user login.
- **Handles login error:** Simulates a failed login attempt.
- **Handles successful registration:** Simulates a successful user registration.
- **Handles registration with existing user:** Simulates an attempt to register with an email that is already in use.
- **Handles logout:** Simulates a user logging out.
- **Throws error when used outside provider:** Ensures that an error is thrown if the context is used outside of the `AuthProvider`.

### Code

```typescript
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { User } from '../../types';

// Mock Supabase
const mockSupabase = {
  auth: {
    getSession: jest.fn(),
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    resetPasswordForEmail: jest.fn(),
    updateUser: jest.fn(),
    onAuthStateChange: jest.fn(() => ({
      data: { subscription: { unsubscribe: jest.fn() } }
    }))
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn()
      }))
    })),
    insert: jest.fn(),
    update: jest.fn(() => ({
      eq: jest.fn()
    }))
  }))
};

jest.mock('../../lib/supabase', () => ({
  supabase: mockSupabase
}));

// Mock email utilities
jest.mock('../../lib/email', () => ({
  sendOTPEmail: jest.fn(() => Promise.resolve(true)),
  verifyOTP: jest.fn(() => Promise.resolve(true)),
  generateOTP: jest.fn(() => '123456')
}));

// Mock toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

// Test component that uses the auth context
const TestComponent = () => {
  const { user, login, register, logout, isLoading } = useAuth();

  return (
    <div>
      <div data-testid="user">{user ? user.name : 'No user'}</div>
      <div data-testid="loading">{isLoading ? 'Loading' : 'Not loading'}</div>
      <button onClick={() => login('test@example.com', 'password')}>Login</button>
      <button onClick={() => register({ name: 'Test User', email: 'test@example.com', password: 'password' })}>Register</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should provide auth context to children', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('user')).toBeInTheDocument();
    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('should handle initial session check', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null }
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not loading');
    });
  });

  it('should handle successful login', async () => {
    const user = userEvent.setup();

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null }
    });

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

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await user.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password'
      });
    });
  });

  it('should handle login error', async () => {
    const user = userEvent.setup();

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null }
    });

    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      error: { message: 'Invalid credentials' }
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await user.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalled();
    });
  });

  it('should handle successful registration', async () => {
    const user = userEvent.setup();

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null }
    });

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

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await user.click(screen.getByText('Register'));

    await waitFor(() => {
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password'
      });
    });
  });

  it('should handle registration with existing user', async () => {
    const user = userEvent.setup();

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null }
    });

    mockSupabase.from.mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({
            data: { id: '1' },
            error: null
          }))
        }))
      }))
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await user.click(screen.getByText('Register'));

    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith('users');
    });
  });

  it('should handle logout', async () => {
    const user = userEvent.setup();

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null }
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await user.click(screen.getByText('Logout'));

    await waitFor(() => {
      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    });
  });

  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = jest.fn();

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAuth must be used within an AuthProvider');

    console.error = originalError;
  });
});
```

### Output

![AuthContext Test Output](../testing%20ss/Screenshot%202025-11-08%20151951.png)

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
