import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tawnfndnhnrjttchtncd.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhd25mbmRuaG5yanR0Y2h0bmNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyMzkxMDUsImV4cCI6MjA3MjgxNTEwNX0.ppnDZ7KBJ1thV57m46n453u1XyzlPxLUI88wnyFx-Yk'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

// Database Types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          student_id?: string
          role: 'student' | 'manager'
          is_verified: boolean
          loyalty_points: number
          dietary_preferences?: string[]
          allergens?: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          student_id?: string
          role?: 'student' | 'manager'
          is_verified?: boolean
          loyalty_points?: number
          dietary_preferences?: string[]
          allergens?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          student_id?: string
          role?: 'student' | 'manager'
          is_verified?: boolean
          loyalty_points?: number
          dietary_preferences?: string[]
          allergens?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      menu_items: {
        Row: {
          id: string
          name: string
          description: string
          price: number
          category: string
          image: string
          is_veg: boolean
          cuisine: string
          spice_level: number
          allergens: string[]
          nutritional_info: any
          is_available: boolean
          ingredients: string[]
          average_rating: number
          review_count: number
          preparation_time: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          price: number
          category: string
          image: string
          is_veg?: boolean
          cuisine: string
          spice_level?: number
          allergens?: string[]
          nutritional_info?: any
          is_available?: boolean
          ingredients?: string[]
          average_rating?: number
          review_count?: number
          preparation_time?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          price?: number
          category?: string
          image?: string
          is_veg?: boolean
          cuisine?: string
          spice_level?: number
          allergens?: string[]
          nutritional_info?: any
          is_available?: boolean
          ingredients?: string[]
          average_rating?: number
          review_count?: number
          preparation_time?: number
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string
          items: any[]
          total_amount: number
          status: 'ordered' | 'preparing' | 'ready' | 'served' | 'cancelled'
          scheduled_time: string
          token: string
          payment_id?: string
          payment_status: 'pending' | 'completed' | 'failed'
          special_instructions?: string
          estimated_preparation_time: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          items: any[]
          total_amount: number
          status?: 'ordered' | 'preparing' | 'ready' | 'served' | 'cancelled'
          scheduled_time: string
          token: string
          payment_id?: string
          payment_status?: 'pending' | 'completed' | 'failed'
          special_instructions?: string
          estimated_preparation_time: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          items?: any[]
          total_amount?: number
          status?: 'ordered' | 'preparing' | 'ready' | 'served' | 'cancelled'
          scheduled_time?: string
          token?: string
          payment_id?: string
          payment_status?: 'pending' | 'completed' | 'failed'
          special_instructions?: string
          estimated_preparation_time?: number
          created_at?: string
          updated_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          user_id: string
          user_name: string
          menu_item_id: string
          rating: number
          comment: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          user_name: string
          menu_item_id: string
          rating: number
          comment: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          user_name?: string
          menu_item_id?: string
          rating?: number
          comment?: string
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: 'info' | 'success' | 'warning' | 'error'
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type?: 'info' | 'success' | 'warning' | 'error'
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: 'info' | 'success' | 'warning' | 'error'
          read?: boolean
          created_at?: string
        }
      }
      otp_verifications: {
        Row: {
          id: string
          email: string
          otp: string
          expires_at: string
          verified: boolean
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          otp: string
          expires_at: string
          verified?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          otp?: string
          expires_at?: string
          verified?: boolean
          created_at?: string
        }
      }
    }
  }
}