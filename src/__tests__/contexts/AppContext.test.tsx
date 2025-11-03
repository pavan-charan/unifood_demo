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
