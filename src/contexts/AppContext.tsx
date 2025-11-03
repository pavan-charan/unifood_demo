import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { MenuItem, CartItem, Order, Review, TimeSlot, Notification } from '../types';
import { useAuth } from './AuthContext';

interface AppContextType {
  // Menu & Cart
  menuItems: MenuItem[];
  cartItems: CartItem[];
  cartQuantities: Record<string, number>;
  addToCart: (item: MenuItem) => void;
  removeFromCart: (itemId: string) => void;
  updateCartQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;

  // Orders
  orders: Order[];
  createOrder: (scheduledTime: string, specialInstructions?: string, paymentId?: string) => Promise<string>;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  
  // Reviews
  reviews: Review[];
  addReview: (menuItemId: string, rating: number, comment: string) => void;
  
  // Time Slots
  timeSlots: TimeSlot[];
  generateTimeSlots: () => void;
  
  // Notifications
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  markNotificationRead: (notificationId: string) => void;
  
  // Manager functions
  addMenuItem: (item: Omit<MenuItem, 'id' | 'averageRating' | 'reviewCount'>) => void;
  updateMenuItem: (itemId: string, updates: Partial<MenuItem>) => void;
  deleteMenuItem: (itemId: string) => void;
  
  // Search & Filter
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  
  // Daily token reset
  generateDailyToken: () => string;

