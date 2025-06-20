import { createClient } from '@supabase/supabase-js'

// Use Supabase environment variables that are automatically available
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gywijfcfkwgocsxtxcsj.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5d2lqZmNma3dnb2NzeHR4Y3NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyMzIzODUsImV4cCI6MjA2NTgwODM4NX0.7kCm-PHueAljyreXKSLC-vgCPHfmIwnTOTwg83r3huI'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          bio: string | null
          company: string | null
          job_title: string | null
          location: string | null
          website: string | null
          subscription_plan: 'free' | 'premium'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          job_title?: string | null
          location?: string | null
          website?: string | null
          subscription_plan?: 'free' | 'premium'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          job_title?: string | null
          location?: string | null
          website?: string | null
          subscription_plan?: 'free' | 'premium'
          created_at?: string
          updated_at?: string
        }
      }
      analyses: {
        Row: {
          id: string
          user_id: string
          file_name: string
          file_data: any
          ai_insights: any
          charts_config: any
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          file_name: string
          file_data: any
          ai_insights: any
          charts_config: any
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          file_name?: string
          file_data?: any
          ai_insights?: any
          charts_config?: any
          created_at?: string
        }
      }
    }
    sql_queries: {
      Row: {
        id: string
        user_id: string
        title: string
        prompt: string
        sql_query: string
        table_schemas: any
        execution_result: any
        created_at: string
      }
      Insert: {
        id?: string
        user_id: string
        title: string
        prompt: string
        sql_query: string
        table_schemas?: any
        execution_result?: any
        created_at?: string
      }
      Update: {
        id?: string
        user_id?: string
        title?: string
        prompt?: string
        sql_query?: string
        table_schemas?: any
        execution_result?: any
        created_at?: string
      }
    }
  }
}