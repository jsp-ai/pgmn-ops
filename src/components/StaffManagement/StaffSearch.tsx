import React, { useState } from 'react';

interface StaffSearchProps {
  searchTerm: string;
  onSearch: (term: string) => void;
  totalResults: number;
  filters: {
    status: 'all' | 'active' | 'inactive';
  };
  onFilterChange: (filters: StaffSearchProps['filters']) => void;
}

export function StaffSearch({ 
  searchTerm, 
  onSearch, 
  totalResults, 
  filters, 
  onFilterChange
}: StaffSearchProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    if (key === 'status') {
      onFilterChange({
        ...filters,
        status: value as 'all' | 'active' | 'inactive'
      });
    }
  };

  const clearFilters = () => {
    onFilterChange({
      status: 'all'
    });
  };

  const hasActiveFilters = filters.status !== 'all';

  return (
    <div className="bg-white p-6 rounded-lg shadow mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 max-w-2xl">
          <div className="flex gap-2">
            {/* Search Input */}
            <div className="flex-1">
              <label htmlFor="search" className="sr-only">
                Search employees
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  id="search"
                  type="text"
                  placeholder="Search by name, email, or ID..."
                  value={searchTerm}
                  onChange={(e) => onSearch(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            {/* Filter Button */}
            <div className="relative">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`inline-flex items-center px-4 py-2 border rounded-md text-sm font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  hasActiveFilters
                    ? 'border-blue-500 text-blue-700 bg-blue-50'
                    : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                }`}
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                </svg>
                Filter
                {hasActiveFilters && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Active
                  </span>
                )}
              </button>

              {/* Filter Dropdown */}
              {isFilterOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-gray-900">Filter Employees</h3>
                      {hasActiveFilters && (
                        <button
                          onClick={clearFilters}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Clear all
                        </button>
                      )}
                    </div>

                    <div className="space-y-4">
                      {/* Status Filter */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Status
                        </label>
                        <select
                          value={filters.status}
                          onChange={(e) => handleFilterChange('status', e.target.value as 'all' | 'active' | 'inactive')}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="all">All Employees</option>
                          <option value="active">Active Only</option>
                          <option value="inactive">Inactive Only</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center text-sm text-gray-600">
          <span className="font-medium">{totalResults}</span>
          <span className="ml-1">employee{totalResults !== 1 ? 's' : ''} found</span>
        </div>
      </div>
    </div>
  );
} 