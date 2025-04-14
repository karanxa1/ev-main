import React, { useState } from 'react';
import { formatCurrency } from '../../utils/formatters';
import './ChargerDetails.css';

const ChargerDetails = ({ charger, onBookNow, onClose }) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  
  const nextPhoto = () => {
    if (charger.photos && charger.photos.length > 1) {
      setCurrentPhotoIndex((currentPhotoIndex + 1) % charger.photos.length);
    }
  };
  
  const prevPhoto = () => {
    if (charger.photos && charger.photos.length > 1) {
      setCurrentPhotoIndex((currentPhotoIndex - 1 + charger.photos.length) % charger.photos.length);
    }
  };

  return (
    <div className="charger-details-panel">
      <div className="close-button" onClick={onClose}>×</div>
      
      {charger.photos && charger.photos.length > 0 && (
        <div className="charger-photos">
          <img src={charger.photos[currentPhotoIndex]} alt={`${charger.name} - Photo ${currentPhotoIndex + 1}`} />
          {charger.photos.length > 1 && (
            <div className="photo-navigation">
              <button onClick={prevPhoto} className="photo-nav-button prev">‹</button>
              <span className="photo-counter">{currentPhotoIndex + 1}/{charger.photos.length}</span>
              <button onClick={nextPhoto} className="photo-nav-button next">›</button>
            </div>
          )}
        </div>
      )}
      
      <h3>{charger.name}</h3>
      <p className="charger-address">{charger.address}</p>
      
      <div className="rating-row">
        <div className="rating-stars">
          {'★'.repeat(Math.round(charger.rating))}
          {'☆'.repeat(5 - Math.round(charger.rating))}
        </div>
        <span className="rating-value">{charger.rating}</span>
      </div>
      
      <div className="host-info">
        <p>Host: {charger.hostName}</p>
      </div>
      
      <div className="details-grid">
        <div className="detail-item">
          <span className="label">Charger Type</span>
          <span className="value">{charger.type}</span>
        </div>
        <div className="detail-item">
          <span className="label">Power Output</span>
          <span className="value">{charger.power} kW</span>
        </div>
        <div className="detail-item">
          <span className="label">Price</span>
          <span className="value">{formatCurrency(charger.pricePerKwh)}/kWh</span>
        </div>
        <div className="detail-item">
          <span className="label">Status</span>
          <span className={`value status ${charger.availability ? 'available' : 'occupied'}`}>
            {charger.availability ? 'Available' : 'Occupied'}
          </span>
        </div>
      </div>
      
      {charger.amenities && charger.amenities.length > 0 && (
        <div className="amenities">
          <h4>Amenities</h4>
          <div className="amenities-list">
            {charger.amenities.map((amenity, index) => (
              <span key={index} className="amenity-tag">{amenity}</span>
            ))}
          </div>
        </div>
      )}
      
      {charger.description && (
        <div className="description">
          <h4>Description</h4>
          <p>{charger.description}</p>
        </div>
      )}
      
      <button 
        className="book-button"
        onClick={onBookNow}
        disabled={!charger.availability}
      >
        Book Now
      </button>
    </div>
  );
};

export default ChargerDetails;
