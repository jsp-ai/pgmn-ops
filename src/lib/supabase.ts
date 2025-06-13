import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Type definitions for our database tables
export type Database = {
  public: {
    Tables: {
      employees: {
        Row: {
          id: string
          slack_user_id: string
          name: string
          email: string
          hourly_rate: number
          status: 'active' | 'inactive'
          created_at: string
          updated_at: string
          notes?: string
        }
        Insert: Omit<Database['public']['Tables']['employees']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['employees']['Insert']>
      }
      attendance: {
        Row: {
          id: string
          employee_id: string
          check_in_time: string
          check_out_time?: string
          status: 'present' | 'absent' | 'late' | 'wfh'
          minutes_late?: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['attendance']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['attendance']['Insert']>
      }
      payroll_periods: {
        Row: {
          id: string
          start_date: string
          end_date: string
          status: 'draft' | 'approved' | 'paid'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['payroll_periods']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['payroll_periods']['Insert']>
      }
    }
  }
} 