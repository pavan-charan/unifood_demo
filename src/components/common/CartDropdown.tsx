import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  X,
  ArrowRight,
  Info
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

interface CartDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onViewCart: () => void;
}

export const CartDropdown: React.FC<CartDropdownProps> = ({ isOpen, onClose, onViewCart }) => {
  const { cartItems, updateCartQuantity, removeFromCart, cartTotal } = useApp();
  const [selectedItem, setSelectedItem] = useState<any>(null);

  if (!isOpen) return null;

  const taxAmount = cartTotal * 0.05;
  const finalTotal = cartTotal + taxAmount;

  const ItemDetailsModal = ({ item, onClose }: { item: any; onClose: () => void }) => (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full m-4">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold">{item.name}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-48 object-cover rounded-lg mb-4"
        />
        <p className="text-gray-600 mb-3">{item.description}</p>
        <div className="flex justify-between items-center text-sm">
          <span className="font-medium">Price: ₹{item.price}</span>
          <span className="text-gray-500">Quantity: {item.quantity}</span>
        </div>
        {item.allergens && item.allergens.length > 0 && (
          <div className="mt-3 text-sm">
            <span className="font-medium">Allergens: </span>
            <span className="text-gray-600">{item.allergens.join(', ')}</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[45]" onClick={onClose} />
      
      {/* Dropdown */}
      <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border z-[55] flex flex-col" style={{ maxHeight: '80vh' }}>
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <h3 className="text-lg font-semibold text-gray-900">Shopping Cart</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {cartItems.length === 0 ? (
          <div className="p-6 text-center">
            <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Your cart is empty</p>
            <p className="text-sm text-gray-500">Add some delicious items from our menu!</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 space-y-4">
                {cartItems.map(item => (
                  <div key={item.id} className="flex items-start space-x-3">
                    <div 
                      className="relative cursor-pointer group"
                      onClick={() => setSelectedItem(item)}
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 rounded-lg transition-colors">
                        <Info className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">{item.name}</h4>
                      <p className="text-sm text-blue-600 font-semibold">₹{item.price}</p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                            className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                            className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t p-4 space-y-3 bg-white shrink-0">
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">₹{cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax (5%)</span>
                  <span className="font-medium">₹{taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-semibold border-t pt-2">
                  <span>Total</span>
                  <span className="text-blue-600">₹{finalTotal.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  onViewCart();
                  onClose();
                }}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <span>View Cart & Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Item Details Modal */}
      {selectedItem && (
        <ItemDetailsModal 
          item={selectedItem} 
          onClose={() => setSelectedItem(null)} 
        />
      )}
    </>
  );
};