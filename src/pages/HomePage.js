import React, { useState, useEffect } from 'react';
import { getChargingStations, getTopRatedChargingStations } from '../services/firebaseService';

function HomePage() {
  const [stations, setStations] = useState([]);
  const [featuredStations, setFeaturedStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStations = async () => {
      try {
        setLoading(true);
        const allStations = await getChargingStations();
        const topRatedStations = await getTopRatedChargingStations(4);
        
        setStations(allStations);
        setFeaturedStations(topRatedStations);
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
      <h1>Charging Stations</h1>
      <h2>Featured Stations</h2>
      <ul>
        {featuredStations.map(station => (
          <li key={station.id}>{station.name}</li>
        ))}
      </ul>
      <h2>All Stations</h2>
      <ul>
        {stations.map(station => (
          <li key={station.id}>{station.name}</li>
        ))}
      </ul>
    </div>
  );
}

export default HomePage;