import React from 'react';
import './Alert.css'; // Import the CSS file for styling

/**
 * Alert Component:
 * A reusable component for displaying alerts with different types (e.g., success, error).
 * @param {string} message - The message to display in the alert.
 * @param {string} type - The type of alert (e.g., 'success', 'error').
 */
const Alert = ({ message, type }) => {
  // Dynamically determine the CSS class based on the alert type
  const alertClass = `alert ${type === 'error' ? 'alert-error' : 'alert-success'}`;

  return (
    <div className={alertClass} role="alert">
      {message}
    </div>
  );
};

export default Alert;
