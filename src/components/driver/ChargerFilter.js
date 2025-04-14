import React, { useState } from 'react';
import './ChargerFilter.css';

const ChargerFilter = ({ onFilterChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    minPower: '',
    maxPrice: '',
    amenities: []
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  const handleAmenityChange = (e) => {
    const { value, checked } = e.target;
    let updatedAmenities = [...filters.amenities];
    
    if (checked) {
      updatedAmenities.push(value);
    } else {
      updatedAmenities = updatedAmenities.filter(item => item !== value);
    }
    
    setFilters({
      ...filters,
      amenities: updatedAmenities
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onFilterChange(filters);
    if (window.innerWidth < 768) {
      setIsExpanded(false); // Collapse filter on mobile after applying
    }
  };

  const clearFilters = () => {
    const resetFilters = {
      type: 'all',
      minPower: '',
      maxPrice: '',
      amenities: []
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  return (
    <div className={`filter-section ${isExpanded ? 'expanded' : ''}`}>
      <div className="filter-header">
        <h3>Filter Chargers</h3>
        <button 
          className="toggle-filter-button" 
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? '−' : '+'}
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="filter-form">
        <div className="form-group">
          <label htmlFor="type">Charger Type</label>
          <select 
            id="type" 
            name="type" 
            value={filters.type}
            onChange={handleInputChange}
          >
            <option value="all">All Types</option>
            <option value="Type1">Type 1</option>
            <option value="Type2">Type 2</option>
            <option value="CCS">CCS</option>
            <option value="CHAdeMO">CHAdeMO</option>
            <option value="Tesla">Tesla</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="minPower">Minimum Power (kW)</label>
          <input 
            type="number" 
            id="minPower" 
            name="minPower"
            value={filters.minPower}
            onChange={handleInputChange}
            placeholder="e.g. 7"
            min="0"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="maxPrice">Maximum Price (₹/kWh)</label>
          <input 
            type="number" 
            id="maxPrice" 
            name="maxPrice"
            value={filters.maxPrice}
            onChange={handleInputChange}
            placeholder="e.g. 20"
            min="0"
            step="0.01"
          />
        </div>
        
        <div className="form-group amenities-group">
          <label>Amenities</label>
          <div className="checkbox-group">
            <label>
              <input
                type="checkbox"
                name="amenities"
                value="Parking"
                checked={filters.amenities.includes('Parking')}
                onChange={handleAmenityChange}
              />
              Parking
            </label>
            <label>
              <input
                type="checkbox"
                name="amenities"
                value="Restroom"
                checked={filters.amenities.includes('Restroom')}
                onChange={handleAmenityChange}
              />
              Restroom
            </label>
            <label>
              <input
                type="checkbox"
                name="amenities"
                value="Wifi"
                checked={filters.amenities.includes('Wifi')}
                onChange={handleAmenityChange}
              />
              Wifi
            </label>
            <label>
              <input
                type="checkbox"
                name="amenities"
                value="Food"
                checked={filters.amenities.includes('Food')}
                onChange={handleAmenityChange}
              />
              Food/Drinks
            </label>
          </div>
        </div>
        
        <div className="filter-buttons">
          <button type="submit" className="apply-filter-button">Apply Filters</button>
          <button type="button" onClick={clearFilters} className="clear-filter-button">Clear All</button>
        </div>
      </form>
    </div>
  );
};

export default ChargerFilter;
