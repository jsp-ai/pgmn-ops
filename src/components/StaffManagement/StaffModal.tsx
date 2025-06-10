import { useEffect } from 'react';
import { Employee } from '../../types';
import { StaffForm } from './StaffForm';

interface StaffModalProps {
  isOpen: boolean;
  employee?: Employee | null;
  employees: Employee[];
  onSave: (employee: Employee) => void;
  onClose: () => void;
}

export function StaffModal({ isOpen, employee, employees, onSave, onClose }: StaffModalProps) {
  // Handle ESC key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const isEditing = !!employee;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          aria-hidden="true"
          onClick={handleBackdropClick}
        ></div>

        {/* This element is to trick the browser into centering the modal contents. */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          {/* Modal Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900" id="modal-title">
                {isEditing ? 'Edit Employee' : 'Add New Employee'}
              </h3>
              <p className="text-sm text-gray-500">
                {isEditing 
                  ? 'Update employee information and save changes.'
                  : 'Fill in the information for the new employee.'
                }
              </p>
            </div>
            <button
              type="button"
              className="rounded-md bg-white text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <StaffForm
            employee={employee}
            employees={employees}
            onSave={onSave}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
} 