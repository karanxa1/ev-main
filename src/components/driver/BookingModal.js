import React, { useState } from 'react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import './BookingModal.css';

const BookingModal = ({ charger, onDateChange, onTimeChange, onConfirm, onCancel }) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [error, setError] = useState('');

  const handleDateChange = (e) => {
    setDate(e.target.value);
    onDateChange(new Date(e.target.value));
  };

  const handleTimeChange = (e) => {
    setTime(e.target.value);
    onTimeChange(e.target.value);
  };

  const handleSubmit = () => {
    if (!date || !time) {
      setError('Please select both date and time');
      return;
    }
    setError('');
    onConfirm();
  };

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="booking-modal-overlay">
      <div className="booking-modal">
        <div className="modal-header">
          <h3>Book {charger.name}</h3>
          <button className="close-button" onClick={onCancel}>×</button>
        </div>
        
        <div className="modal-body">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="booking-date">Date:</label>
            <input 
              id="booking-date"
              type="date" 
              value={date}
              onChange={handleDateChange}
              min={today}
              required 
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="booking-time">Time Slot:</label>
            <select 
              id="booking-time" 
              value={time}
              onChange={handleTimeChange}
              required
            >
              <option value="">Select a time slot</option>
              <option value="08:00-10:00">8:00 AM - 10:00 AM</option>
              <option value="10:00-12:00">10:00 AM - 12:00 PM</option>
              <option value="12:00-14:00">12:00 PM - 2:00 PM</option>
              <option value="14:00-16:00">2:00 PM - 4:00 PM</option>
              <option value="16:00-18:00">4:00 PM - 6:00 PM</option>
              <option value="18:00-20:00">6:00 PM - 8:00 PM</option>
              <option value="20:00-22:00">8:00 PM - 10:00 PM</option>
            </select>
          </div>
          
          <div className="booking-summary">
            <h4>Booking Summary</h4>
            <p><strong>Charger:</strong> {charger.name}</p>
            <p><strong>Type:</strong> {charger.type}</p>
            <p><strong>Rate:</strong> {formatCurrency(charger.pricePerKwh)}/kWh</p>
            <p><strong>Location:</strong> {charger.address}</p>
            {date && time && (
              <p><strong>Scheduled:</strong> {formatDate(new Date(date))} at {time}</p>
            )}
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="cancel-button" onClick={onCancel}>Cancel</button>
          <button className="confirm-button" onClick={handleSubmit}>Confirm Booking</button>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
