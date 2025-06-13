import { supabase } from '../config/supabase'
import type { Database } from '../config/supabase'

type Employee = Database['public']['Tables']['employees']['Row']
type NewEmployee = Database['public']['Tables']['employees']['Insert']
type UpdateEmployee = Database['public']['Tables']['employees']['Update']

type Attendance = Database['public']['Tables']['attendance']['Row']
type NewAttendance = Database['public']['Tables']['attendance']['Insert']
type UpdateAttendance = Database['public']['Tables']['attendance']['Update']

type PayrollPeriod = Database['public']['Tables']['payroll_periods']['Row']
type NewPayrollPeriod = Database['public']['Tables']['payroll_periods']['Insert']
type UpdatePayrollPeriod = Database['public']['Tables']['payroll_periods']['Update']

export const database = {
  // Employee operations
  employees: {
    async getAll() {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('name')
      
      if (error) throw error
      return data as Employee[]
    },

    async getById(id: string) {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data as Employee
    },

    async create(employee: NewEmployee) {
      const { data, error } = await supabase
        .from('employees')
        .insert(employee)
        .select()
        .single()
      
      if (error) throw error
      return data as Employee
    },

    async update(id: string, updates: UpdateEmployee) {
      const { data, error } = await supabase
        .from('employees')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data as Employee
    },

    async delete(id: string) {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    }
  },

  // Attendance operations
  attendance: {
    async getByDateRange(startDate: string, endDate: string) {
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
      return data as (Attendance & { employees: Employee })[]
    },

    async getByEmployee(employeeId: string, startDate: string, endDate: string) {
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

    async create(attendance: NewAttendance) {
      const { data, error } = await supabase
        .from('attendance')
        .insert(attendance)
        .select()
        .single()
      
      if (error) throw error
      return data as Attendance
    },

    async update(id: string, updates: UpdateAttendance) {
      const { data, error } = await supabase
        .from('attendance')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data as Attendance
    },

    async delete(id: string) {
      const { error } = await supabase
        .from('attendance')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    }
  },

  // Payroll period operations
  payrollPeriods: {
    async getAll() {
      const { data, error } = await supabase
        .from('payroll_periods')
        .select('*')
        .order('start_date', { ascending: false })
      
      if (error) throw error
      return data as PayrollPeriod[]
    },

    async getById(id: string) {
      const { data, error } = await supabase
        .from('payroll_periods')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data as PayrollPeriod
    },

    async create(period: NewPayrollPeriod) {
      const { data, error } = await supabase
        .from('payroll_periods')
        .insert(period)
        .select()
        .single()
      
      if (error) throw error
      return data as PayrollPeriod
    },

    async update(id: string, updates: UpdatePayrollPeriod) {
      const { data, error } = await supabase
        .from('payroll_periods')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data as PayrollPeriod
    },

    async delete(id: string) {
      const { error } = await supabase
        .from('payroll_periods')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    }
  }
} 