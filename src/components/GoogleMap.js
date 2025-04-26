import React, { useEffect, useState } from 'react';
// ...existing imports...

// GoogleMap component with error handling
const GoogleMap = ({ /* ...props */ }) => {
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    // Listen for Google Maps errors
    const handleMapError = () => {
      console.log("Google Maps failed to load - showing fallback content");
      setMapError(true);
    };

    window.gm_authFailure = handleMapError;

    return () => {
      window.gm_authFailure = null;
    };
  }, []);

  // Render fallback UI if Maps API fails to load
  if (mapError) {
    return (
      <div className="map-error-container" style={{ 
        padding: '20px', 
        textAlign: 'center', 
        backgroundColor: '#f8f8f8',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        margin: '20px 0'
      }}>
        <h3>Map cannot be displayed</h3>
        <p>Please check your Google Maps API configuration.</p>
        <p>For website administrators: Billing needs to be enabled on the Google Cloud Console.</p>
      </div>
    );
  }

  // ...existing component code...
};

export default GoogleMap;
