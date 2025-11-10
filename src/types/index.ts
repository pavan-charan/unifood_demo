export interface User {
  id: string;
  name: string;
  email: string;
  studentId?: string;
  role: 'student' | 'manager';
  isVerified: boolean;
  createdAt: Date;
  loyaltyPoints?: number;
  dietaryRestrictions?: string[];
  allergens?: string[];
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  isVeg: boolean;
  cuisine: string;
  spiceLevel: number;
  allergens: string[];
  nutritionalInfo: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  isAvailable: boolean;
  ingredients: string[];
  averageRating: number;
  reviewCount: number;
  preparationTime: number;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  totalAmount: number;
  status: 'ordered' | 'preparing' | 'ready' | 'served' | 'cancelled';
  scheduledTime: string;
  token: string;
  createdAt: Date;
  paymentId?: string;
  specialInstructions?: string;
  estimatedPreparationTime: number;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  menuItemId: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  capacity: number;
  booked: number;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  read: boolean;
  createdAt: Date;
}