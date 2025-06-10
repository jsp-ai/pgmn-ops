import { useState, useEffect, useCallback } from 'react';
import { Employee, EmployeeFormData } from '../types';
import { employeeRepository, EmployeeFilters, EmployeeSortOptions } from '../repositories/employeeRepository';


export interface UseEmployeesState {
  employees: Employee[];
  filteredEmployees: Employee[];
  isLoading: boolean;
  error: string | null;
  searchTerm: string;
  sortBy: keyof Employee;
  sortDirection: 'asc' | 'desc';
  statusFilter: 'active' | 'inactive' | 'all';
  totalEmployees: number;
  activeEmployeesCount: number;
  inactiveEmployeesCount: number;
}

export interface UseEmployeesActions {
  // Data operations
  refreshEmployees: () => Promise<void>;
  createEmployee: (formData: EmployeeFormData) => Promise<{ success: boolean; employee?: Employee; error?: string }>;
  updateEmployee: (id: string, formData: EmployeeFormData) => Promise<{ success: boolean; employee?: Employee; error?: string }>;
  deleteEmployee: (id: string) => Promise<{ success: boolean; error?: string }>;
  
  // Filtering and sorting
  setSearchTerm: (term: string) => void;
  setSort: (field: keyof Employee, direction?: 'asc' | 'desc') => void;
  setStatusFilter: (status: 'active' | 'inactive' | 'all') => void;
  
  // Utility
  clearError: () => void;
  getEmployeeById: (id: string) => Employee | undefined;
  getActiveEmployees: () => Employee[];
}

export function useEmployees(): UseEmployeesState & UseEmployeesActions {
  const [state, setState] = useState<UseEmployeesState>({
    employees: [],
    filteredEmployees: [],
    isLoading: true,
    error: null,
    searchTerm: '',
    sortBy: 'name',
    sortDirection: 'asc',
    statusFilter: 'active',
    totalEmployees: 0,
    activeEmployeesCount: 0,
    inactiveEmployeesCount: 0
  });

  // Initialize employees on mount
  useEffect(() => {
    initializeEmployees();
  }, []);

  // Filter and sort employees when dependencies change
  useEffect(() => {
    const applyFiltersAndSort = async () => {
      const filters: EmployeeFilters = {
        status: state.statusFilter,
        searchTerm: state.searchTerm
      };

      const sort: EmployeeSortOptions = {
        field: state.sortBy,
        direction: state.sortDirection
      };

      const filtered = await employeeRepository.findAll(filters, sort);
      
      setState(prev => ({
        ...prev,
        filteredEmployees: filtered
      }));
    };

    if (!state.isLoading) {
      applyFiltersAndSort();
    }
  }, [state.employees, state.searchTerm, state.sortBy, state.sortDirection, state.statusFilter, state.isLoading]);

  const initializeEmployees = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    const result = await employeeRepository.initialize();
    
    if (result.success) {
      setState(prev => ({
        ...prev,
        employees: result.data || [],
        isLoading: false,
        error: null
      }));
    } else {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: result.error || 'Failed to load employees'
      }));
    }
  };

  const refreshEmployees = useCallback(async () => {
    await initializeEmployees();
  }, []);

  const createEmployee = useCallback(async (formData: EmployeeFormData) => {
    setState(prev => ({ ...prev, error: null }));
    
    const result = await employeeRepository.create(formData);
    
    if (result.success && result.data) {
      setState(prev => ({
        ...prev,
        employees: [...prev.employees, result.data!]
      }));
      
      return { success: true, employee: result.data };
    } else {
      const errorMessage = result.error || 'Failed to create employee';
      setState(prev => ({ ...prev, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  }, []);

  const updateEmployee = useCallback(async (id: string, formData: EmployeeFormData) => {
    setState(prev => ({ ...prev, error: null }));
    
    const result = await employeeRepository.update(id, formData);
    
    if (result.success && result.data) {
      setState(prev => ({
        ...prev,
        employees: prev.employees.map(emp => 
          emp.id === id ? result.data! : emp
        )
      }));
      
      return { success: true, employee: result.data };
    } else {
      const errorMessage = result.error || 'Failed to update employee';
      setState(prev => ({ ...prev, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  }, []);

  const deleteEmployee = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, error: null }));
    
    const result = await employeeRepository.softDelete(id);
    
    if (result.success && result.data) {
      setState(prev => ({
        ...prev,
        employees: prev.employees.map(emp => 
          emp.id === id ? result.data! : emp
        )
      }));
      
      return { success: true };
    } else {
      const errorMessage = result.error || 'Failed to delete employee';
      setState(prev => ({ ...prev, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  }, []);

  const setSearchTerm = useCallback((term: string) => {
    setState(prev => ({ ...prev, searchTerm: term }));
  }, []);

  const setSort = useCallback((field: keyof Employee, direction?: 'asc' | 'desc') => {
    setState(prev => ({
      ...prev,
      sortBy: field,
      sortDirection: direction || (prev.sortBy === field && prev.sortDirection === 'asc' ? 'desc' : 'asc')
    }));
  }, []);

  const setStatusFilter = useCallback((status: 'active' | 'inactive' | 'all') => {
    setState(prev => ({ ...prev, statusFilter: status }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const getEmployeeById = useCallback((id: string) => {
    return state.employees.find(emp => emp.id === id);
  }, [state.employees]);

  const getActiveEmployees = useCallback(() => {
    return state.employees.filter(emp => emp.status === 'active');
  }, [state.employees]);

  // Update computed values whenever employees change
  useEffect(() => {
    const computedValues = {
      totalEmployees: state.employees.length,
      activeEmployeesCount: state.employees.filter(emp => emp.status === 'active').length,
      inactiveEmployeesCount: state.employees.filter(emp => emp.status === 'inactive').length
    };

    setState(prev => ({
      ...prev,
      ...computedValues
    }));
  }, [state.employees.length, state.employees]);

  return {
    ...state,
    refreshEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    setSearchTerm,
    setSort,
    setStatusFilter,
    clearError,
    getEmployeeById,
    getActiveEmployees
  };
} 