import { Employee, EmployeeFormData, ValidationResult } from '../types';
import { storageService, StorageConfig } from '../services/storageService';
import { errorService } from '../services/errorService';
import employeesData from '../data/employees.json';

const EMPLOYEE_STORAGE_CONFIG: StorageConfig = {
  key: 'pgmn-ops-employees',
  version: 2,
  migrations: {
    2: (data: any[]) => {
      // Migration from v1 to v2: ensure all employees have required fields
      return data.map(emp => ({
        ...emp,
        status: emp.status || 'active',
        created_at: emp.created_at || new Date().toISOString(),
        updated_at: emp.updated_at || new Date().toISOString(),
        notes: emp.notes || undefined
      }));
    }
  }
};

export interface EmployeeFilters {
  status?: 'active' | 'inactive' | 'all';
  searchTerm?: string;
}

export interface EmployeeSortOptions {
  field: keyof Employee;
  direction: 'asc' | 'desc';
}

class EmployeeRepository {
  private static instance: EmployeeRepository;
  private cache: Employee[] = [];
  private isInitialized = false;

  static getInstance(): EmployeeRepository {
    if (!EmployeeRepository.instance) {
      EmployeeRepository.instance = new EmployeeRepository();
    }
    return EmployeeRepository.instance;
  }

  async initialize(): Promise<{ success: boolean; data?: Employee[]; error?: string }> {
    if (this.isInitialized) {
      return { success: true, data: this.cache };
    }

    const result = await errorService.withErrorHandling(
      async () => {
        const storageResult = await storageService.load<Employee[]>(EMPLOYEE_STORAGE_CONFIG);
        
        if (!storageResult.success) {
          throw new Error(storageResult.error || 'Failed to load from storage');
        }

        // If no data, migrate from static data
        if (!storageResult.data || storageResult.data.length === 0) {
          const migratedData = this.migrateFromStaticData();
          await this.saveToStorage(migratedData);
          this.cache = migratedData;
        } else {
          this.cache = storageResult.data;
        }

        this.isInitialized = true;
        return this.cache;
      },
      'EMPLOYEE_REPOSITORY',
      'Failed to initialize employee repository'
    );

    return {
      success: result.success,
      data: result.data,
      error: result.error?.message
    };
  }

  async findAll(filters?: EmployeeFilters, sort?: EmployeeSortOptions): Promise<Employee[]> {
    await this.ensureInitialized();
    
    let employees = [...this.cache];

    // Apply filters
    if (filters?.status && filters.status !== 'all') {
      employees = employees.filter(emp => emp.status === filters.status);
    }

    if (filters?.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      employees = employees.filter(emp =>
        emp.name.toLowerCase().includes(term) ||
        emp.email.toLowerCase().includes(term) ||
        emp.id.toLowerCase().includes(term) ||
        emp.slack_user_id.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    if (sort) {
      employees = this.sortEmployees(employees, sort.field, sort.direction);
    }

    return employees;
  }

  async findById(id: string): Promise<Employee | null> {
    await this.ensureInitialized();
    return this.cache.find(emp => emp.id === id) || null;
  }

  async findBySlackId(slackId: string): Promise<Employee | null> {
    await this.ensureInitialized();
    return this.cache.find(emp => emp.slack_user_id === slackId) || null;
  }

  async create(formData: EmployeeFormData): Promise<{ success: boolean; data?: Employee; error?: string }> {
    await this.ensureInitialized();

    const result = await errorService.withErrorHandling(
      async () => {
        const validation = this.validateEmployee(formData);
        if (!validation.isValid) {
          throw new Error(`Validation failed: ${Object.values(validation.errors).join(', ')}`);
        }

        const newEmployee: Employee = {
          id: this.generateId(),
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          slack_user_id: formData.slack_user_id.trim(),
          hourly_rate: parseFloat(formData.hourly_rate),
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          notes: formData.notes.trim() || undefined
        };

        this.cache.push(newEmployee);
        await this.saveToStorage(this.cache);
        return newEmployee;
      },
      'EMPLOYEE_CREATE',
      'Failed to create employee'
    );

    return {
      success: result.success,
      data: result.data,
      error: result.error?.message
    };
  }

  async update(id: string, formData: EmployeeFormData): Promise<{ success: boolean; data?: Employee; error?: string }> {
    await this.ensureInitialized();

    const result = await errorService.withErrorHandling(
      async () => {
        const existingIndex = this.cache.findIndex(emp => emp.id === id);
        if (existingIndex === -1) {
          throw new Error(`Employee with ID ${id} not found`);
        }

        const validation = this.validateEmployee(formData, id);
        if (!validation.isValid) {
          throw new Error(`Validation failed: ${Object.values(validation.errors).join(', ')}`);
        }

        const existing = this.cache[existingIndex];
        const updatedEmployee: Employee = {
          ...existing,
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          slack_user_id: formData.slack_user_id.trim(),
          hourly_rate: parseFloat(formData.hourly_rate),
          notes: formData.notes.trim() || undefined,
          updated_at: new Date().toISOString()
        };

        this.cache[existingIndex] = updatedEmployee;
        await this.saveToStorage(this.cache);
        return updatedEmployee;
      },
      'EMPLOYEE_UPDATE',
      'Failed to update employee'
    );

    return {
      success: result.success,
      data: result.data,
      error: result.error?.message
    };
  }

  async softDelete(id: string): Promise<{ success: boolean; data?: Employee; error?: string }> {
    await this.ensureInitialized();

    const result = await errorService.withErrorHandling(
      async () => {
        const existingIndex = this.cache.findIndex(emp => emp.id === id);
        if (existingIndex === -1) {
          throw new Error(`Employee with ID ${id} not found`);
        }

        const updatedEmployee: Employee = {
          ...this.cache[existingIndex],
          status: 'inactive',
          updated_at: new Date().toISOString()
        };

        this.cache[existingIndex] = updatedEmployee;
        await this.saveToStorage(this.cache);
        return updatedEmployee;
      },
      'EMPLOYEE_DELETE',
      'Failed to delete employee'
    );

    return {
      success: result.success,
      data: result.data,
      error: result.error?.message
    };
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  private async saveToStorage(employees: Employee[]): Promise<void> {
    const result = await storageService.save(EMPLOYEE_STORAGE_CONFIG, employees);
    if (!result.success) {
      throw new Error(result.error || 'Failed to save to storage');
    }
  }

  private generateId(): string {
    const maxId = this.cache
      .map(emp => parseInt(emp.id.replace('emp_', ''), 10))
      .filter(id => !isNaN(id))
      .reduce((max, current) => Math.max(max, current), 0);

    const nextId = maxId + 1;
    return `emp_${String(nextId).padStart(3, '0')}`;
  }

  private validateEmployee(formData: EmployeeFormData, editingId?: string): ValidationResult {
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
      const duplicateEmail = this.cache.find(emp =>
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
      const duplicateSlackId = this.cache.find(emp =>
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

  private sortEmployees(employees: Employee[], sortBy: keyof Employee, direction: 'asc' | 'desc'): Employee[] {
    return [...employees].sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (aVal === undefined && bVal === undefined) return 0;
      if (aVal === undefined) return direction === 'asc' ? 1 : -1;
      if (bVal === undefined) return direction === 'asc' ? -1 : 1;

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  private migrateFromStaticData(): Employee[] {
    return employeesData.map((emp) => ({
      ...emp,
      status: 'active' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      notes: undefined
    }));
  }
}

export const employeeRepository = EmployeeRepository.getInstance(); 