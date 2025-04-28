import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import MapboxDrivers from '../components/MapboxDrivers';

const Drivers = () => {
  const [drivers, setDrivers] = useState([]);

  useEffect(() => {
    // Fetch drivers data from an API or other source
    const fetchDrivers = async () => {
      // Replace with your data source
      const response = await fetch('/api/drivers');
      const data = await response.json();
      setDrivers(data);
    };

    fetchDrivers();
  }, []);

  return (
    <div className="drivers-page">
      <h1>Drivers</h1>
      
      {/* Mapbox section */}
      <div className="mapbox-section">
        <h2>Driver Locations</h2>
        <MapboxDrivers drivers={drivers} />
      </div>
      
      <div className="drivers-list">
        {drivers.map(driver => (
          <div key={driver.id} className="driver-card">
            <div className="driver-info">
              <h3>{driver.name}</h3>
              <p>ID: {driver.id}</p>
              {/* Keep other driver information */}
              {driver.status && <p>Status: {driver.status}</p>}
              {driver.vehicle && <p>Vehicle: {driver.vehicle}</p>}
              {/* Other driver details */}
            </div>
            
            <div className="driver-actions">
              {/* Any action buttons */}
              <Link to={`/drivers/${driver.id}`} className="view-button">View Details</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Drivers;