  // Recommendations
  getRecommendedItems: (limit?: number) => MenuItem[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

const SAMPLE_MENU_ITEMS: MenuItem[] = [
  {
    id: '1',
    name: 'Chicken Biryani',
    description: 'Aromatic basmati rice cooked with tender chicken pieces and traditional spices',
    price: 120,
    category: 'Main Course',
    image: 'https://images.pexels.com/photos/1247755/pexels-photo-1247755.jpeg',
    isVeg: false,
    cuisine: 'Indian',
    spiceLevel: 3,
    allergens: ['dairy'],
    nutritionalInfo: { calories: 450, protein: 25, carbs: 60, fat: 15 },
    isAvailable: true,
    ingredients: ['Chicken', 'Basmati Rice', 'Spices', 'Yogurt', 'Onions'],
    averageRating: 4.5,
    reviewCount: 23,
    preparationTime: 25
  },
  {
    id: '2',
    name: 'Paneer Butter Masala',
    description: 'Rich and creamy tomato-based curry with soft paneer cubes',
    price: 100,
    category: 'Main Course',
    image: 'https://images.pexels.com/photos/2474658/pexels-photo-2474658.jpeg',
    isVeg: true,
    cuisine: 'Indian',
    spiceLevel: 2,
    allergens: ['dairy'],
    nutritionalInfo: { calories: 320, protein: 18, carbs: 15, fat: 22 },
    isAvailable: true,
    ingredients: ['Paneer', 'Tomatoes', 'Cream', 'Spices', 'Onions'],
    averageRating: 4.3,
    reviewCount: 18,
    preparationTime: 20
  },
  {
    id: '3',
    name: 'Masala Dosa',
    description: 'Crispy rice crepe filled with spiced potato curry, served with chutney and sambar',
    price: 60,
    category: 'Breakfast',
    image: 'https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg',
    isVeg: true,
    cuisine: 'South Indian',
    spiceLevel: 2,
    allergens: [],
    nutritionalInfo: { calories: 250, protein: 8, carbs: 45, fat: 6 },
    isAvailable: true,
    ingredients: ['Rice', 'Lentils', 'Potatoes', 'Spices'],
    averageRating: 4.7,
    reviewCount: 31,
    preparationTime: 15
  },
  {
    id: '4',
    name: 'Chicken Tikka',
    description: 'Marinated chicken pieces grilled to perfection in a tandoor oven',
    price: 150,
    category: 'Appetizer',
    image: 'https://images.pexels.com/photos/2338407/pexels-photo-2338407.jpeg',
    isVeg: false,
    cuisine: 'Indian',
    spiceLevel: 3,
    allergens: ['dairy'],
    nutritionalInfo: { calories: 180, protein: 28, carbs: 5, fat: 6 },
    isAvailable: true,
    ingredients: ['Chicken', 'Yogurt', 'Spices', 'Lemon'],
    averageRating: 4.6,
    reviewCount: 27,
    preparationTime: 20
  },
  {
    id: '5',
    name: 'Fresh Lime Soda',
    description: 'Refreshing lime soda with mint leaves and a hint of black salt',
    price: 30,
    category: 'Beverages',
    image: 'https://images.pexels.com/photos/1304647/pexels-photo-1304647.jpeg',
    isVeg: true,
    cuisine: 'Indian',
    spiceLevel: 0,
    allergens: [],
    nutritionalInfo: { calories: 45, protein: 0, carbs: 12, fat: 0 },
    isAvailable: true,
    ingredients: ['Lime', 'Soda Water', 'Mint', 'Black Salt'],
    averageRating: 4.2,
    reviewCount: 15,
    preparationTime: 5
  }
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [menuItems, setMenuItems] = useState<MenuItem[]>(SAMPLE_MENU_ITEMS);
  const [cartItems, setCartItems] = useState<MenuItem[]>([]);
  const [cartQuantities, setCartQuantities] = useState<Record<string, number>>({});
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Load data from Supabase on mount
  useEffect(() => {
    loadDataFromSupabase();
    generateTimeSlots();
  }, []);

  const loadDataFromSupabase = async () => {
    try {
      // Count total menu items to decide seeding just once
      const { count } = await supabase
        .from('menu_items')
        .select('id', { count: 'exact', head: true });

      // Load menu items
      const { data: menuData } = await supabase
        .from('menu_items')
        .select('*')
        .eq('is_available', true);

      if (menuData && menuData.length > 0) {
        const formattedMenuItems: MenuItem[] = menuData.map(item => ({
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          category: item.category,
          image: item.image,
          isVeg: item.is_veg,
          cuisine: item.cuisine,
          spiceLevel: item.spice_level,
          allergens: item.allergens || [],
          nutritionalInfo: item.nutritional_info || { calories: 0, protein: 0, carbs: 0, fat: 0 },
          isAvailable: item.is_available,
          ingredients: item.ingredients || [],
          averageRating: item.average_rating,
          reviewCount: item.review_count,
          preparationTime: item.preparation_time
        }));
        setMenuItems(formattedMenuItems);
      } else if (!count || count === 0) {
        // If the table is empty, insert sample data once
        await insertSampleData();
      } else {
        // Table has items but none available; show none without reseeding
        setMenuItems([]);
      }

      // Load orders if user is logged in
      if (user) {
        let orderQuery = supabase.from('orders').select('*').order('created_at', { ascending: false });
        
        // 🚨 CRITICAL FIX: Conditionally filter orders based on user role
        if (user.role === 'student') {
          orderQuery = orderQuery.eq('user_id', user.id);
        }

        const { data: ordersData } = await orderQuery;
        
        if (ordersData) {
          const formattedOrders: Order[] = ordersData.map(order => ({
            id: order.id,
            userId: order.user_id,
            items: order.items,
            totalAmount: order.total_amount,
            status: order.status,
            scheduledTime: order.scheduled_time,
            token: order.token,
            paymentId: order.payment_id,
            specialInstructions: order.special_instructions,
            estimatedPreparationTime: order.estimated_preparation_time,
            createdAt: new Date(order.created_at)
          }));
          setOrders(formattedOrders);
        }

        // Load reviews
        const { data: reviewsData } = await supabase
          .from('reviews')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (reviewsData) {
          const formattedReviews: Review[] = reviewsData.map(review => ({
            id: review.id,
            userId: review.user_id,
            userName: review.user_name,
            menuItemId: review.menu_item_id,
            rating: review.rating,
            comment: review.comment,
            createdAt: new Date(review.created_at)
          }));
          setReviews(formattedReviews);
        }

        // Load notifications
        const { data: notificationsData } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (notificationsData) {
          const formattedNotifications: Notification[] = notificationsData.map(notif => ({
            id: notif.id,
            userId: notif.user_id,
            title: notif.title,
            message: notif.message,
            type: notif.type,
            read: notif.read,
            createdAt: new Date(notif.created_at)
          }));
          setNotifications(formattedNotifications);
        }
      }
    } catch (error) {
      console.error('Error loading data from Supabase:', error);
      // Fallback to sample data
      setMenuItems(SAMPLE_MENU_ITEMS);
    }
  };

  const insertSampleData = async () => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .upsert(SAMPLE_MENU_ITEMS.map(item => ({
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          category: item.category,
          image: item.image,
          is_veg: item.isVeg,
          cuisine: item.cuisine,
          spice_level: item.spiceLevel,
          allergens: item.allergens,
          nutritional_info: item.nutritionalInfo,
          is_available: item.isAvailable,
          ingredients: item.ingredients,
          average_rating: item.averageRating,
          review_count: item.reviewCount,
          preparation_time: item.preparationTime
        })), { onConflict: 'name' });

      if (!error) {
        setMenuItems(SAMPLE_MENU_ITEMS);
      }
    } catch (error) {
      console.error('Error inserting sample data:', error);
      setMenuItems(SAMPLE_MENU_ITEMS);
    }
  };

