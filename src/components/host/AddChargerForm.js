import React, { useState } from 'react';
import { useJsApiLoader, GoogleMap, Marker, Autocomplete } from '@react-google-maps/api';
import './AddChargerForm.css'; // Import the CSS file for styling

/**
 * AddChargerForm Component:
 * A form component that allows hosts to add a new charger.
 * @param {function} onSubmit - The function to call when the form is submitted.
 * @param {function} onCancel - The function to call when the form is cancelled.
 */
const AddChargerForm = ({ onSubmit, onCancel }) => {
  // State variables for charger details
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [power, setPower] = useState('');
  const [pricePerKwh, setPricePerKwh] = useState('');
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState(null);

  // Google Maps API setup
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: ["places"],
  });

  /**
   * handleMapClick Function:
   * Handles the map click event to set the charger location.
   * @param {object} event - The map click event.
   */
  const handleMapClick = (event) => {
    setLocation({
      lat: event.latLng.lat(),
      lng: event.latLng.lng(),
    });
  };

  /**
   * handleAddressSelect Function:
   * Handles the address selection from the autocomplete.
   * @param {object} place - The selected place from the autocomplete.
   */
  const handleAddressSelect = (place) => {
    setAddress(place.formatted_address);
    setLocation({
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
    });
  };

  /**
   * handleSubmit Function:
   * Handles the form submission.
   * @param {Event} e - The form submit event.
   */
  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent the default form submission behavior

    // Create a new charger object
    const newCharger = {
      name,
      type,
      power: parseFloat(power),
      pricePerKwh: parseFloat(pricePerKwh),
      address,
      location,
      availability: true,
    };

    onSubmit(newCharger); // Call the onSubmit function with the new charger
  };

  return (
    <form onSubmit={handleSubmit} className="add-charger-form">
      <h2>Add New Charger</h2>

      <div className="form-group">
        <label>Charger Name:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label>Charger Type:</label>
        <select value={type} onChange={(e) => setType(e.target.value)} required>
          <option value="">Select Type</option>
          <option value="Type 1">Type 1</option>
          <option value="Type 2">Type 2</option>
          <option value="CCS">CCS</option>
          <option value="CHAdeMO">CHAdeMO</option>
        </select>
      </div>

      <div className="form-group">
        <label>Power (kW):</label>
        <input
          type="number"
          value={power}
          onChange={(e) => setPower(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label>Price per kWh:</label>
        <input
          type="number"
          step="0.01"
          value={pricePerKwh}
          onChange={(e) => setPricePerKwh(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label>Address:</label>
        {isLoaded ? (
          <Autocomplete
            onPlaceChanged={(place) => handleAddressSelect(place)}
          >
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter address"
              required
            />
          </Autocomplete>
        ) : <p>Loading...</p>}
      </div>

      <div className="form-group">
        <label>Location:</label>
        {isLoaded && location ? (
          <div style={{ height: '200px', width: '100%' }}>
            <GoogleMap
              mapContainerStyle={{ height: '100%', width: '100%' }}
              zoom={12}
              center={location}
              onClick={handleMapClick}
            >
              <Marker position={location} />
            </GoogleMap>
          </div>
        ) : (
          <p>Loading map...</p>
        )}
      </div>

      <div className="form-actions">
        <button type="submit">Add Charger</button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
};

export default AddChargerForm;
