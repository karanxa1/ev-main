import React, { useState } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { indianCities } from '../../utils/formatters';
import './AddChargerForm.css';

const AddChargerForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'Type 2',
    power: '',
    pricePerKwh: '',
    address: '',
    description: '',
    amenities: []
  });
  const [markerPosition, setMarkerPosition] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [mapCenter, setMapCenter] = useState(indianCities.delhi); // Default to Delhi
  const [images, setImages] = useState([]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleAmenityChange = (e) => {
    const { value, checked } = e.target;
    let updatedAmenities = [...formData.amenities];
    
    if (checked) {
      updatedAmenities.push(value);
    } else {
      updatedAmenities = updatedAmenities.filter(item => item !== value);
    }
    
    setFormData({
      ...formData,
      amenities: updatedAmenities
    });
  };

  const handleMapClick = (e) => {
    setMarkerPosition({
      lat: e.latLng.lat(),
      lng: e.latLng.lng()
    });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!markerPosition) {
      alert('Please select a location on the map');
      return;
    }

    const chargerData = {
      ...formData,
      location: markerPosition,
      availability: true,
      images: images // Include images in charger data
    };
    
    onSubmit(chargerData);
  };

  const nextStep = () => {
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  // Try to get user's current location for the map
  React.useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  return (
    <div className="add-charger-form">
      <h2>Add New Charging Station</h2>
      
      {currentStep === 1 && (
        <div className="form-step">
          <h3>Basic Information</h3>
          <div className="form-group">
            <label htmlFor="name">Charger Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              placeholder="e.g. Home Fast Charger"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="type">Charger Type</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              required
            >
              <option value="Bharat AC-001">Bharat AC-001</option>
              <option value="Type 2">Type 2</option>
              <option value="CCS">CCS</option>
              <option value="CHAdeMO">CHAdeMO</option>
              <option value="Bharat DC-001">Bharat DC-001</option>
              <option value="GB/T">GB/T (Chinese Standard)</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="power">Power Output (kW)</label>
            <input
              type="number"
              id="power"
              name="power"
              value={formData.power}
              onChange={handleInputChange}
              required
              placeholder="e.g. 7.2"
              min="0"
              step="0.1"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="pricePerKwh">Price per kWh (₹)</label>
            <input
              type="number"
              id="pricePerKwh"
              name="pricePerKwh"
              value={formData.pricePerKwh}
              onChange={handleInputChange}
              required
              placeholder="e.g. 15.00"
              min="0"
              step="0.01"
            />
            <small className="price-info">Current average in India: ₹10-18 per kWh</small>
          </div>
          
          <div className="form-group">
            <label htmlFor="address">Address</label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              required
              placeholder="Full address"
            />
          </div>
          
          <div className="form-buttons">
            <button type="button" onClick={onCancel} className="cancel-button">Cancel</button>
            <button type="button" onClick={nextStep} className="next-button">Next</button>
          </div>
        </div>
      )}
      
      {currentStep === 2 && (
        <div className="form-step">
          <h3>Additional Details</h3>
          
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe your charging station..."
              rows="3"
            />
          </div>
          
          <div className="form-group">
            <label>Amenities Available</label>
            <div className="checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="amenities"
                  value="Parking"
                  checked={formData.amenities.includes('Parking')}
                  onChange={handleAmenityChange}
                />
                Parking
              </label>
              <label>
                <input
                  type="checkbox"
                  name="amenities"
                  value="Restroom"
                  checked={formData.amenities.includes('Restroom')}
                  onChange={handleAmenityChange}
                />
                Restroom
              </label>
              <label>
                <input
                  type="checkbox"
                  name="amenities"
                  value="Wifi"
                  checked={formData.amenities.includes('Wifi')}
                  onChange={handleAmenityChange}
                />
                Wifi
              </label>
              <label>
                <input
                  type="checkbox"
                  name="amenities"
                  value="Chai/Snacks"
                  checked={formData.amenities.includes('Chai/Snacks')}
                  onChange={handleAmenityChange}
                />
                Chai/Snacks
              </label>
              <label>
                <input
                  type="checkbox"
                  name="amenities"
                  value="Shopping"
                  checked={formData.amenities.includes('Shopping')}
                  onChange={handleAmenityChange}
                />
                Shopping
              </label>
              <label>
                <input
                  type="checkbox"
                  name="amenities"
                  value="24x7 Access"
                  checked={formData.amenities.includes('24x7 Access')}
                  onChange={handleAmenityChange}
                />
                24x7 Access
              </label>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="images">Upload Images</label>
            <input
              type="file"
              id="images"
              name="images"
              multiple
              accept="image/*"
              onChange={handleImageChange}
            />
            {images.length > 0 && (
              <div className="image-preview">
                {images.map((image, index) => (
                  <img
                    key={index}
                    src={URL.createObjectURL(image)}
                    alt={image.name}
                    style={{ width: '50px', height: '50px', marginRight: '5px' }}
                  />
                ))}
              </div>
            )}
          </div>
          
          <div className="form-buttons">
            <button type="button" onClick={prevStep} className="back-button">Back</button>
            <button type="button" onClick={nextStep} className="next-button">Next</button>
          </div>
        </div>
      )}
      
      {currentStep === 3 && (
        <div className="form-step">
          <h3>Location</h3>
          <p className="map-instruction">Click on the map to pinpoint your charger's location</p>
          
          <div className="map-container">
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '300px' }}
              center={mapCenter}
              zoom={13}
              onClick={handleMapClick}
            >
              {markerPosition && (
                <Marker position={markerPosition} />
              )}
            </GoogleMap>
          </div>
          
          <div className="selected-location">
            <p>Selected Location: {markerPosition.lat.toFixed(6)}, {markerPosition.lng.toFixed(6)}</p>
          </div>
          
          <div className="form-buttons">
            <button type="button" onClick={prevStep} className="back-button">Back</button>
            <button type="button" onClick={handleSubmit} className="submit-button">Add Charger</button>
            <button type="button" onClick={onCancel} className="cancel-button">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddChargerForm;
