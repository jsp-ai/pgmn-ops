interface StaffSearchProps {
  searchTerm: string;
  onSearch: (term: string) => void;
  totalResults: number;
}

export function StaffSearch({ searchTerm, onSearch, totalResults }: StaffSearchProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 max-w-md">
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
        
        <div className="flex items-center text-sm text-gray-600">
          <span className="font-medium">{totalResults}</span>
          <span className="ml-1">employee{totalResults !== 1 ? 's' : ''} found</span>
        </div>
      </div>
    </div>
  );
} 