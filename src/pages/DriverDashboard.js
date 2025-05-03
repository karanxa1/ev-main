import React, { useState, useEffect } from 'react';
import { getChargingStations } from '../services/firebaseService';

function DriverDashboard() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStations = async () => {
      try {
        setLoading(true);
        const stationsData = await getChargingStations();
        setStations(stationsData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching stations:', err);
        setError('Failed to load charging stations');
        setLoading(false);
      }
    };

    fetchStations();
  }, []);

  if (loading) return <div>Loading stations...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Driver Dashboard</h1>
      <ul>
        {stations.map((station) => (
          <li key={station.id}>
            {station.name} - {station.city}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default DriverDashboard;