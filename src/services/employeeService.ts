import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'

type Employee = Database['public']['Tables']['employees']['Row']
type NewEmployee = Database['public']['Tables']['employees']['Insert']
type UpdateEmployee = Database['public']['Tables']['employees']['Update']

export const employeeService = {
  async getAllEmployees() {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('name')
    
    if (error) throw error
    return data as Employee[]
  },

  async getEmployeeById(id: string) {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data as Employee
  },

  async createEmployee(employee: NewEmployee) {
    const { data, error } = await supabase
      .from('employees')
      .insert(employee)
      .select()
      .single()
    
    if (error) throw error
    return data as Employee
  },

  async updateEmployee(id: string, updates: UpdateEmployee) {
    const { data, error } = await supabase
      .from('employees')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as Employee
  },

  async deleteEmployee(id: string) {
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
} 