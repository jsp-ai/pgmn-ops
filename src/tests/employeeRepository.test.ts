import { describe, it, expect, beforeEach, vi } from 'vitest';
import { employeeRepository } from '../repositories/employeeRepository';
import { EmployeeFormData } from '../types';

// Mock the storage service
vi.mock('../services/storageService', () => ({
  storageService: {
    save: vi.fn().mockResolvedValue({ success: true }),
    load: vi.fn().mockResolvedValue({ success: true, data: [] })
  }
}));

// Mock the error service
vi.mock('../services/errorService', () => ({
  errorService: {
    withErrorHandling: vi.fn().mockImplementation(async (operation) => {
      try {
        const data = await operation();
        return { success: true, data };
      } catch (error) {
        return { success: false, error: { message: (error as Error).message } };
      }
    }),
    handleError: vi.fn()
  }
}));

// Mock the static data
vi.mock('../data/employees.json', () => ({
  default: [
    {
      id: 'emp_001',
      slack_user_id: 'U01234567',
      name: 'John Smith',
      email: 'john@company.com',
      hourly_rate: 25.00
    },
    {
      id: 'emp_002',
      slack_user_id: 'U01234568',
      name: 'Jane Doe',
      email: 'jane@company.com',
      hourly_rate: 30.00
    }
  ]
}));

describe('EmployeeRepository', () => {
  beforeEach(() => {
    // Reset the repository instance before each test
    (employeeRepository as any).cache = [];
    (employeeRepository as any).isInitialized = false;
  });

  describe('initialize', () => {
    it('should initialize with static data when no storage data exists', async () => {
      const result = await employeeRepository.initialize();
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.length).toBe(2);
      expect(result.data?.[0].name).toBe('John Smith');
      expect(result.data?.[0].status).toBe('active');
    });

    it('should return cached data if already initialized', async () => {
      // Initialize once
      await employeeRepository.initialize();
      
      // Initialize again
      const result = await employeeRepository.initialize();
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  describe('findAll', () => {
    beforeEach(async () => {
      await employeeRepository.initialize();
    });

    it('should return all employees without filters', async () => {
      const employees = await employeeRepository.findAll();
      
      expect(employees.length).toBe(2);
      expect(employees[0].name).toBe('Jane Doe'); // Sorted by name asc by default
      expect(employees[1].name).toBe('John Smith');
    });

    it('should filter by status', async () => {
      const employees = await employeeRepository.findAll({ status: 'active' });
      
      expect(employees.length).toBe(2);
      expect(employees.every(emp => emp.status === 'active')).toBe(true);
    });

    it('should filter by search term', async () => {
      const employees = await employeeRepository.findAll({ searchTerm: 'john' });
      
      expect(employees.length).toBe(1);
      expect(employees[0].name).toBe('John Smith');
    });

    it('should sort employees correctly', async () => {
      const employees = await employeeRepository.findAll(
        undefined,
        { field: 'hourly_rate', direction: 'desc' }
      );
      
      expect(employees[0].hourly_rate).toBe(30.00);
      expect(employees[1].hourly_rate).toBe(25.00);
    });
  });

  describe('create', () => {
    beforeEach(async () => {
      await employeeRepository.initialize();
    });

    it('should create a new employee with valid data', async () => {
      const formData: EmployeeFormData = {
        name: 'Alice Johnson',
        email: 'alice@company.com',
        slack_user_id: 'U01234569',
        hourly_rate: '35.00',
        notes: 'Senior developer'
      };

      const result = await employeeRepository.create(formData);
      
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Alice Johnson');
      expect(result.data?.id).toBe('emp_003');
      expect(result.data?.status).toBe('active');
      expect(result.data?.created_at).toBeDefined();
    });

    it('should reject invalid email', async () => {
      const formData: EmployeeFormData = {
        name: 'Bob Wilson',
        email: 'invalid-email',
        slack_user_id: 'U01234570',
        hourly_rate: '25.00',
        notes: ''
      };

      const result = await employeeRepository.create(formData);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('valid email address');
    });

    it('should reject duplicate email', async () => {
      const formData: EmployeeFormData = {
        name: 'Duplicate User',
        email: 'john@company.com', // Already exists
        slack_user_id: 'U01234571',
        hourly_rate: '25.00',
        notes: ''
      };

      const result = await employeeRepository.create(formData);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Email address already exists');
    });

    it('should reject invalid Slack User ID', async () => {
      const formData: EmployeeFormData = {
        name: 'Test User',
        email: 'test@company.com',
        slack_user_id: 'invalid-slack-id',
        hourly_rate: '25.00',
        notes: ''
      };

      const result = await employeeRepository.create(formData);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Slack User ID must start with U');
    });

    it('should reject invalid hourly rate', async () => {
      const formData: EmployeeFormData = {
        name: 'Test User',
        email: 'test@company.com',
        slack_user_id: 'U01234572',
        hourly_rate: '-5.00',
        notes: ''
      };

      const result = await employeeRepository.create(formData);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Hourly rate must be between');
    });
  });

  describe('update', () => {
    beforeEach(async () => {
      await employeeRepository.initialize();
    });

    it('should update an existing employee', async () => {
      const formData: EmployeeFormData = {
        name: 'John Smith Updated',
        email: 'john.updated@company.com',
        slack_user_id: 'U01234567',
        hourly_rate: '27.50',
        notes: 'Updated notes'
      };

      const result = await employeeRepository.update('emp_001', formData);
      
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('John Smith Updated');
      expect(result.data?.email).toBe('john.updated@company.com');
      expect(result.data?.hourly_rate).toBe(27.50);
      expect(result.data?.updated_at).toBeDefined();
    });

    it('should reject update with non-existent ID', async () => {
      const formData: EmployeeFormData = {
        name: 'Test',
        email: 'test@company.com',
        slack_user_id: 'U01234999',
        hourly_rate: '25.00',
        notes: ''
      };

      const result = await employeeRepository.update('emp_999', formData);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Employee with ID emp_999 not found');
    });
  });

  describe('softDelete', () => {
    beforeEach(async () => {
      await employeeRepository.initialize();
    });

    it('should soft delete an employee', async () => {
      const result = await employeeRepository.softDelete('emp_001');
      
      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('inactive');
      expect(result.data?.updated_at).toBeDefined();
    });

    it('should reject delete with non-existent ID', async () => {
      const result = await employeeRepository.softDelete('emp_999');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Employee with ID emp_999 not found');
    });
  });

  describe('findById and findBySlackId', () => {
    beforeEach(async () => {
      await employeeRepository.initialize();
    });

    it('should find employee by ID', async () => {
      const employee = await employeeRepository.findById('emp_001');
      
      expect(employee).toBeDefined();
      expect(employee?.name).toBe('John Smith');
    });

    it('should return null for non-existent ID', async () => {
      const employee = await employeeRepository.findById('emp_999');
      
      expect(employee).toBeNull();
    });

    it('should find employee by Slack ID', async () => {
      const employee = await employeeRepository.findBySlackId('U01234567');
      
      expect(employee).toBeDefined();
      expect(employee?.name).toBe('John Smith');
    });

    it('should return null for non-existent Slack ID', async () => {
      const employee = await employeeRepository.findBySlackId('U99999999');
      
      expect(employee).toBeNull();
    });
  });
}); 