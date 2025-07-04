import React, { useState } from 'react';

interface StaffFilter {
  operator: 'between' | 'gt' | 'gte' | 'lt' | 'lte' | 'eq';
  value1: number;
  value2?: number; // Only for 'between' operator
}

interface Filters {
  startDate: string;
  endDate: string;
  professions: string[];
  countries: string[];
  memberships: string[];
  staffFilter: StaffFilter;
}

interface FilterControlsProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

const FilterControls: React.FC<FilterControlsProps> = ({ filters, onFiltersChange }) => {
  const [openDropdowns, setOpenDropdowns] = useState({
    professions: false,
    countries: false,
    memberships: false
  });

  const handleFilterChange = (key: keyof Filters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const handleMultiSelectChange = (key: 'professions' | 'countries' | 'memberships', value: string) => {
    const currentValues = filters[key];
    let newValues: string[];
    
    if (value === 'all') {
      newValues = [];
    } else if (currentValues.includes(value)) {
      newValues = currentValues.filter(v => v !== value);
    } else {
      newValues = [...currentValues, value];
    }
    
    handleFilterChange(key, newValues);
  };

  const handleStaffFilterChange = (field: keyof StaffFilter, value: any) => {
    const newStaffFilter = {
      ...filters.staffFilter,
      [field]: value
    };
    
    // Reset value2 if not between operator
    if (field === 'operator' && value !== 'between') {
      newStaffFilter.value2 = undefined;
    }
    
    handleFilterChange('staffFilter', newStaffFilter);
  };

  const toggleDropdown = (dropdown: keyof typeof openDropdowns) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [dropdown]: !prev[dropdown]
    }));
  };

  const professionOptions = ['Healthcare', 'Beauty', 'Fitness', 'Education', 'Legal'];
  const countryOptions = ['USA', 'Canada', 'UK', 'Australia', 'India', 'Germany', 'France', 'Japan'];
  const membershipOptions = ['Basic', 'Pro', 'Premium', 'Enterprise'];

  const MultiSelectDropdown = ({ 
    label, 
    options, 
    selectedValues, 
    onValueChange, 
    isOpen, 
    onToggle,
    dropdownKey 
  }: {
    label: string;
    options: string[];
    selectedValues: string[];
    onValueChange: (value: string) => void;
    isOpen: boolean;
    onToggle: () => void;
    dropdownKey: string;
  }) => (
    <div className="relative">
      <label className="block text-sm font-medium mb-2">{label}</label>
      <div 
        className="px-3 py-2 border border-input rounded-md text-sm bg-background w-full cursor-pointer flex justify-between items-center"
        onClick={onToggle}
      >
        <span className="text-gray-700">
          {selectedValues.length === 0 
            ? 'All' 
            : selectedValues.length === 1 
              ? selectedValues[0]
              : `${selectedValues.length} selected`
          }
        </span>
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          <div 
            className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b"
            onClick={() => onValueChange('all')}
          >
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={selectedValues.length === 0}
                onChange={() => {}}
                className="mr-2"
              />
              <span className="font-medium text-blue-600">All</span>
            </div>
          </div>
          {options.map((option) => (
            <div 
              key={option}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => onValueChange(option)}
            >
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option)}
                  onChange={() => {}}
                  className="mr-2"
                />
                <span>{option}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {/* Date Range */}
      <div className="col-span-1 xl:col-span-2">
        <label className="block text-sm font-medium mb-2">Date Range</label>
        <div className="flex gap-2">
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            className="px-3 py-2 border border-input rounded-md text-sm bg-background flex-1"
          />
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            className="px-3 py-2 border border-input rounded-md text-sm bg-background flex-1"
          />
        </div>
      </div>

      {/* Profession Multi-Select */}
      <MultiSelectDropdown
        label="Professions"
        options={professionOptions}
        selectedValues={filters.professions}
        onValueChange={(value) => handleMultiSelectChange('professions', value)}
        isOpen={openDropdowns.professions}
        onToggle={() => toggleDropdown('professions')}
        dropdownKey="professions"
      />

      {/* Country Multi-Select */}
      <MultiSelectDropdown
        label="Countries"
        options={countryOptions}
        selectedValues={filters.countries}
        onValueChange={(value) => handleMultiSelectChange('countries', value)}
        isOpen={openDropdowns.countries}
        onToggle={() => toggleDropdown('countries')}
        dropdownKey="countries"
      />

      {/* Membership Multi-Select */}
      <MultiSelectDropdown
        label="Memberships"
        options={membershipOptions}
        selectedValues={filters.memberships}
        onValueChange={(value) => handleMultiSelectChange('memberships', value)}
        isOpen={openDropdowns.memberships}
        onToggle={() => toggleDropdown('memberships')}
        dropdownKey="memberships"
      />

      {/* Staff Filter with Operators */}
      <div className="col-span-1">
        <label className="block text-sm font-medium mb-2">Staff Count</label>
        <div className="space-y-2">
          <select
            value={filters.staffFilter.operator}
            onChange={(e) => handleStaffFilterChange('operator', e.target.value)}
            className="px-3 py-2 border border-input rounded-md text-sm bg-background w-full"
          >
            <option value="gte">Greater than or equal</option>
            <option value="gt">Greater than</option>
            <option value="lte">Less than or equal</option>
            <option value="lt">Less than</option>
            <option value="eq">Equal to</option>
            <option value="between">Between</option>
          </select>
          
          <div className="flex gap-2">
            <input
              type="number"
              value={filters.staffFilter.value1}
              onChange={(e) => handleStaffFilterChange('value1', parseInt(e.target.value) || 0)}
              min="0"
              className="px-3 py-2 border border-input rounded-md text-sm bg-background flex-1"
              placeholder="Value"
            />
            
            {filters.staffFilter.operator === 'between' && (
              <input
                type="number"
                value={filters.staffFilter.value2 || 0}
                onChange={(e) => handleStaffFilterChange('value2', parseInt(e.target.value) || 0)}
                min="0"
                className="px-3 py-2 border border-input rounded-md text-sm bg-background flex-1"
                placeholder="To"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterControls; 