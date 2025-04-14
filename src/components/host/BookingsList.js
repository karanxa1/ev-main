import React, { useState } from 'react';
import './BookingsList.css';

const BookingsList = ({ bookings, onUpdateStatus }) => {
  const [filter, setFilter] = useState('all');
  
  const formatDate = (date) => {
    if (!date) return '';
    
    if (typeof date === 'string') {
      date = new Date(date);
    }
    
    return date.toLocaleDateString();
  };
  
  const getBookingStatusClass = (status) => {
    switch (status) {
      case 'confirmed':
        return 'status-confirmed';
      case 'completed':
        return 'status-completed';
      case 'cancelled':
        return 'status-cancelled';
      case 'pending':
        return 'status-pending';
      default:
        return '';
    }
  };
  
  const filteredBookings = filter === 'all' 
    ? bookings 
    : bookings.filter(booking => booking.status === filter);

  return (
    <div className="bookings-list">
      <div className="filter-buttons">
        <button 
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button 
          className={filter === 'pending' ? 'active' : ''}
          onClick={() => setFilter('pending')}
        >
          Pending
        </button>
        <button 
          className={filter === 'confirmed' ? 'active' : ''}
          onClick={() => setFilter('confirmed')}
        >
          Confirmed
        </button>
        <button 
          className={filter === 'completed' ? 'active' : ''}
          onClick={() => setFilter('completed')}
        >
          Completed
        </button>
        <button 
          className={filter === 'cancelled' ? 'active' : ''}
          onClick={() => setFilter('cancelled')}
        >
          Cancelled
        </button>
      </div>
      
      {filteredBookings.length === 0 ? (
        <p className="no-bookings">No {filter !== 'all' ? filter : ''} bookings found.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Charger</th>
              <th>User</th>
              <th>Date</th>
              <th>Time</th>
              <th>Status</th>
              <th>Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.map((booking) => (
              <tr key={booking.id}>
                <td>{booking.chargerName}</td>
                <td>{booking.driverName}</td>
                <td>{formatDate(booking.date)}</td>
                <td>{booking.startTime} - {booking.endTime}</td>
                <td>
                  <span className={`booking-status ${getBookingStatusClass(booking.status)}`}>
                    {booking.status}
                  </span>
                </td>
                <td>${booking.totalAmount.toFixed(2)}</td>
                <td>
                  {booking.status === 'pending' && (
                    <div className="action-buttons">
                      <button 
                        onClick={() => onUpdateStatus(booking.id, 'confirmed')}
                        className="confirm-button"
                      >
                        Accept
                      </button>
                      <button 
                        onClick={() => onUpdateStatus(booking.id, 'cancelled')}
                        className="reject-button"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                  {booking.status === 'confirmed' && (
                    <button 
                      onClick={() => onUpdateStatus(booking.id, 'completed')}
                      className="complete-button"
                    >
                      Complete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default BookingsList;
