import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext'; // Import the useAuth hook from the AuthContext
import { LoadScript } from '@react-google-maps/api'; // Import LoadScript to load Google Maps API
import AddChargerForm from './AddChargerForm'; // Import the AddChargerForm component
import ChargerList from './ChargerList'; // Import the ChargerList component
import BookingsList from './BookingsList'; // Import the BookingsList component
import EarningsSummary from './EarningsSummary'; // Import the EarningsSummary component
import './HostDashboard.css'; // Import the CSS file for styling

/**
 * HostDashboard Component:
 * This component serves as the main dashboard for charger hosts.
 * It allows hosts to manage their chargers, view bookings, and track earnings.
 */
const HostDashboard = () => {
  // Use the useAuth hook to get the logout function and current user
  const { logout, currentUser } = useAuth();
  // State variables for chargers, bookings, total earnings, active tab, add form visibility, and loading state
  const [chargers, setChargers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [activeTab, setActiveTab] = useState('chargers');
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch chargers for the current user
  useEffect(() => {
    const fetchChargers = async () => {
      if (!currentUser) return; // If there is no current user, return

      try {
        setLoading(true); // Set loading to true while fetching data
        // Will replace with actual Firestore fetching
        // const userChargers = await getUserChargers(currentUser.uid);

        // Mock data for now
        const mockChargers = [
          {
            id: '1',
            name: 'Home Charger',
            type: 'Type 2',
            power: 7.2,
            pricePerKwh: 0.30,
            address: '123 My Street',
            location: { lat: 40.7128, lng: -74.0060 },
            availability: true,
            totalBookings: 5,
            revenue: 120.50
          },
          {
            id: '2',
            name: 'Office Charger',
            type: 'Type 2',
            power: 22,
            pricePerKwh: 0.35,
            address: '456 Work Avenue',
            location: { lat: 40.7200, lng: -74.0100 },
            availability: true,
            totalBookings: 12,
            revenue: 320.75
          }
        ];

        setChargers(mockChargers); // Set the chargers state with the fetched data

        // Calculate total earnings
        const total = mockChargers.reduce((sum, charger) => sum + charger.revenue, 0);
        setTotalEarnings(total); // Set the total earnings state

      } catch (error) {
        console.error('Error fetching chargers:', error); // Log any errors
      } finally {
        setLoading(false); // Set loading to false after fetching data
      }
    };

    fetchChargers(); // Call the fetchChargers function
  }, [currentUser]); // Run this effect whenever the currentUser changes

  // Fetch bookings for all user chargers
  useEffect(() => {
    const fetchBookings = async () => {
      if (!currentUser || chargers.length === 0) return; // If there is no current user or chargers, return

      try {
        // Will replace with actual Firestore fetching
        // const allBookings = await getChargerBookings(chargers.map(c => c.id));

        // Mock data
        const mockBookings = [
          {
            id: '1',
            chargerId: '1',
            chargerName: 'Home Charger',
            driverId: 'user123',
            driverName: 'John Driver',
            date: new Date('2023-09-20'),
            startTime: '10:00',
            endTime: '12:00',
            status: 'confirmed',
            totalAmount: 18.50
          },
          {
            id: '2',
            chargerId: '1',
            chargerName: 'Home Charger',
            driverId: 'user456',
            driverName: 'Jane User',
            date: new Date('2023-09-22'),
            startTime: '14:00',
            endTime: '16:00',
            status: 'pending',
            totalAmount: 22.75
          },
          {
            id: '3',
            chargerId: '2',
            chargerName: 'Office Charger',
            driverId: 'user789',
            driverName: 'Bob Smith',
            date: new Date('2023-09-19'),
            startTime: '08:00',
            endTime: '10:00',
            status: 'completed',
            totalAmount: 15.20
          }
        ];

        setBookings(mockBookings); // Set the bookings state with the fetched data
      } catch (error) {
        console.error('Error fetching bookings:', error); // Log any errors
      }
    };

    fetchBookings(); // Call the fetchBookings function
  }, [currentUser, chargers]); // Run this effect whenever the currentUser or chargers change

  /**
   * handleAddCharger Function:
   * Handles the addition of a new charger.
   * @param {object} newCharger - The new charger object.
   */
  const handleAddCharger = (newCharger) => {
    // In a real app, this would save to Firestore
    const chargerWithId = {
      ...newCharger,
      id: Date.now().toString(),
      totalBookings: 0,
      revenue: 0
    };

    setChargers([...chargers, chargerWithId]); // Add the new charger to the chargers state
    setShowAddForm(false); // Hide the add charger form
  };

  /**
   * handleUpdateBookingStatus Function:
   * Handles the updating of a booking status.
   * @param {string} bookingId - The ID of the booking to update.
   * @param {string} newStatus - The new status of the booking.
   */
  const handleUpdateBookingStatus = (bookingId, newStatus) => {
    // Update booking status (will connect to Firestore in real app)
    const updatedBookings = bookings.map(booking =>
      booking.id === bookingId ? { ...booking, status: newStatus } : booking
    );
    setBookings(updatedBookings); // Update the bookings state with the updated booking
  };

  return (
    <div className="host-dashboard">
      <header className="dashboard-header">
        <h2>Host Dashboard</h2>
        <button onClick={() => logout()} className="logout-button">Logout</button>
      </header>

      <div className="dashboard-summary">
        <div className="summary-card">
          <h3>Total Chargers</h3>
          <p className="summary-value">{chargers.length}</p>
        </div>
        <div className="summary-card">
          <h3>Active Bookings</h3>
          <p className="summary-value">{bookings.filter(b => b.status === 'confirmed').length}</p>
        </div>
        <div className="summary-card">
          <h3>Total Earnings</h3>
          <p className="summary-value">${totalEarnings.toFixed(2)}</p>
        </div>
      </div>

      <div className="dashboard-tabs">
        <button
          className={`tab-button ${activeTab === 'chargers' ? 'active' : ''}`}
          onClick={() => setActiveTab('chargers')}
        >
          My Chargers
        </button>
        <button
          className={`tab-button ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          Bookings
        </button>
        <button
          className={`tab-button ${activeTab === 'earnings' ? 'active' : ''}`}
          onClick={() => setActiveTab('earnings')}
        >
          Earnings
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'chargers' && (
          <>
            <div className="section-header">
              <h3>My Charging Stations</h3>
              <button
                className="add-button"
                onClick={() => setShowAddForm(true)}
              >
                Add New Charger
              </button>
            </div>

            {loading ? (
              <p>Loading chargers...</p>
            ) : chargers.length === 0 ? (
              <div className="empty-state">
                <p>You haven't added any charging stations yet.</p>
                <button
                  className="add-button"
                  onClick={() => setShowAddForm(true)}
                >
                  Add Your First Charger
                </button>
              </div>
            ) : (
              <ChargerList chargers={chargers} />
            )}
          </>
        )}

        {activeTab === 'bookings' && (
          <>
            <h3>Booking Requests</h3>
            {bookings.length === 0 ? (
              <p>No bookings yet.</p>
            ) : (
              <BookingsList
                bookings={bookings}
                onUpdateStatus={handleUpdateBookingStatus}
              />
            )}
          </>
        )}

        {activeTab === 'earnings' && (
          <>
            <h3>Earnings Summary</h3>
            <EarningsSummary
              chargers={chargers}
              bookings={bookings}
              totalEarnings={totalEarnings}
            />
          </>
        )}
      </div>

      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal">
            <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
              <AddChargerForm
                onSubmit={handleAddCharger}
                onCancel={() => setShowAddForm(false)}
              />
            </LoadScript>
          </div>
        </div>
      )}
    </div>
  );
};

export default HostDashboard;
