import React, { createContext, useContext, ReactNode, useState } from 'react';
import { useApp } from './AppContext';
import { useAuth } from './AuthContext';
import { MenuItem, Order } from '../types';

interface RecommendationContextType {
  getProfileRecommendations: () => MenuItem[];
  getCartRecommendations: (cartItems: MenuItem[]) => MenuItem[];
  checkAllergen: (item: MenuItem, onProceed: () => void) => void;
  allergenAlert: { item: MenuItem; proceed: () => void } | null;
  setAllergenAlert: React.Dispatch<React.SetStateAction<{ item: MenuItem; proceed: () => void } | null>>;
}

const RecommendationContext = createContext<RecommendationContextType | undefined>(undefined);

export const RecommendationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { menuItems, orders } = useApp();
  const { user } = useAuth();
  const [allergenAlert, setAllergenAlert] = useState<{ item: MenuItem; proceed: () => void } | null>(null);

  const checkAllergen = (item: MenuItem, onProceed: () => void) => {
    const userAllergens = user?.allergens || [];
    const itemAllergens = item.allergens || [];
    const hasAllergen = itemAllergens.some(allergen => userAllergens.includes(allergen));

    if (hasAllergen) {
      setAllergenAlert({
        item,
        proceed: () => {
          onProceed();
          setAllergenAlert(null);
        },
      });
    } else {
      onProceed();
    }
  };

  const getProfileRecommendations = () => {
    if (!user) return menuItems.slice(0, 5);

    // Prioritize dietary restrictions
    if (user.dietaryRestrictions && user.dietaryRestrictions.length > 0) {
      return menuItems.filter(item =>
        user.dietaryRestrictions.every(restriction => {
          const lowerCaseRestriction = restriction.toLowerCase();
          if (lowerCaseRestriction === 'vegetarian' || lowerCaseRestriction === 'veg') {
            return item.isVeg;
          }
          if (lowerCaseRestriction === 'vegan') {
            // A simple check for vegan is to see if it's vegetarian and doesn't contain dairy or egg.
            // This is a basic implementation and could be improved with more detailed ingredient analysis.
            return item.isVeg && !item.allergens.includes('dairy') && !item.allergens.includes('egg');
          }
          if (lowerCaseRestriction === 'gluten-free') {
            return !item.allergens.includes('gluten');
          }
          return true;
        })
      );
    }

    // Fallback to past orders and ratings
    const userOrders = orders.filter(order => order.userId === user.id);
    if (userOrders.length > 0) {
      const orderedItems = userOrders.flatMap(order => order.items);
      const topRatedItems = menuItems.sort((a, b) => b.averageRating - a.averageRating);
      const recommended = [...orderedItems, ...topRatedItems].slice(0, 5);
      return recommended;
    }

    return menuItems.slice(0, 5);
  };

  const getCartRecommendations = (cartItems: MenuItem[]) => {
    if (cartItems.length === 0) return [];

    const cartItemIds = cartItems.map(item => item.id);
    const otherOrders = orders.filter(order =>
      order.items.some(item => cartItemIds.includes(item.id))
    );

    const recommendedItems = otherOrders
      .flatMap(order => order.items)
      .filter(item => !cartItemIds.includes(item.id))
      .slice(0, 3);

    return recommendedItems;
  };

  return (
    <RecommendationContext.Provider value={{ getProfileRecommendations, getCartRecommendations, checkAllergen, allergenAlert, setAllergenAlert }}>
      {children}
    </RecommendationContext.Provider>
  );
};

export const useRecommendations = () => {
  const context = useContext(RecommendationContext);
  if (!context) {
    throw new Error('useRecommendations must be used within a RecommendationProvider');
  }
  return context;
};
