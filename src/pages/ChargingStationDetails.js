import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getChargingStationById } from '../services/firebaseService';

function ChargingStationDetails() {
  const { id } = useParams();
  const [station, setStation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStationDetails = async () => {
      try {
        setLoading(true);
        const stationData = await getChargingStationById(id);
        setStation(stationData);
        setLoading(false);
      } catch (err) {
        console.error(`Error fetching station details for ID ${id}:`, err);
        setError('Station not found or error loading details');
        setLoading(false);
      }
    };

    fetchStationDetails();
  }, [id]);

  if (loading) return <div>Loading station details...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!station) return <div>Station not found</div>;

  return (
    <div>
      <h1>{station.name}</h1>
      <p>Type: {station.type}</p>
      <p>Power: {station.power} kW</p>
      <p>Price per kWh: ₹{station.pricePerKwh}</p>
      <p>Availability: {station.availability ? 'Available' : 'Not Available'}</p>
      <p>Address: {station.address}</p>
      <p>Host Name: {station.hostName}</p>
      <p>Rating: {station.rating}</p>
      <p>Plug Type: {station.plugType}</p>
      <p>Amenities: {station.amenities.join(', ')}</p>
      <p>City: {station.city}</p>
    </div>
  );
}

export default ChargingStationDetails;