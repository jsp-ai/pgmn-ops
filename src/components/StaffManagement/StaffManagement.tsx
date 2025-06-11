import { useState, useEffect } from 'react';
import { Employee } from '../../types';
import { 
  loadEmployees, 
  saveEmployee, 
  deleteEmployee, 
  getActiveEmployees,
  filterEmployees,
  sortEmployees
} from '../../utils/employeeManager';
import employeesData from '../../data/employees.json';
import { StaffTable } from './StaffTable';
import { StaffModal } from './StaffModal';
import { StaffSearch } from './StaffSearch';
import { StaffStats } from './StaffStats';

export function StaffManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<keyof Employee>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Filter state
  const [filters, setFilters] = useState({
    status: 'all' as 'all' | 'active' | 'inactive'
  });
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Load employees on mount
  useEffect(() => {
    try {
      setIsLoading(true);
      let loadedEmployees = loadEmployees();
      
      // Migration: If no employees in localStorage, migrate from static data
      if (loadedEmployees.length === 0) {
        loadedEmployees = migrateStaticData();
      }
      
      setEmployees(loadedEmployees);
      setError(null);
    } catch (err) {
      console.error('Error loading employees:', err);
      setError('Failed to load employee data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Filter and sort employees whenever data changes
  useEffect(() => {
    let filtered = applyFilters(employees, searchTerm, filters);
    filtered = sortEmployees(filtered, sortBy, sortDirection);
    setFilteredEmployees(filtered);
  }, [employees, searchTerm, filters, sortBy, sortDirection]);

  // Apply all filters (search + advanced filters)
  const applyFilters = (
    employeeList: Employee[], 
    search: string, 
    filterOptions: typeof filters
  ): Employee[] => {
    let result = filterEmployees(employeeList, search);
    
    // Status filter
    if (filterOptions.status !== 'all') {
      result = result.filter(emp => emp.status === filterOptions.status);
    }
    
    return result;
  };

  // Get unique departments and positions for filter dropdowns
  const getAvailableFilters = () => {
    // For now, return empty arrays since Employee type doesn't have these fields
    // This can be extended when department/position fields are added to Employee type
    return { 
      departments: [] as string[], 
      positions: [] as string[] 
    };
  };

  const migrateStaticData = (): Employee[] => {
    // Convert static employees.json to new format
    const migratedEmployees: Employee[] = employeesData.map((emp) => ({
      ...emp,
      status: 'active' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      notes: undefined
    }));
    
    // Save migrated data
    try {
      setEmployees(migratedEmployees);
      return migratedEmployees;
    } catch (error) {
      console.error('Migration failed:', error);
      return migratedEmployees;
    }
  };

  const handleAddEmployee = () => {
    setEditingEmployee(null);
    setIsModalOpen(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsModalOpen(true);
  };

  const handleDeleteEmployee = async (employee: Employee) => {
    const confirmMessage = `Are you sure you want to remove ${employee.name}?\n\nThis will mark them as inactive and they won't appear in future payroll calculations.`;
    
    if (window.confirm(confirmMessage)) {
      try {
        const updatedEmployees = deleteEmployee(employee.id, employees);
        setEmployees(updatedEmployees);
      } catch (err) {
        console.error('Error deleting employee:', err);
        setError('Failed to delete employee');
      }
    }
  };

  const handleSaveEmployee = (employeeData: Employee) => {
    try {
      const updatedEmployees = saveEmployee(employeeData, employees);
      setEmployees(updatedEmployees);
      setIsModalOpen(false);
      setEditingEmployee(null);
      setError(null);
    } catch (err) {
      console.error('Error saving employee:', err);
      setError('Failed to save employee');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEmployee(null);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  const handleSort = (column: keyof Employee) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading employees...</p>
        </div>
      </div>
    );
  }

  const activeEmployees = getActiveEmployees(employees);
  const availableFilters = getAvailableFilters();

  return (
    <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
            <p className="text-gray-600 mt-1">Manage your employee roster and information</p>
          </div>
          <button
            onClick={handleAddEmployee}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Add Employee</span>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-red-800 font-medium">Error</p>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Statistics */}
        <StaffStats 
          totalEmployees={employees.length}
          activeEmployees={activeEmployees.length}
          inactiveEmployees={employees.length - activeEmployees.length}
        />

        {/* Search and Filter */}
        <StaffSearch 
          searchTerm={searchTerm}
          onSearch={handleSearch}
          totalResults={filteredEmployees.length}
          filters={filters}
          onFilterChange={handleFilterChange}
        />

        {/* Employee Table */}
        <StaffTable
          employees={filteredEmployees}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onSort={handleSort}
          onEdit={handleEditEmployee}
          onDelete={handleDeleteEmployee}
        />

        {/* Modal */}
        <StaffModal
          isOpen={isModalOpen}
          employee={editingEmployee}
          employees={employees}
          onSave={handleSaveEmployee}
          onClose={handleCloseModal}
        />
    </div>
  );
} 