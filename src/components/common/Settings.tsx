import React, { useState, useEffect } from 'react';
import { 
  User, 
  Bell, 
  Shield, 
  Globe, 
  CreditCard, 
  Download,
  Save,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Trash2,
  Plus
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

export const Settings: React.FC = () => {
  const { user, logout, updateProfile, updatePassword } = useAuth();
  const [activeSection, setActiveSection] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    studentId: user?.studentId || '',
    phone: '',
    emergencyContact: '',
    dietaryRestrictions: (user?.dietaryRestrictions || []) as string[],
    allergens: (user?.allergens || []) as string[]
  });

  const [notificationSettings, setNotificationSettings] = useState({
    orderUpdates: true,
    promotions: true,
    systemAlerts: true,
    emailNotifications: true,
    smsNotifications: false
  });

  const [securitySettings, setSecuritySettings] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false
  });

  const [generalSettings, setGeneralSettings] = useState({
    language: 'en',
    theme: 'light',
    currency: 'INR',
    timezone: 'Asia/Kolkata'
  });

  const [paymentMethods, setPaymentMethods] = useState([
    { id: '1', type: 'College Wallet', balance: 1250, isDefault: true },
    { id: '2', type: 'UPI', details: 'student@paytm', isDefault: false }
  ]);

  const sections = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'general', label: 'General', icon: Globe },
    ...(user?.role === 'student' ? [{ id: 'payment', label: 'Payment', icon: CreditCard }] : []),
    { id: 'data', label: 'Data & Privacy', icon: Download }
  ];

  const dietaryOptions = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Keto', 'Low-Sodium'];
  const allergenOptions = ['Nuts', 'Dairy', 'Gluten', 'Eggs', 'Seafood', 'Soy', 'Shellfish'];

  // 🔥 Load settings from localStorage on mount (non-critical fields)
  useEffect(() => {
    if (user) {
      const settingsKey = `unifood_settings_${user.id}`;
      const savedSettings = JSON.parse(localStorage.getItem(settingsKey) || '{}');
      
      // dietaryRestrictions and allergens now come from DB via user
      setProfileData(prev => ({
        ...prev,
        name: user.name,
        email: user.email,
        studentId: user.studentId || '',
        dietaryRestrictions: user.dietaryRestrictions || [],
        allergens: user.allergens || []
      }));
      if (savedSettings.phone) {
        setProfileData(prev => ({ ...prev, phone: savedSettings.phone }));
      }
      if (savedSettings.emergencyContact) {
        setProfileData(prev => ({ ...prev, emergencyContact: savedSettings.emergencyContact }));
      }
      
      // Load notification settings
      if (savedSettings.notifications) {
        setNotificationSettings(savedSettings.notifications);
      }
      
      // Load general settings
      if (savedSettings.general) {
        setGeneralSettings(savedSettings.general);
      }
      
      // Load payment methods
      if (savedSettings.payment) {
        setPaymentMethods(savedSettings.payment);
      }
    }
  }, [user]);

  const handleSave = async (section: string) => {
    if (!user) return;
    
    setSaveStatus('saving');
    
    try {
      if (section === 'profile') {
        // 🔥 Save profile to Supabase database
        const success = await updateProfile(user.id, {
          name: profileData.name,
          studentId: profileData.studentId,
          dietaryRestrictions: profileData.dietaryRestrictions,
          allergens: profileData.allergens
        });
        
        if (!success) {
          setSaveStatus('error');
          setTimeout(() => setSaveStatus('idle'), 3000);
          return;
        }

        // Save non-critical fields to localStorage only
        const settingsKey = `unifood_settings_${user.id}`;
        const currentSettings = JSON.parse(localStorage.getItem(settingsKey) || '{}');
        localStorage.setItem(settingsKey, JSON.stringify({
          ...currentSettings,
          phone: profileData.phone,
          emergencyContact: profileData.emergencyContact
        }));
      } 
      else {
        // For other settings (notifications, general, payment), save to localStorage
        // TODO: These could be moved to a separate settings table in the future
        const settingsKey = `unifood_settings_${user.id}`;
        const currentSettings = JSON.parse(localStorage.getItem(settingsKey) || '{}');
        
        const updatedSettings = {
          ...currentSettings,
          [section]: section === 'notifications' ? notificationSettings :
                    section === 'general' ? generalSettings :
                    section === 'payment' ? paymentMethods : currentSettings[section]
        };
        
        localStorage.setItem(settingsKey, JSON.stringify(updatedSettings));
      }
      
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Save settings error:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleDietaryToggle = (option: string) => {
    setProfileData(prev => ({
      ...prev,
      dietaryRestrictions: prev.dietaryRestrictions.includes(option)
        ? prev.dietaryRestrictions.filter(item => item !== option)
        : [...prev.dietaryRestrictions, option]
    }));
  };

  const handleAllergenToggle = (option: string) => {
    setProfileData(prev => ({
      ...prev,
      allergens: prev.allergens.includes(option)
        ? prev.allergens.filter(item => item !== option)
        : [...prev.allergens, option]
    }));
  };

  const handlePasswordChange = async () => {
    // Validate inputs
    if (!securitySettings.currentPassword || !securitySettings.newPassword || !securitySettings.confirmPassword) {
      setSaveStatus('error');
      toast.error('Please fill in all password fields');
      setTimeout(() => setSaveStatus('idle'), 3000);
      return;
    }

    if (securitySettings.newPassword !== securitySettings.confirmPassword) {
      setSaveStatus('error');
      toast.error('New passwords do not match');
      setTimeout(() => setSaveStatus('idle'), 3000);
      return;
    }
    
    if (securitySettings.newPassword.length < 6) {
      setSaveStatus('error');
      toast.error('Password must be at least 6 characters');
      setTimeout(() => setSaveStatus('idle'), 3000);
      return;
    }

    setSaveStatus('saving');

    // 🔥 Update password in Supabase
    const success = await updatePassword(
      securitySettings.currentPassword,
      securitySettings.newPassword
    );

    if (success) {
      setSaveStatus('success');
      setSecuritySettings({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        twoFactorEnabled: securitySettings.twoFactorEnabled
      });
      setTimeout(() => setSaveStatus('idle'), 2000);
    } else {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const exportData = () => {
    const userData = {
      profile: profileData,
      orders: JSON.parse(localStorage.getItem('unifood_orders') || '[]').filter((order: any) => order.userId === user?.id),
      reviews: JSON.parse(localStorage.getItem('unifood_reviews') || '[]').filter((review: any) => review.userId === user?.id),
      settings: JSON.parse(localStorage.getItem(`unifood_settings_${user?.id}`) || '{}')
    };

    const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `unifood-data-${user?.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const deleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      // In a real app, this would call an API
      localStorage.removeItem('unifood_user');
      localStorage.removeItem(`unifood_settings_${user?.id}`);
      logout();
    }
  };

  const renderProfileSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              value={profileData.name}
              onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={profileData.email}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
            />
          </div>

          {user?.role === 'student' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Student ID</label>
              <input
                type="text"
                value={profileData.studentId}
                onChange={(e) => setProfileData(prev => ({ ...prev, studentId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
            <input
              type="tel"
              value={profileData.phone}
              onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="+91 XXXXX XXXXX"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact</label>
            <input
              type="tel"
              value={profileData.emergencyContact}
              onChange={(e) => setProfileData(prev => ({ ...prev, emergencyContact: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="+91 XXXXX XXXXX"
            />
          </div>
        </div>
      </div>

      {user?.role === 'student' && (
        <>
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Dietary Restrictions</h4>
            <div className="flex flex-wrap gap-2">
              {dietaryOptions.map(option => (
                <button
                  key={option}
                  onClick={() => handleDietaryToggle(option)}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                    profileData.dietaryRestrictions.includes(option)
                      ? 'bg-green-100 text-green-800 border-green-300'
                      : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Allergens</h4>
            <div className="flex flex-wrap gap-2">
              {allergenOptions.map(option => (
                <button
                  key={option}
                  onClick={() => handleAllergenToggle(option)}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                    profileData.allergens.includes(option)
                      ? 'bg-red-100 text-red-800 border-red-300'
                      : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <button
        onClick={() => handleSave('profile')}
        disabled={saveStatus === 'saving'}
        className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        <Save className="w-4 h-4" />
        <span>{saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}</span>
      </button>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h3>
        <div className="space-y-4">
          {Object.entries(notificationSettings).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between py-3 border-b border-gray-200">
              <div>
                <p className="font-medium text-gray-900">
                  {key === 'orderUpdates' && 'Order Updates'}
                  {key === 'promotions' && 'Promotions & Offers'}
                  {key === 'systemAlerts' && 'System Alerts'}
                  {key === 'emailNotifications' && 'Email Notifications'}
                  {key === 'smsNotifications' && 'SMS Notifications'}
                </p>
                <p className="text-sm text-gray-600">
                  {key === 'orderUpdates' && 'Get notified about order status changes'}
                  {key === 'promotions' && 'Receive updates about special offers and discounts'}
                  {key === 'systemAlerts' && 'Important system maintenance and updates'}
                  {key === 'emailNotifications' && 'Receive notifications via email'}
                  {key === 'smsNotifications' && 'Receive notifications via SMS'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => setNotificationSettings(prev => ({
                    ...prev,
                    [key]: e.target.checked
                  }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => handleSave('notifications')}
        disabled={saveStatus === 'saving'}
        className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        <Save className="w-4 h-4" />
        <span>{saveStatus === 'saving' ? 'Saving...' : 'Save Preferences'}</span>
      </button>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={securitySettings.currentPassword}
                onChange={(e) => setSecuritySettings(prev => ({ ...prev, currentPassword: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
            <input
              type="password"
              value={securitySettings.newPassword}
              onChange={(e) => setSecuritySettings(prev => ({ ...prev, newPassword: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
            <input
              type="password"
              value={securitySettings.confirmPassword}
              onChange={(e) => setSecuritySettings(prev => ({ ...prev, confirmPassword: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button
            onClick={handlePasswordChange}
            disabled={saveStatus === 'saving'}
            className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Shield className="w-4 h-4" />
            <span>{saveStatus === 'saving' ? 'Updating...' : 'Update Password'}</span>
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Two-Factor Authentication</h3>
        <div className="flex items-center justify-between p-4 border border-gray-300 rounded-lg">
          <div>
            <p className="font-medium text-gray-900">Enable Two-Factor Authentication</p>
            <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={securitySettings.twoFactorEnabled}
              onChange={(e) => setSecuritySettings(prev => ({ ...prev, twoFactorEnabled: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>
    </div>
  );

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">General Preferences</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
            <select
              value={generalSettings.language}
              onChange={(e) => setGeneralSettings(prev => ({ ...prev, language: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="ml">Malayalam</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
            <select
              value={generalSettings.theme}
              onChange={(e) => setGeneralSettings(prev => ({ ...prev, theme: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
            <select
              value={generalSettings.currency}
              onChange={(e) => setGeneralSettings(prev => ({ ...prev, currency: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="INR">Indian Rupee (₹)</option>
              <option value="USD">US Dollar ($)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
            <select
              value={generalSettings.timezone}
              onChange={(e) => setGeneralSettings(prev => ({ ...prev, timezone: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
              <option value="UTC">UTC</option>
            </select>
          </div>
        </div>
      </div>

      <button
        onClick={() => handleSave('general')}
        disabled={saveStatus === 'saving'}
        className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        <Save className="w-4 h-4" />
        <span>{saveStatus === 'saving' ? 'Saving...' : 'Save Preferences'}</span>
      </button>
    </div>
  );

  const renderPaymentSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h3>
        <div className="space-y-4">
          {paymentMethods.map(method => (
            <div key={method.id} className="flex items-center justify-between p-4 border border-gray-300 rounded-lg">
              <div className="flex items-center space-x-3">
                <CreditCard className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">{method.type}</p>
                  <p className="text-sm text-gray-600">
                    {method.type === 'College Wallet' ? `Balance: ₹${method.balance}` : method.details}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {method.isDefault && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Default</span>
                )}
                <button className="text-red-600 hover:text-red-800">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <button className="flex items-center space-x-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
          <Plus className="w-4 h-4" />
          <span>Add Payment Method</span>
        </button>
      </div>

      {user?.role === 'student' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">College Wallet</h4>
          <p className="text-sm text-blue-800 mb-3">
            Your college wallet balance: <span className="font-bold">₹{paymentMethods[0]?.balance || 0}</span>
          </p>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Add Money to Wallet
          </button>
        </div>
      )}
    </div>
  );

  const renderDataSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Data & Privacy</h3>
        
        <div className="space-y-4">
          <div className="p-4 border border-gray-300 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Export Your Data</h4>
            <p className="text-sm text-gray-600 mb-3">
              Download a copy of all your data including orders, reviews, and preferences.
            </p>
            <button
              onClick={exportData}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export Data</span>
            </button>
          </div>

          <div className="p-4 border border-red-300 rounded-lg bg-red-50">
            <h4 className="font-medium text-red-900 mb-2">Delete Account</h4>
            <p className="text-sm text-red-700 mb-3">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <button
              onClick={deleteAccount}
              className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Account</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return renderProfileSettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'security':
        return renderSecuritySettings();
      case 'general':
        return renderGeneralSettings();
      case 'payment':
        return renderPaymentSettings();
      case 'data':
        return renderDataSettings();
      default:
        return renderProfileSettings();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your account preferences and configuration</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Settings Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <nav className="space-y-1">
                {sections.map(section => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeSection === section.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <section.icon className="w-5 h-5" />
                    <span className="font-medium">{section.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              {renderContent()}
              
              {/* Save Status */}
              {saveStatus === 'success' && (
                <div className="mt-4 flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <p className="text-sm text-green-700">Settings saved successfully!</p>
                </div>
              )}
              
              {saveStatus === 'error' && (
                <div className="mt-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <p className="text-sm text-red-700">Failed to save settings. Please try again.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};