  // Reload data when user changes
  useEffect(() => {
    if (user) {
      loadDataFromSupabase();
    } else {
      setOrders([]);
      setReviews([]);
      setNotifications([]);
    }
  }, [user]);

  const generateTimeSlots = () => {
    const slots: TimeSlot[] = [];
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const closingHour = 22; // 10 PM
    const closingMinute = 0;
    
    // Check if the canteen is closed for the day
    if (currentHour > closingHour || (currentHour === closingHour && currentMinute >= closingMinute)) {
        setTimeSlots([]); // Clear time slots if past closing time
        return;
    }

    const startHour = currentHour;
    const startMinute = Math.ceil((currentMinute + 30) / 15) * 15;
    
    let currentSlotTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startHour, startMinute);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), closingHour, closingMinute);

    while (currentSlotTime <= endOfDay) {
      const timeString = `${currentSlotTime.getHours().toString().padStart(2, '0')}:${currentSlotTime.getMinutes().toString().padStart(2, '0')}`;
      slots.push({
        time: timeString,
        available: true,
        capacity: 20,
        booked: Math.floor(Math.random() * 10)
      });
      currentSlotTime.setMinutes(currentSlotTime.getMinutes() + 15);
    }

    setTimeSlots(slots);
  };

  const addToCart = (item: MenuItem) => {
    setCartItems(prev => {
      const existingItemIndex = prev.findIndex(i => i.id === item.id);
      if (existingItemIndex !== -1) {
        const newCartItems = [...prev];
        newCartItems[existingItemIndex] = { ...newCartItems[existingItemIndex], quantity: (newCartItems[existingItemIndex].quantity || 0) + 1 };
        return newCartItems;
      } else {
        return [...prev, { ...item, quantity: 1 }];
      }
    });

    setCartQuantities(prev => ({
      ...prev,
      [item.id]: (prev[item.id] || 0) + 1,
    }));
  };

  const removeFromCart = (itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
    setCartQuantities(prev => {
      const newQuantities = { ...prev };
      delete newQuantities[itemId];
      return newQuantities;
    });
  };

  const updateCartQuantity = (itemId: string, quantity: number) => {
    setCartItems(prev => {
      return prev.map(item => {
        if (item.id === itemId) {
          return { ...item, quantity: quantity };
        }
        return item;
      });
    });
    setCartQuantities(prev => ({
      ...prev,
      [itemId]: quantity,
    }));
  };

  const clearCart = () => {
    setCartItems([]);
    setCartQuantities({});
  };

  const cartTotal = cartItems.reduce((total, item) => total + (item.price * (item.quantity || 0)), 0);

  const generateDailyToken = (): string => {
    const today = new Date().toISOString().split('T')[0];
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${today.replace(/-/g, '').slice(2)}-${randomNum}`;
  };

  const createOrder = async (scheduledTime: string, specialInstructions?: string, paymentId?: string): Promise<string> => {
    if (!user || cartItems.length === 0) return '';

    try {
      const token = generateDailyToken();
      const estimatedTime = cartItems.reduce((total, item) => Math.max(total, item.preparationTime), 0);

      const { data, error } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          items: cartItems,
          total_amount: cartTotal,
          status: 'ordered',
          scheduled_time: scheduledTime,
          token,
          payment_id: paymentId,
          payment_status: paymentId ? 'completed' : 'pending',
          special_instructions: specialInstructions,
          estimated_preparation_time: estimatedTime
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating order:', error);
        toast.error('Failed to create order');
        return '';
      }

      if (data) {
        const newOrder: Order = {
          id: data.id,
          userId: data.user_id,
          items: data.items,
          totalAmount: data.total_amount,
          status: data.status,
          scheduledTime: data.scheduled_time,
          token: data.token,
          paymentId: data.payment_id,
          specialInstructions: data.special_instructions,
          estimatedPreparationTime: data.estimated_preparation_time,
          createdAt: new Date(data.created_at)
        };

        setOrders(prev => [newOrder, ...prev]);
        clearCart();

        // Add notification
        await addNotification({
          userId: user.id,
          title: 'Order Placed Successfully',
          message: `Your order #${token} has been placed and will be ready by ${scheduledTime}`,
          type: 'success',
          read: false
        });

        return data.id;
      }

      return '';
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Failed to create order');
      return '';
    }
  };

  const getRecommendedItems = (limit: number = 8): MenuItem[] => {
    // Basic scoring based on user preferences and ratings
    const dietary = (user?.dietaryRestrictions || []).map(v => v.toLowerCase());
    const avoidAllergens = (user?.allergens || []).map(v => v.toLowerCase());

    const scored = menuItems
      .filter(item => {
        // Filter out items containing allergens
        const itemAllergens = (item.allergens || []).map(v => v.toLowerCase());
        if (itemAllergens.some(a => avoidAllergens.includes(a))) return false;
        // Dietary: if user is vegetarian/vegan, enforce
        if (dietary.includes('vegan') && !item.isVeg) return false;
        if (dietary.includes('vegetarian') && !item.isVeg) return false;
        if (dietary.includes('gluten-free') && (item.ingredients || []).some(i => /gluten|wheat/i.test(i))) return false;
        return item.isAvailable;
      })
      .map(item => {
        let score = 0;
        // Higher rating and more reviews
        score += (item.averageRating || 0) * 2;
        score += Math.min(item.reviewCount || 0, 50) / 10;
        // Boost veg if user prefers veg/vegan
        if (item.isVeg && (dietary.includes('vegetarian') || dietary.includes('vegan'))) score += 2;
        // Prefer moderate spice by default
        const spice = item.spiceLevel || 0;
        score += 2 - Math.abs(spice - 2);
        return { item, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => s.item);

    return scored;
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (!error) {
        setOrders(prev =>
          prev.map(order => {
            if (order.id === orderId) {
              // Add notification for status change
              const statusMessages = {
                preparing: 'Your order is being prepared',
                ready: 'Your order is ready for pickup',
                served: 'Your order has been served',
                cancelled: 'Your order has been cancelled'
              };

              if (statusMessages[status]) {
                addNotification({
                  userId: order.userId,
                  title: `Order ${status.charAt(0).toUpperCase() + status.slice(1)}`,
                  message: `${statusMessages[status]} - Token: ${order.token}`,
                  type: status === 'cancelled' ? 'error' : 'info',
                  read: false
                });
              }

              return { ...order, status };
            }
            return order;
          })
        );
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const addReview = async (menuItemId: string, rating: number, comment: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('reviews')
        .insert({
          user_id: user.id,
          user_name: user.name,
          menu_item_id: menuItemId,
          rating,
          comment
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding review:', error);
        toast.error('Failed to add review');
        return;
      }

      if (data) {
        const newReview: Review = {
          id: data.id,
          userId: data.user_id,
          userName: data.user_name,
          menuItemId: data.menu_item_id,
          rating: data.rating,
          comment: data.comment,
          createdAt: new Date(data.created_at)
        };

        setReviews(prev => [newReview, ...prev]);

        // Update menu item rating
        const itemReviews = [...reviews.filter(r => r.menuItemId === menuItemId), newReview];
        const averageRating = itemReviews.reduce((sum, r) => sum + r.rating, 0) / itemReviews.length;
        const reviewCount = itemReviews.length;

        await supabase
          .from('menu_items')
          .update({
            average_rating: Math.round(averageRating * 10) / 10,
            review_count: reviewCount
          })
          .eq('id', menuItemId);

        setMenuItems(prev =>
          prev.map(item =>
            item.id === menuItemId ? {
              ...item,
              averageRating: Math.round(averageRating * 10) / 10,
              reviewCount
            } : item
          )
        );

        toast.success('Review added successfully!');
      }
    } catch (error) {
      console.error('Error adding review:', error);
      toast.error('Failed to add review');
    }
  };

  const addNotification = async (notification: Omit<Notification, 'id' | 'createdAt'>) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: notification.userId,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          read: notification.read
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding notification:', error);
        return;
      }

      if (data) {
        const newNotification: Notification = {
          id: data.id,
          userId: data.user_id,
          title: data.title,
          message: data.message,
          type: data.type,
          read: data.read,
          createdAt: new Date(data.created_at)
        };
        setNotifications(prev => [newNotification, ...prev]);
      }
    } catch (error) {
      console.error('Error adding notification:', error);
    }
  };

  const markNotificationRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (!error) {
        setNotifications(prev =>
          prev.map(notif =>
            notif.id === notificationId ? { ...notif, read: true } : notif
          )
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Manager functions
  const addMenuItem = async (item: Omit<MenuItem, 'id' | 'averageRating' | 'reviewCount'>) => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .insert({
          name: item.name,
          description: item.description,
          price: item.price,
          category: item.category,
          image: item.image,
          is_veg: item.isVeg,
          cuisine: item.cuisine,
          spice_level: item.spiceLevel,
          allergens: item.allergens,
          nutritional_info: item.nutritionalInfo,
          is_available: item.isAvailable,
          ingredients: item.ingredients,
          average_rating: 0,
          review_count: 0,
          preparation_time: item.preparationTime
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding menu item:', error);
        toast.error('Failed to add menu item');
        return;
      }

      if (data) {
        const newItem: MenuItem = {
          id: data.id,
          name: data.name,
          description: data.description,
          price: data.price,
          category: data.category,
          image: data.image,
          isVeg: data.is_veg,
          cuisine: data.cuisine,
          spiceLevel: data.spice_level,
          allergens: data.allergens || [],
          nutritionalInfo: data.nutritional_info || { calories: 0, protein: 0, carbs: 0, fat: 0 },
          isAvailable: data.is_available,
          ingredients: data.ingredients || [],
          averageRating: data.average_rating,
          reviewCount: data.review_count,
          preparationTime: data.preparation_time
        };
        setMenuItems(prev => [...prev, newItem]);
        toast.success('Menu item added successfully!');
      }
    } catch (error) {
      console.error('Error adding menu item:', error);
      toast.error('Failed to add menu item');
    }
  };

  const updateMenuItem = async (itemId: string, updates: Partial<MenuItem>) => {
    try {
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.price !== undefined) updateData.price = updates.price;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.image !== undefined) updateData.image = updates.image;
      if (updates.isVeg !== undefined) updateData.is_veg = updates.isVeg;
      if (updates.cuisine !== undefined) updateData.cuisine = updates.cuisine;
      if (updates.spiceLevel !== undefined) updateData.spice_level = updates.spiceLevel;
      if (updates.allergens !== undefined) updateData.allergens = updates.allergens;
      if (updates.nutritionalInfo !== undefined) updateData.nutritional_info = updates.nutritionalInfo;
      if (updates.isAvailable !== undefined) updateData.is_available = updates.isAvailable;
      if (updates.ingredients !== undefined) updateData.ingredients = updates.ingredients;
      if (updates.preparationTime !== undefined) updateData.preparation_time = updates.preparationTime;

      const { error } = await supabase
        .from('menu_items')
        .update(updateData)
        .eq('id', itemId);

      if (!error) {
        setMenuItems(prev =>
          prev.map(item =>
            item.id === itemId ? { ...item, ...updates } : item
          )
        );
        toast.success('Menu item updated successfully!');
      } else {
        console.error('Error updating menu item:', error);
        toast.error('Failed to update menu item');
      }
    } catch (error) {
      console.error('Error updating menu item:', error);
      toast.error('Failed to update menu item');
    }
  };

  const deleteMenuItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', itemId);

      if (!error) {
        setMenuItems(prev => prev.filter(item => item.id !== itemId));
        toast.success('Menu item deleted successfully!');
      } else {
        console.error('Error deleting menu item:', error);
        toast.error('Failed to delete menu item');
      }
    } catch (error) {
      console.error('Error deleting menu item:', error);
      toast.error('Failed to delete menu item');
    }
  };

  return (
    <AppContext.Provider
      value={{
        // Menu & Cart
        menuItems,
        cartItems,
        cartQuantities,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartTotal,

        // Orders
        orders,
        createOrder,
        updateOrderStatus,

        // Reviews
        reviews,
        addReview,

        // Time Slots
        timeSlots,
        generateTimeSlots,

        // Notifications
        notifications,
        addNotification,
        markNotificationRead,

        // Manager functions
        addMenuItem,
        updateMenuItem,
        deleteMenuItem,

        // Search & Filter
        searchTerm,
        setSearchTerm,
        selectedCategory,
        setSelectedCategory,

        // Utilities
        generateDailyToken,

        // Recommendations
        getRecommendedItems
      }}
    >
      {children}
    </AppContext.Provider>
  );
};