import React, { useState, useEffect } from 'react';
import { getChargingStations } from '../services/firebaseService';

function StationMap() {
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
        console.error('Error fetching stations for map:', err);
        setError('Failed to load map data');
        setLoading(false);
      }
    };

    fetchStations();
  }, []);

  if (loading) return <div>Loading map...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {/* Render the map and stations here */}
    </div>
  );
}

export default StationMap;