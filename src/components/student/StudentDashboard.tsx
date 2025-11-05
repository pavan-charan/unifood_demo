import React, { useState } from 'react';
import { 
  Home, 
  Search, 
  ShoppingCart, 
  Clock, 
  Bell,
  Heart,
  User,
  Award,
  TrendingUp,
  Star
} from 'lucide-react';
import { useRecommendations } from '../../contexts/RecommendationContext';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { MenuBrowser } from './MenuBrowser';
import { AlertTriangle } from 'lucide-react';
import { MenuItem } from '../../types';
import { Cart } from './Cart';
import { OrderTracking } from './OrderTracking';

type TabType = 'profile' | 'menu' | 'cart' | 'orders' ;

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { getProfileRecommendations, allergenAlert, setAllergenAlert } = useRecommendations();
  const { 
    orders, 
    notifications, 
    cartItems, 
    menuItems,
    reviews
  } = useApp();

  const [activeTab, setActiveTab] = useState<TabType>('profile');

  const userOrders = orders.filter(order => order.userId === user?.id);
  const activeOrders = userOrders.filter(order => 
    ['ordered', 'preparing', 'ready'].includes(order.status)
  );
  const completedOrders = userOrders.filter(order => order.status === 'served');
  const unreadNotifications = notifications.filter(n => n.userId === user?.id && !n.read);
  
  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const totalSpent = completedOrders.reduce((total, order) => total + order.totalAmount, 0);
  const favoriteItems = menuItems.filter(item => item.averageRating >= 4.5).slice(0, 3);
  const recommended = getProfileRecommendations();

  const tabs = [
    
    { id: 'profile', label: 'Profile', icon: User, count: 0 },
    { id: 'menu', label: 'Menu', icon: Search, count: 0 },
    { id: 'cart', label: 'Cart', icon: ShoppingCart, count: cartItemCount },
    { id: 'orders', label: 'Orders', icon: Clock, count: activeOrders.length }
  ];

  const renderDashboardOverview = () => (
    <div className="min-h-screen bg-gray-50 py-8 mb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name?.split(' ')[0]}!</h1>
              <p className="text-blue-100">Ready to order some delicious food?</p>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2 mb-2">
                <Award className="w-5 h-5" />
                <span className="text-sm">Loyalty Points</span>
              </div>
              <p className="text-2xl font-bold">{user?.loyaltyPoints || 0}</p>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {recommended.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Recommended for you</h2>
              <Star className="w-5 h-5 text-yellow-500" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recommended.map(item => (
                <div key={item.id} className="flex items-center space-x-3">
                  <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                    <div className="flex items-center space-x-2 text-xs text-gray-600">
                      <span>₹{item.price}</span>
                      <span>•</span>
                      <span>{item.cuisine}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Orders</p>
                <p className="text-2xl font-bold text-blue-600">{activeOrders.length}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cart Items</p>
                <p className="text-2xl font-bold text-green-600">{cartItemCount}</p>
              </div>
              <ShoppingCart className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-orange-600">{completedOrders.length}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold text-purple-600">₹{totalSpent.toFixed(0)}</p>
              </div>
              <Award className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Orders */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Active Orders</h2>
              <button 
                onClick={() => setActiveTab('orders')}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View All
              </button>
            </div>

            {activeOrders.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No active orders</p>
                <button 
                  onClick={() => setActiveTab('menu')}
                  className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Browse Menu
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {activeOrders.slice(0, 3).map(order => (
                  <div key={order.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Order #{order.token}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === 'ready' ? 'bg-green-100 text-green-800' :
                        order.status === 'preparing' ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {order.items.length} items • ₹{order.totalAmount} • Pickup: {order.scheduledTime}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notifications & Quick Actions */}
          <div className="space-y-6">
            {/* Notifications */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                <Bell className="w-5 h-5 text-gray-600" />
              </div>

              {unreadNotifications.length === 0 ? (
                <p className="text-gray-600 text-sm">No new notifications</p>
              ) : (
                <div className="space-y-3">
                  {unreadNotifications.slice(0, 3).map(notification => (
                    <div key={notification.id} className="p-3 bg-blue-50 rounded-lg">
                      <p className="font-medium text-gray-900 text-sm">{notification.title}</p>
                      <p className="text-gray-600 text-xs">{notification.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Popular Items */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Items</h3>
              <div className="space-y-3">
                {favoriteItems.map(item => (
                  <div key={item.id} className="flex items-center space-x-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                      <div className="flex items-center space-x-1">
                        <Star className="w-3 h-3 text-yellow-400 fill-current" />
                        <span className="text-xs text-gray-600">{item.averageRating}</span>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-blue-600">₹{item.price}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return renderDashboardOverview();
      case 'menu':
        return <MenuBrowser checkAllergen={checkAllergen} />;
      case 'cart':
        return <Cart />;
      case 'orders':
        return <OrderTracking />;
      default:
        return renderDashboardOverview();
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="flex-1">
        {activeTab === 'profile' ? renderDashboardOverview() : (
          <div className="py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {renderContent()}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex justify-around max-w-md mx-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              <div className="relative">
                <tab.icon className="w-6 h-6" />
                {tab.count > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {tab.count}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium mt-1">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
      {allergenAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
            <div className="p-6 text-center">
              <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Allergen Warning</h3>
              <p className="text-gray-600 mb-6">
                The item you have added in the cart is an allergen to you.
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setAllergenAlert(null)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={allergenAlert.proceed}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Proceed
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};