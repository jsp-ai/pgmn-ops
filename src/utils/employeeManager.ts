import { Employee, ValidationResult, EmployeeFormData } from '../types';

const STORAGE_KEYS = {
  EMPLOYEES: 'pgmn-ops-employees',
  BACKUP: 'pgmn-ops-employees-backup',
  LAST_SYNC: 'pgmn-ops-last-sync'
};

// Generate unique employee ID
export function generateEmployeeId(employees: Employee[]): string {
  const maxId = employees
    .map(emp => parseInt(emp.id.replace('emp_', ''), 10))
    .filter(id => !isNaN(id))
    .reduce((max, current) => Math.max(max, current), 0);
  
  const nextId = maxId + 1;
  return `emp_${String(nextId).padStart(3, '0')}`;
}

// Validate employee data
export function validateEmployee(formData: EmployeeFormData, employees: Employee[], editingId?: string): ValidationResult {
  const errors: Record<string, string> = {};

  // Name validation
  if (!formData.name.trim()) {
    errors.name = 'Name is required';
  } else if (formData.name.trim().length < 2 || formData.name.trim().length > 50) {
    errors.name = 'Name must be between 2 and 50 characters';
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!formData.email.trim()) {
    errors.email = 'Email is required';
  } else if (!emailRegex.test(formData.email.trim())) {
    errors.email = 'Please enter a valid email address';
  } else {
    // Check for duplicate email (excluding current employee if editing)
    const duplicateEmail = employees.find(emp => 
      emp.email.toLowerCase() === formData.email.trim().toLowerCase() && 
      emp.id !== editingId
    );
    if (duplicateEmail) {
      errors.email = 'Email address already exists';
    }
  }

  // Slack User ID validation
  const slackIdRegex = /^U[A-Z0-9]{8,}$/;
  if (!formData.slack_user_id.trim()) {
    errors.slack_user_id = 'Slack User ID is required';
  } else if (!slackIdRegex.test(formData.slack_user_id.trim())) {
    errors.slack_user_id = 'Slack User ID must start with U followed by 8+ alphanumeric characters';
  } else {
    // Check for duplicate Slack ID (excluding current employee if editing)
    const duplicateSlackId = employees.find(emp => 
      emp.slack_user_id === formData.slack_user_id.trim() && 
      emp.id !== editingId
    );
    if (duplicateSlackId) {
      errors.slack_user_id = 'Slack User ID already exists';
    }
  }

  // Hourly rate validation
  const hourlyRate = parseFloat(formData.hourly_rate);
  if (!formData.hourly_rate.trim()) {
    errors.hourly_rate = 'Hourly rate is required';
  } else if (isNaN(hourlyRate) || hourlyRate < 0.01 || hourlyRate > 999.99) {
    errors.hourly_rate = 'Hourly rate must be between $0.01 and $999.99';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// Convert form data to Employee object
export function createEmployeeFromForm(formData: EmployeeFormData, id?: string): Employee {
  const now = new Date().toISOString();
  
  return {
    id: id || '', // Will be set by saveEmployee
    name: formData.name.trim(),
    email: formData.email.trim().toLowerCase(),
    slack_user_id: formData.slack_user_id.trim(),
    hourly_rate: parseFloat(formData.hourly_rate),
    status: 'active',
    created_at: now,
    updated_at: now,
    notes: formData.notes.trim() || undefined
  };
}

// Convert Employee to form data
export function employeeToFormData(employee: Employee): EmployeeFormData {
  return {
    name: employee.name,
    email: employee.email,
    slack_user_id: employee.slack_user_id,
    hourly_rate: employee.hourly_rate.toString(),
    notes: employee.notes || ''
  };
}

// Load employees from localStorage
export function loadEmployees(): Employee[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
    if (stored) {
      return JSON.parse(stored);
    }
    
    // Migration: Load from static employees.json data if no localStorage data
    return migrateFromStaticData();
  } catch (error) {
    console.error('Error loading employees:', error);
    return migrateFromStaticData();
  }
}

// Save employees to localStorage
export function saveEmployees(employees: Employee[]): void {
  try {
    // Create backup before saving
    const current = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
    if (current) {
      localStorage.setItem(STORAGE_KEYS.BACKUP, current);
    }
    
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
  } catch (error) {
    console.error('Error saving employees:', error);
    throw new Error('Failed to save employee data');
  }
}

// Save single employee
export function saveEmployee(employee: Employee, employees: Employee[]): Employee[] {
  const updatedEmployees = [...employees];
  const existingIndex = updatedEmployees.findIndex(emp => emp.id === employee.id);
  
  if (existingIndex >= 0) {
    // Update existing employee
    updatedEmployees[existingIndex] = {
      ...employee,
      updated_at: new Date().toISOString()
    };
  } else {
    // Add new employee
    const newEmployee = {
      ...employee,
      id: generateEmployeeId(employees),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    updatedEmployees.push(newEmployee);
  }
  
  saveEmployees(updatedEmployees);
  return updatedEmployees;
}

// Soft delete employee
export function deleteEmployee(id: string, employees: Employee[]): Employee[] {
  const updatedEmployees = employees.map(emp => 
    emp.id === id 
      ? { ...emp, status: 'inactive' as const, updated_at: new Date().toISOString() }
      : emp
  );
  
  saveEmployees(updatedEmployees);
  return updatedEmployees;
}

// Get active employees only
export function getActiveEmployees(employees: Employee[]): Employee[] {
  return employees.filter(emp => emp.status === 'active');
}

// Migration function from static data
function migrateFromStaticData(): Employee[] {
  // This will be populated with static data if needed
  // For now, return empty array - will be handled by the component
  return [];
}

// Search and filter employees
export function filterEmployees(employees: Employee[], searchTerm: string): Employee[] {
  if (!searchTerm.trim()) return employees;
  
  const term = searchTerm.toLowerCase();
  return employees.filter(emp => 
    emp.name.toLowerCase().includes(term) ||
    emp.email.toLowerCase().includes(term) ||
    emp.id.toLowerCase().includes(term) ||
    emp.slack_user_id.toLowerCase().includes(term)
  );
}

// Sort employees
export function sortEmployees(
  employees: Employee[], 
  sortBy: keyof Employee, 
  direction: 'asc' | 'desc'
): Employee[] {
  return [...employees].sort((a, b) => {
    let aVal = a[sortBy];
    let bVal = b[sortBy];
    
    // Handle undefined values
    if (aVal === undefined && bVal === undefined) return 0;
    if (aVal === undefined) return direction === 'asc' ? 1 : -1;
    if (bVal === undefined) return direction === 'asc' ? -1 : 1;
    
    // Handle different data types
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }
    
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
} 