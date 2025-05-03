import React, { useState, useEffect } from 'react';
import { chargingStationService } from '../services/chargingStationService';
import ChargingStationCard from './ChargingStationCard';

const ChargingStationList = () => {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStations = async () => {
      try {
        setLoading(true);
        const stationsData = await chargingStationService.getAllStations();
        setStations(stationsData);
        setLoading(false);
      } catch (err) {
        setError('Failed to load charging stations');
        setLoading(false);
        console.error(err);
      }
    };

    fetchStations();
  }, []);

  if (loading) return <div>Loading charging stations...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="charging-station-list">
      <h2>Charging Stations</h2>
      {stations.length === 0 ? (
        <p>No charging stations found</p>
      ) : (
        <div className="stations-container">
          {stations.map(station => (
            <ChargingStationCard key={station.id} station={station} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ChargingStationList;
