import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { sendOTPEmail, verifyOTP as verifyOTPLib, generateOTP } from '../lib/email';
import toast from 'react-hot-toast';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: Partial<User> & { password: string }) => Promise<boolean>;
  logout: () => void;
  verifyOTP: (email: string, otp: string) => Promise<boolean>;
  sendOTP: (email: string) => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
  updateProfile: (userId: string, updates: Partial<User>) => Promise<boolean>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Central function to fetch the user's full profile
const fetchUserProfile = async (userId: string) => {
  const { data: profile, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
  
  if (profile) {
    const userData: User = {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      studentId: profile.student_id,
      role: profile.role,
      isVerified: profile.is_verified,
      loyaltyPoints: profile.loyalty_points,
      dietaryRestrictions: profile.dietary_preferences || [],
      allergens: profile.allergens || [],
      createdAt: new Date(profile.created_at)
    };
    return userData;
  }
  return null;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initial check for a session
    const getSession = async () => {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const userData = await fetchUserProfile(session.user.id);
        if (userData) {
          setUser(userData);
        } else {
          console.warn("User session found, but profile not in DB. Logging out.");
          await supabase.auth.signOut();
        }
      }
      setIsLoading(false);
    };

    getSession();

    // Listen for auth state changes and update the user state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        console.log('Auth state changed:', event);
        if (event === 'SIGNED_OUT' || !session) {
          setUser(null);
          setIsLoading(false);
        } else if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          setIsLoading(true);
          const userData = await fetchUserProfile(session.user.id);
          if (userData) {
            setUser(userData);
            if (event === 'SIGNED_IN') {
              toast.success('Successfully logged in!');
            }
          } else {
            console.error("Profile not found after auth event. User needs to register a profile.");
          }
          setIsLoading(false);
        } else {
          setIsLoading(false);
        }
      })();
    });

    return () => {
      subscription.unsubscribe();
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        toast.error(authError.message);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: Partial<User> & { password: string }): Promise<boolean> => {
    setIsLoading(true);
    try {
      if (!userData.email?.endsWith('@iiitkottayam.ac.in')) {
        toast.error('Please use your IIIT Kottayam email address');
        return false;
      }

      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', userData.email)
        .single();

      if (existingUser) {
        toast.error('User already exists with this email');
        return false;
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password
      });

      if (authError) {
        toast.error(authError.message);
        return false;
      }

      if (authData.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            name: userData.name!,
            email: userData.email!,
            student_id: userData.studentId,
            role: 'student',
            is_verified: false,
            loyalty_points: 0,
            dietary_preferences: userData.dietaryRestrictions || [],
            allergens: userData.allergens || []
          });

        if (profileError) {
          console.error('Failed to create user profile:', profileError);
          toast.error('Failed to create user profile. Please try again.');
          return false;
        }

        const otp = generateOTP();
        const otpSent = await sendOTPEmail(userData.email!, otp);
        if (otpSent) {
          toast.success('Registration successful! Please check your email for OTP verification.');
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Registration failed. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const sendOTP = async (email: string): Promise<boolean> => {
    try {
      const otp = generateOTP();
      const success = await sendOTPEmail(email, otp);
      if (success) {
        toast.success('OTP sent to your email');
      } else {
        toast.error('Failed to send OTP');
      }
      return success;
    } catch (error) {
      console.error('Send OTP error:', error);
      toast.error('Failed to send OTP');
      return false;
    }
  };

  const verifyOTP = async (email: string, otp: string): Promise<boolean> => {
    try {
      // 🔍 First check if user is already verified
      const { data: userData } = await supabase
        .from('users')
        .select('is_verified')
        .eq('email', email)
        .single();
      
      if (userData?.is_verified) {
        toast.error('Email already verified. Please login to continue.');
        // Clear any stored credentials since they're trying to verify again
        sessionStorage.removeItem('unifood_temp_registration_email');
        sessionStorage.removeItem('unifood_temp_registration_password');
        return false;
      }

      const isValid = await verifyOTPLib(email, otp);
      if (isValid) {
        // ✅ Update user verification status
        const { error } = await supabase
          .from('users')
          .update({ is_verified: true })
          .eq('email', email);

        if (!error) {
          // 🎉 AUTO-LOGIN: Check if we have stored password from registration
          const storedEmail = sessionStorage.getItem('unifood_temp_registration_email');
          const storedPassword = sessionStorage.getItem('unifood_temp_registration_password');
          
          if (storedEmail === email && storedPassword) {
            // 🔐 Automatically log in the user with stored credentials
            const { error: loginError } = await supabase.auth.signInWithPassword({
              email,
              password: storedPassword
            });
            
            // Clear sensitive data from sessionStorage immediately
            sessionStorage.removeItem('unifood_temp_registration_email');
            sessionStorage.removeItem('unifood_temp_registration_password');
            
            if (!loginError) {
              toast.success('Email verified successfully! Welcome to UniFood! 🎉');
              return true;
            }
          }
          
          // If auto-login fails or no stored password, still mark as success
          toast.success('Email verified successfully! Please login to continue.');
          return true;
        }
      }
      toast.error('Invalid or expired OTP');
      return false;
    } catch (error) {
      console.error('OTP verification error:', error);
      toast.error('OTP verification failed');
      return false;
    }
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    try {
      // 🔥 DEVELOPMENT MODE: Log reset link to console instead of sending email
      const DEMO_MODE = false; // Set to true for console logging only
      
      if (DEMO_MODE) {
        // Store email in localStorage for the UpdatePassword component to use
        localStorage.setItem('demo_reset_email', email);
        
        // Generate a mock reset token for development
        const mockToken = `demo_reset_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const resetLink = `${window.location.origin}/reset-password?token=${mockToken}&type=recovery&email=${encodeURIComponent(email)}`;
        
        console.log('\n🔐 ═══════════════════════════════════════════════════════');
        console.log('💌 PASSWORD RESET LINK (Development Mode)');
        console.log('═══════════════════════════════════════════════════════');
        console.log('📧 Email:', email);
        console.log('🔗 Reset Link:', resetLink);
        console.log('⏰ Generated at:', new Date().toLocaleString());
        console.log('💡 Note: Email stored in localStorage for password update');
        console.log('═══════════════════════════════════════════════════════\n');
        
        toast.success('Password reset link generated! Check browser console.');
        return true;
      }

      // 🌐 PRODUCTION MODE: Send actual email via Supabase
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        // Check if it's a rate limit error
        if (error.message.includes('429') || error.message.toLowerCase().includes('rate limit')) {
          toast.error('Too many requests. Please wait a few minutes and try again.');
          console.log('⚠️ Supabase Rate Limit: Wait 60 seconds before trying again');
        } else {
          toast.error(error.message);
        }
        return false;
      }
      
      console.log('✅ Password reset email sent successfully!');
      console.log('📧 Check your email inbox for the reset link');
      toast.success('Password reset email sent! Check your inbox.');
      return true;
    } catch (error) {
      console.error('Password reset error:', error);
      toast.error('Failed to send password reset email');
      return false;
    }
  };

  const updateProfile = async (userId: string, updates: Partial<User>): Promise<boolean> => {
    try {
      // Prepare updates for database (convert camelCase to snake_case)
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.studentId !== undefined) dbUpdates.student_id = updates.studentId;
      if (updates.loyaltyPoints !== undefined) dbUpdates.loyalty_points = updates.loyaltyPoints;
      if (updates.dietaryRestrictions !== undefined) dbUpdates.dietary_preferences = updates.dietaryRestrictions;
      if (updates.allergens !== undefined) dbUpdates.allergens = updates.allergens;
      
      // Update in Supabase database
      const { error } = await supabase
        .from('users')
        .update({
          ...dbUpdates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('Profile update error:', error);
        toast.error('Failed to update profile');
        return false;
      }

      // Update local user state
      if (user && user.id === userId) {
        setUser({ ...user, ...updates });
      }

      toast.success('Profile updated successfully! 🎉');
      return true;
    } catch (error) {
      console.error('Update profile error:', error);
      toast.error('Failed to update profile');
      return false;
    }
  };

  const updatePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
      if (!user?.email) {
        toast.error('No user session found');
        return false;
      }

      // Verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      });

      if (signInError) {
        toast.error('Current password is incorrect');
        return false;
      }

      // Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        console.error('Password update error:', updateError);
        toast.error(updateError.message || 'Failed to update password');
        return false;
      }

      toast.success('Password updated successfully! 🔐');
      return true;
    } catch (error) {
      console.error('Update password error:', error);
      toast.error('Failed to update password');
      return false;
    }
  };

  const logout = () => {
    supabase.auth.signOut();
    setUser(null);
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      logout,
      verifyOTP,
      sendOTP,
      resetPassword,
      updateProfile,
      updatePassword,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
};