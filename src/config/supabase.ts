import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tvrlorbqcavmoqznbwga.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2cmxvcmJxY2F2bW9xem5id2dhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3ODE2MDUsImV4cCI6MjA2NTM1NzYwNX0.dux8iB7kpwY8jTftARsV1W1yacZn7Tl5qP8zyyrCJbg'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
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