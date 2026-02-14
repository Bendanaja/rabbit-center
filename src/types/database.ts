export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          user_id: string
          display_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          theme: 'light' | 'dark' | 'system'
          language: string
          default_model: string
          notifications_enabled: boolean
          sound_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          theme?: 'light' | 'dark' | 'system'
          language?: string
          default_model?: string
          notifications_enabled?: boolean
          sound_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          theme?: 'light' | 'dark' | 'system'
          language?: string
          default_model?: string
          notifications_enabled?: boolean
          sound_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      chats: {
        Row: {
          id: string
          user_id: string
          title: string
          model_id: string
          is_pinned: boolean
          is_archived: boolean
          share_token: string | null
          is_shared: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string
          model_id?: string
          is_pinned?: boolean
          is_archived?: boolean
          share_token?: string | null
          is_shared?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          model_id?: string
          is_pinned?: boolean
          is_archived?: boolean
          share_token?: string | null
          is_shared?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          chat_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          model_id: string | null
          tokens_used: number | null
          created_at: string
        }
        Insert: {
          id?: string
          chat_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          model_id?: string | null
          tokens_used?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          chat_id?: string
          role?: 'user' | 'assistant' | 'system'
          content?: string
          model_id?: string | null
          tokens_used?: number | null
          created_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan_id: string
          status: 'active' | 'cancelled' | 'expired' | 'past_due'
          current_period_start: string | null
          current_period_end: string | null
          cancel_at_period_end: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_id?: string
          status?: 'active' | 'cancelled' | 'expired' | 'past_due'
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_id?: string
          status?: 'active' | 'cancelled' | 'expired' | 'past_due'
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      usage_records: {
        Row: {
          id: string
          user_id: string
          date: string
          messages_sent: number
          tokens_used: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date?: string
          messages_sent?: number
          tokens_used?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          messages_sent?: number
          tokens_used?: number
          created_at?: string
        }
      }
      payment_history: {
        Row: {
          id: string
          user_id: string
          amount: number
          currency: string
          status: 'pending' | 'completed' | 'failed' | 'refunded'
          payment_method: string | null
          stripe_payment_id: string | null
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          currency?: string
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          payment_method?: string | null
          stripe_payment_id?: string | null
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          currency?: string
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          payment_method?: string | null
          stripe_payment_id?: string | null
          description?: string | null
          created_at?: string
        }
      }
      api_keys: {
        Row: {
          id: string
          user_id: string
          name: string
          key_hash: string
          key_preview: string
          last_used_at: string | null
          expires_at: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          key_hash: string
          key_preview: string
          last_used_at?: string | null
          expires_at?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          key_hash?: string
          key_preview?: string
          last_used_at?: string | null
          expires_at?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
      ai_models: {
        Row: {
          id: string
          name: string
          provider: string
          model_id: string
          description: string | null
          icon: string | null
          is_available: boolean
          is_free: boolean
          tokens_per_message: number | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          provider: string
          model_id: string
          description?: string | null
          icon?: string | null
          is_available?: boolean
          is_free?: boolean
          tokens_per_message?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          provider?: string
          model_id?: string
          description?: string | null
          icon?: string | null
          is_available?: boolean
          is_free?: boolean
          tokens_per_message?: number | null
          created_at?: string
        }
      }
      pricing_plans: {
        Row: {
          id: string
          name: string
          description: string | null
          price_monthly: number
          price_yearly: number
          features: Json
          message_limit: number | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          price_monthly?: number
          price_yearly?: number
          features?: Json
          message_limit?: number | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price_monthly?: number
          price_yearly?: number
          features?: Json
          message_limit?: number | null
          is_active?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Convenience types
export type UserProfile = Tables<'user_profiles'>
export type UserSettings = Tables<'user_settings'>
export type Chat = Tables<'chats'>
export type Message = Tables<'messages'>
export type Subscription = Tables<'subscriptions'>
export type UsageRecord = Tables<'usage_records'>
export type PaymentHistory = Tables<'payment_history'>
export type ApiKey = Tables<'api_keys'>
export type AiModel = Tables<'ai_models'>
export type PricingPlan = Tables<'pricing_plans'>
