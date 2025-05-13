import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getUserChargers, addCharger, updateCharger, deleteCharger, uploadImage, deleteImage } from '../../firebase/services';
import { ChargerData } from '../../firebase/services';
import './HostDashboard.css';

// Google Maps integration
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

interface ChargerFormData {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  type: string;
  power: number;
  pricePerKwh: number;
  availability: boolean;
  image: File | null;
}

const HostDashboard: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const [chargers, setChargers] = useState<ChargerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingChargerId, setEditingChargerId] = useState<string | null>(null);
  const [mapCenter] = useState({ lat: 40.7128, lng: -74.0060 }); // Default to NYC
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  // Form state
  const initialFormState: ChargerFormData = {
    name: '',
    address: '',
    latitude: 0,
    longitude: 0,
    type: 'Type 2',
    power: 7.4,
    pricePerKwh: 0.30,
    availability: true,
    image: null
  };
  
  const [formData, setFormData] = useState<ChargerFormData>(initialFormState);
  
  const fetchChargers = React.useCallback(async () => {
    try {
      setLoading(true);
      if (currentUser) {
        const userChargers = await getUserChargers(currentUser.uid);
        setChargers(userChargers);
      }
    } catch (err: any) {
      setError('Failed to load chargers: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Fetch user's chargers
  useEffect(() => {
    if (currentUser) {
      fetchChargers();
    }
  }, [currentUser, fetchChargers]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : type === 'number' 
          ? parseFloat(value) 
          : value
    }));
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({
        ...prev,
        image: e.target.files![0]
      }));
    }
  };
  
  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setSelectedLocation({ lat, lng });
      setFormData(prev => ({
        ...prev,
        latitude: lat,
        longitude: lng
      }));
      
      // Try to get address from coordinates using Geocoding API
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          setFormData(prev => ({
            ...prev,
            address: results[0].formatted_address
          }));
        }
      });
    }
  };
  
  const resetForm = () => {
    setFormData(initialFormState);
    setEditingChargerId(null);
    setSelectedLocation(null);
    setShowForm(false);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      if (!currentUser) return;
      
      let imageUrl = '';
      
      // Upload image if provided
      if (formData.image) {
        const imagePath = `chargers/${currentUser.uid}/${Date.now()}_${formData.image.name}`;
        imageUrl = await uploadImage(formData.image, imagePath);
      }
      
      const chargerData = {
        ownerId: currentUser.uid,
        name: formData.name,
        location: {
          address: formData.address,
          latitude: formData.latitude,
          longitude: formData.longitude
        },
        type: formData.type,
        power: formData.power,
        pricePerKwh: formData.pricePerKwh,
        availability: formData.availability,
        imageUrl: imageUrl || undefined
      };
      
      if (editingChargerId) {
        // If editing, update the charger
        await updateCharger(editingChargerId, chargerData);
      } else {
        // If adding, create a new charger
        await addCharger(chargerData);
      }
      
      // Refresh the chargers list
      await fetchChargers();
      resetForm();
    } catch (err: any) {
      setError('Failed to save charger: ' + err.message);
    }
  };
  
  const handleEdit = (charger: ChargerData) => {
    if (!charger.id) return;
    
    setFormData({
      name: charger.name,
      address: charger.location.address,
      latitude: charger.location.latitude,
      longitude: charger.location.longitude,
      type: charger.type,
      power: charger.power,
      pricePerKwh: charger.pricePerKwh,
      availability: charger.availability,
      image: null
    });
    
    setSelectedLocation({
      lat: charger.location.latitude,
      lng: charger.location.longitude
    });
    
    setEditingChargerId(charger.id);
    setShowForm(true);
  };
  
  const handleDelete = async (chargerId: string, imageUrl?: string) => {
    if (!window.confirm('Are you sure you want to delete this charger?')) return;
    
    try {
      await deleteCharger(chargerId);
      
      // Delete the image if it exists
      if (imageUrl) {
        // Extract the path from the URL
        const imagePath = imageUrl.split('?')[0].split('/o/')[1];
        if (imagePath) {
          await deleteImage(decodeURIComponent(imagePath));
        }
      }
      
      // Refresh the chargers list
      await fetchChargers();
    } catch (err: any) {
      setError('Failed to delete charger: ' + err.message);
    }
  };
  
  return (
    <div className="host-dashboard">
      <div className="dashboard-header">
        <h1>Host Dashboard</h1>
        <button onClick={logout} className="logout-btn">Logout</button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="dashboard-actions">
        <button 
          onClick={() => setShowForm(!showForm)}
          className="add-charger-btn"
        >
          {showForm ? 'Cancel' : 'Add New Charger'}
        </button>
      </div>
      
      {showForm && (
        <div className="charger-form-container">
          <h2>{editingChargerId ? 'Edit Charger' : 'Add New Charger'}</h2>
          
          <form onSubmit={handleSubmit} className="charger-form">
            <div className="form-group">
              <label htmlFor="name">Charger Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
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
              />
            </div>
            
            <div className="map-container">
              <label>Select Location on Map</label>
              <LoadScript googleMapsApiKey="YOUR_GOOGLE_MAPS_API_KEY">
                <GoogleMap
                  mapContainerStyle={{ width: '100%', height: '300px' }}
                  center={selectedLocation || mapCenter}
                  zoom={12}
                  onClick={handleMapClick}
                  options={{ gestureHandling: 'cooperative' }}
                >
                  {selectedLocation && (
                    <Marker position={selectedLocation} />
                  )}
                </GoogleMap>
              </LoadScript>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="type">Plug Type</label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  required
                >
                  <option value="Type 1">Type 1</option>
                  <option value="Type 2">Type 2</option>
                  <option value="CCS">CCS</option>
                  <option value="CHAdeMO">CHAdeMO</option>
                  <option value="Tesla">Tesla</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="power">Power (kW)</label>
                <input
                  type="number"
                  id="power"
                  name="power"
                  min="1"
                  step="0.1"
                  value={formData.power}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="pricePerKwh">Price per kWh ($)</label>
                <input
                  type="number"
                  id="pricePerKwh"
                  name="pricePerKwh"
                  min="0"
                  step="0.01"
                  value={formData.pricePerKwh}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group checkbox-group">
                <label htmlFor="availability">
                  <input
                    type="checkbox"
                    id="availability"
                    name="availability"
                    checked={formData.availability}
                    onChange={handleInputChange}
                  />
                  Available for Booking
                </label>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="image">Charger Image</label>
              <input
                type="file"
                id="image"
                name="image"
                accept="image/*"
                onChange={handleImageChange}
              />
              <small>Upload an image of your charging station</small>
            </div>
            
            <div className="form-actions">
              <button type="button" onClick={resetForm} className="cancel-btn">Cancel</button>
              <button type="submit" className="submit-btn">
                {editingChargerId ? 'Update Charger' : 'Add Charger'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      <div className="chargers-list">
        <h2>Your Chargers</h2>
        
        {loading ? (
          <p>Loading your chargers...</p>
        ) : chargers.length === 0 ? (
          <p>You haven't added any chargers yet.</p>
        ) : (
          <div className="chargers-grid">
            {chargers.map(charger => (
              <div key={charger.id} className="charger-card">
                {charger.imageUrl && (
                  <div className="charger-image">
                    <img src={charger.imageUrl} alt={charger.name} />
                  </div>
                )}
                
                <div className="charger-details">
                  <h3>{charger.name}</h3>
                  <p><strong>Address:</strong> {charger.location.address}</p>
                  <p><strong>Type:</strong> {charger.type}</p>
                  <p><strong>Power:</strong> {charger.power} kW</p>
                  <p><strong>Price:</strong> ${charger.pricePerKwh.toFixed(2)}/kWh</p>
                  <p><strong>Status:</strong> {charger.availability ? 'Available' : 'Unavailable'}</p>
                </div>
                
                <div className="charger-actions">
                  <button 
                    onClick={() => handleEdit(charger)}
                    className="edit-btn"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => charger.id && handleDelete(charger.id, charger.imageUrl)}
                    className="delete-btn"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HostDashboard;