import { useState, useEffect } from 'react';
import { Employee, EmployeeFormData } from '../../types';
import { validateEmployee, createEmployeeFromForm, employeeToFormData } from '../../utils/employeeManager';

interface StaffFormProps {
  employee?: Employee | null;
  employees: Employee[];
  onSave: (employee: Employee) => void;
  onCancel: () => void;
}

export function StaffForm({ employee, employees, onSave, onCancel }: StaffFormProps) {
  const [formData, setFormData] = useState<EmployeeFormData>({
    name: '',
    email: '',
    slack_user_id: '',
    hourly_rate: '',
    notes: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const isEditing = !!employee;

  // Load employee data for editing
  useEffect(() => {
    if (employee) {
      setFormData(employeeToFormData(employee));
    } else {
      setFormData({
        name: '',
        email: '',
        slack_user_id: '',
        hourly_rate: '',
        notes: ''
      });
    }
    setErrors({});
    setHasUnsavedChanges(false);
  }, [employee]);

  const handleInputChange = (field: keyof EmployeeFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const validation = validateEmployee(formData, employees, employee?.id);
      
      if (!validation.isValid) {
        setErrors(validation.errors);
        setIsSubmitting(false);
        return;
      }

      const employeeData = createEmployeeFromForm(formData, employee?.id);
      onSave(employeeData);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error saving employee:', error);
      setErrors({ general: 'Failed to save employee. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      const confirmMessage = 'You have unsaved changes. Are you sure you want to cancel?';
      if (!window.confirm(confirmMessage)) {
        return;
      }
    }
    onCancel();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* General Error */}
      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-red-800">{errors.general}</p>
          </div>
        </div>
      )}

      {/* Name Field */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Full Name *
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
            errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
          }`}
          placeholder="Enter full name"
          required
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
      </div>

      {/* Email Field */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email Address *
        </label>
        <input
          type="email"
          id="email"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
            errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
          }`}
          placeholder="Enter email address"
          required
        />
        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
      </div>

      {/* Slack User ID Field */}
      <div>
        <label htmlFor="slack_user_id" className="block text-sm font-medium text-gray-700 mb-1">
          Slack User ID *
        </label>
        <input
          type="text"
          id="slack_user_id"
          value={formData.slack_user_id}
          onChange={(e) => handleInputChange('slack_user_id', e.target.value)}
          className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 font-mono ${
            errors.slack_user_id ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
          }`}
          placeholder="U01234567"
          required
        />
        <p className="mt-1 text-xs text-gray-500">
          Format: U followed by 8+ alphanumeric characters (e.g., U01234567)
        </p>
        {errors.slack_user_id && <p className="mt-1 text-sm text-red-600">{errors.slack_user_id}</p>}
      </div>

      {/* Hourly Rate Field */}
      <div>
        <label htmlFor="hourly_rate" className="block text-sm font-medium text-gray-700 mb-1">
          Hourly Rate *
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">$</span>
          </div>
          <input
            type="number"
            id="hourly_rate"
            value={formData.hourly_rate}
            onChange={(e) => handleInputChange('hourly_rate', e.target.value)}
            className={`block w-full pl-7 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
              errors.hourly_rate ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
            }`}
            placeholder="25.00"
            min="0.01"
            max="999.99"
            step="0.01"
            required
          />
        </div>
        {errors.hourly_rate && <p className="mt-1 text-sm text-red-600">{errors.hourly_rate}</p>}
      </div>

      {/* Notes Field */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          Notes (Optional)
        </label>
        <textarea
          id="notes"
          rows={3}
          value={formData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Additional notes about the employee"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={handleCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </div>
          ) : (
            isEditing ? 'Update Employee' : 'Add Employee'
          )}
        </button>
      </div>
    </form>
  );
} 