import React, { useState, useEffect, useCallback } from 'react';
import './TripsPage.css';
import { MAPBOX_TOKEN } from '../../services/mapboxConfig'; // Import Mapbox token
// import { FaMapMarkerAlt, FaRegCircle } from 'react-icons/fa'; // Example icons

// Debounce function
function debounce(func, delay) {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), delay);
  };
}

const TripsPage = () => {
  const [origin, setOrigin] = useState({ address: 'Shilptara Housing Society', coordinates: null });
  const [destination, setDestination] = useState({ address: '', coordinates: null });
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [isOriginLoading, setIsOriginLoading] = useState(false);
  const [isDestinationLoading, setIsDestinationLoading] = useState(false);

  // This useEffect is a placeholder if we need to interact with the map
  // or fetch initial data related to trips page specifically when it loads.
  useEffect(() => {
    // For example, if you need to set the active tab in a shared context
    // or load user's current location for origin if not pre-filled.
    console.log("TripsPage loaded");
  }, []);

  const fetchGeocodingSuggestions = async (query, type) => {
    if (!query || query.length < 3) {
      if (type === 'origin') setOriginSuggestions([]);
      if (type === 'destination') setDestinationSuggestions([]);
      return;
    }

    if (type === 'origin') setIsOriginLoading(true);
    if (type === 'destination') setIsDestinationLoading(true);

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&autocomplete=true&country=IN` // Added country bias for India
      );
      const data = await response.json();
      if (data && data.features) {
        if (type === 'origin') {
          setOriginSuggestions(data.features);
        } else {
          setDestinationSuggestions(data.features);
        }
      }
    } catch (error) {
      console.error('Error fetching geocoding suggestions:', error);
      if (type === 'origin') setOriginSuggestions([]);
      if (type === 'destination') setDestinationSuggestions([]);
    }
    if (type === 'origin') setIsOriginLoading(false);
    if (type === 'destination') setIsDestinationLoading(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedFetchSuggestions = useCallback(debounce(fetchGeocodingSuggestions, 300), [MAPBOX_TOKEN]);

  const handleInputChange = (type, value) => {
    if (type === 'origin') {
      setOrigin({ address: value, coordinates: null });
      debouncedFetchSuggestions(value, 'origin');
    } else {
      setDestination({ address: value, coordinates: null });
      debouncedFetchSuggestions(value, 'destination');
    }
  };

  const handleSuggestionClick = (type, suggestion) => {
    if (type === 'origin') {
      setOrigin({ address: suggestion.place_name, coordinates: suggestion.geometry.coordinates });
      setOriginSuggestions([]);
    } else {
      setDestination({ address: suggestion.place_name, coordinates: suggestion.geometry.coordinates });
      setDestinationSuggestions([]);
    }
    console.log(`Selected ${type}:`, suggestion.place_name, suggestion.geometry.coordinates);
  };

  const handleSubmitTrip = (e) => {
    e.preventDefault();
    console.log("handleSubmitTrip called. Origin:", origin, "Destination:", destination);
    if (!origin.coordinates || !destination.coordinates) {
      alert("Please select a valid origin and destination from suggestions.");
      console.log("Validation failed: Origin or Destination coordinates missing.");
      return;
    }
    console.log("Planning trip from:", origin, "to:", destination);
    // Further trip planning logic (route calculation) will go here
  };

  return (
    <div className="trips-page-container">
      <div className="trips-header">
        <h1>Plan your next trip</h1>
        <p>Tackle your range anxiety with our hassle-free charging experience on your next trip.</p>
      </div>

      <form onSubmit={handleSubmitTrip} className="trip-form">
        <div className="trip-input-group">
          {/* <FaRegCircle className="input-icon origin-dot" /> */}
          <span className="dot-icon origin-dot"></span>
          <input 
            type="text"
            id="origin"
            value={origin.address}
            onChange={(e) => handleInputChange('origin', e.target.value)}
            placeholder="Enter Origin"
            className="trip-input"
            autoComplete="off"
          />
          <div className="input-connector"></div>
          {isOriginLoading && <div className="suggestions-loading">Loading...</div>}
          {originSuggestions.length > 0 && (
            <ul className="suggestions-list">
              {originSuggestions.map((suggestion) => (
                <li key={suggestion.id} onClick={() => handleSuggestionClick('origin', suggestion)}>
                  {suggestion.place_name}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="trip-input-group">
          {/* <FaMapMarkerAlt className="input-icon destination-dot" /> */}
          <span className="dot-icon destination-dot"></span>
          <input 
            type="text"
            id="destination"
            value={destination.address}
            onChange={(e) => handleInputChange('destination', e.target.value)}
            placeholder="Enter Destination"
            className="trip-input"
            autoComplete="off"
          />
           {isDestinationLoading && <div className="suggestions-loading">Loading...</div>}
          {destinationSuggestions.length > 0 && (
            <ul className="suggestions-list">
              {destinationSuggestions.map((suggestion) => (
                <li key={suggestion.id} onClick={() => handleSuggestionClick('destination', suggestion)}>
                  {suggestion.place_name}
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <button type="submit" className="btn-plan-trip" disabled={!origin.coordinates || !destination.coordinates}>
          Plan Trip
        </button>
      </form>
    </div>
  );
};

export default TripsPage; 