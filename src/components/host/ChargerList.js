import React, { useState } from 'react';
import './ChargerList.css'; // Import the CSS file for styling

/**
 * ChargerList Component:
 * A component that displays a list of chargers with editing functionality.
 * @param {array} chargers - An array of charger objects to display.
 */
const ChargerList = ({ chargers }) => {
  const [editingChargerId, setEditingChargerId] = useState(null); // State to track the ID of the charger being edited
  const [editFormData, setEditFormData] = useState({
    name: '',
    pricePerKwh: '',
    availability: true
  }); // State to store the form data for editing

  /**
   * Initiates editing mode for a specific charger.
   * @param {Object} charger - The charger object to edit.
   */
  const startEditing = (charger) => {
    setEditingChargerId(charger.id); // Set the ID of the charger being edited
    setEditFormData({
      name: charger.name,
      pricePerKwh: charger.pricePerKwh,
      availability: charger.availability
    }); // Populate the form data with the selected charger's details
  };

  /**
   * Cancels editing mode and resets the form data.
   */
  const cancelEditing = () => {
    setEditingChargerId(null); // Clear the editing ID
    setEditFormData({
      name: '',
      pricePerKwh: '',
      availability: true
    }); // Reset the form data
  };

  /**
   * Handles input changes in the edit form.
   * @param {Object} e - The event object from the input change.
   */
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target; // Destructure the event target properties
    setEditFormData({
      ...editFormData,
      [name]: type === 'checkbox' ? checked : value
    }); // Update the form data based on the input change
  };

  /**
   * Saves changes made to a specific charger.
   * @param {string} id - The ID of the charger being edited.
   */
  const saveChanges = (id) => {
    // In a real app, this would update data in Firestore
    console.log(`Changes saved for charger ${id}:`, editFormData); // Log the changes
    setEditingChargerId(null); // Exit editing mode
  };

  return (
    <div className="charger-list">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Power</th>
            <th>Price</th>
            <th>Status</th>
            <th>Bookings</th>
            <th>Revenue</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {chargers.map((charger) => (
            <tr key={charger.id}>
              <td>
                {editingChargerId === charger.id ? (
                  <input
                    type="text"
                    name="name"
                    value={editFormData.name}
                    onChange={handleInputChange}
                  />
                ) : (
                  charger.name
                )}
              </td>
              <td>{charger.type}</td>
              <td>{charger.power} kW</td>
              <td>
                {editingChargerId === charger.id ? (
                  <div className="input-with-unit">
                    $
                    <input
                      type="number"
                      name="pricePerKwh"
                      value={editFormData.pricePerKwh}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                    />
                  </div>
                ) : (
                  `$${charger.pricePerKwh}/kWh`
                )}
              </td>
              <td>
                {editingChargerId === charger.id ? (
                  <label className="status-toggle">
                    <input
                      type="checkbox"
                      name="availability"
                      checked={editFormData.availability}
                      onChange={handleInputChange}
                    />
                    <span className="toggle-label">
                      {editFormData.availability ? 'Available' : 'Unavailable'}
                    </span>
                  </label>
                ) : (
                  <span className={`status ${charger.availability ? 'available' : 'unavailable'}`}>
                    {charger.availability ? 'Available' : 'Unavailable'}
                  </span>
                )}
              </td>
              <td>{charger.totalBookings || 0}</td>
              <td>${charger.revenue ? charger.revenue.toFixed(2) : '0.00'}</td>
              <td>
                {editingChargerId === charger.id ? (
                  <div className="action-buttons">
                    <button onClick={() => saveChanges(charger.id)} className="save-button">Save</button>
                    <button onClick={cancelEditing} className="cancel-button">Cancel</button>
                  </div>
                ) : (
                  <div className="action-buttons">
                    <button onClick={() => startEditing(charger)} className="edit-button">Edit</button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ChargerList;
