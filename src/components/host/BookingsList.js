import React, { useState } from 'react';
import './BookingsList.css';

/**
 * BookingsList Component:
 * A component that displays a list of bookings and allows hosts to update the booking status.
 * @param {array} bookings - An array of booking objects to display.
 * @param {function} onUpdateStatus - The function to call when the booking status is updated.
 */
const BookingsList = ({ bookings, onUpdateStatus }) => {
  const [filter, setFilter] = useState('all');
  
  /**
   * formatDate Function:
   * Formats a date object into a readable string.
   * @param {Date} date - The date object to format.
   * @returns {string} - The formatted date string.
   */
  const formatDate = (date) => {
    if (!date) return '';
    
    if (typeof date === 'string') {
      date = new Date(date);
    }
    
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  };
  
  /**
   * getBookingStatusClass Function:
   * Returns a CSS class based on the booking status.
   * @param {string} status - The status of the booking.
   * @returns {string} - The corresponding CSS class.
   */
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
  
  /**
   * Filter bookings based on the selected filter.
   * If the filter is 'all', return all bookings.
   * Otherwise, return bookings that match the selected status.
   */
  const filteredBookings = filter === 'all' 
    ? bookings 
    : bookings.filter(booking => booking.status === filter);

  return (
    <div className="bookings-list">
      {/* Filter buttons to filter bookings by status */}
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
      
      {/* Display a message if no bookings are found for the selected filter */}
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
                  {/* Display action buttons based on the booking status */}
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
