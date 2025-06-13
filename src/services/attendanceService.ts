import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'

type Attendance = Database['public']['Tables']['attendance']['Row']
type NewAttendance = Database['public']['Tables']['attendance']['Insert']
type UpdateAttendance = Database['public']['Tables']['attendance']['Update']

export const attendanceService = {
  async getAttendanceByDateRange(startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('attendance')
      .select(`
        *,
        employees (
          id,
          name,
          email,
          hourly_rate
        )
      `)
      .gte('check_in_time', startDate)
      .lte('check_in_time', endDate)
      .order('check_in_time', { ascending: false })
    
    if (error) throw error
    return data as (Attendance & { employees: Database['public']['Tables']['employees']['Row'] })[]
  },

  async getEmployeeAttendance(employeeId: string, startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', employeeId)
      .gte('check_in_time', startDate)
      .lte('check_in_time', endDate)
      .order('check_in_time', { ascending: false })
    
    if (error) throw error
    return data as Attendance[]
  },

  async createAttendance(attendance: NewAttendance) {
    const { data, error } = await supabase
      .from('attendance')
      .insert(attendance)
      .select()
      .single()
    
    if (error) throw error
    return data as Attendance
  },

  async updateAttendance(id: string, updates: UpdateAttendance) {
    const { data, error } = await supabase
      .from('attendance')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as Attendance
  },

  async deleteAttendance(id: string) {
    const { error } = await supabase
      .from('attendance')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
} 