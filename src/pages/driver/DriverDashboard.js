import React, { useState, useEffect, useCallback } from 'react';
import { LoadScript, GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { useAuth } from '../../contexts/AuthContext';
import { fetchNearbyChargers } from '../../services/firebase/firestore';
import ChargerDetails from '../../components/driver/ChargerDetails';
import BookingModal from '../../components/driver/BookingModal';
import ChargerFilter from '../../components/driver/ChargerFilter';
import { indianCities, formatCurrency } from '../../utils/formatters';
import { useNavigate } from 'react-router-dom';
import './DriverDashboard.css';

/**
 * DriverDashboard Component:
 * The main dashboard for EV drivers to find and book charging stations.
 * 
 * Features:
 * - Displays a map with nearby charging stations.
 * - Allows filtering of charging stations based on various criteria.
 * - Provides details of selected charging stations.
 * - Enables booking of charging slots.
 */
const DriverDashboard = () => {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();
  const [chargers, setChargers] = useState([]);
  const [filteredChargers, setFilteredChargers] = useState([]);
  const [selectedCharger, setSelectedCharger] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [userLocation, setUserLocation] = useState(indianCities.delhi); // Default to Delhi
  const [loading, setLoading] = useState(true);
  const [searchAddress, setSearchAddress] = useState('');
  const [infoWindowData, setInfoWindowData] = useState(null);
  const [vehicleType, setVehicleType] = useState('4-wheeler'); // Default to 4-wheeler
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapLoadError, setMapLoadError] = useState(false);

  // Google Maps API key from environment variable
  const googleMapsApiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';

  const handleMapLoad = useCallback(map => {
    setMapLoaded(true);
    setMapLoadError(false);
  }, []);
  
  const handleMapLoadError = useCallback(error => {
    console.error('Google Maps loading error:', error);
    setMapLoadError(true);
    setLoading(false);
  }, []);
  
  // Get user's location with error handling for deployed environments
  useEffect(() => {
    // Check if the protocol is secure (required for geolocation in production)
    const isSecure = window.location.protocol === 'https:' || 
                      window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1';
                      
    if (navigator.geolocation && isSecure) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          // Keep default location in case of error
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    } else if (!isSecure) {
      console.warn('Geolocation requires HTTPS in production environments');
      // Keep default location for non-secure contexts
    }
  }, []);
  
  // Fetch chargers based on location
  useEffect(() => {
    const loadChargers = async () => {
      try {
        setLoading(true);
        
        // Define mock chargers for multiple cities
        const allMockChargers = [
          // Delhi chargers (existing)
          {
            id: '1',
            name: 'MG Road Fast Charger',
            type: 'Type 2',
            power: 22,
            pricePerKwh: 15.00,
            availability: true,
            latitude: indianCities.delhi.lat + 0.01,
            longitude: indianCities.delhi.lng + 0.01,
            address: '42 MG Road, Connaught Place, Delhi',
            hostName: 'Sharma Electric',
            rating: 4.5,
            plugType: 'Type 2',
            amenities: ['Parking', 'Chai/Coffee', 'Wifi'],
            city: 'Delhi'
          },
          {
            id: '2',
            name: 'Metro Station Charger',
            type: 'CCS',
            power: 50,
            pricePerKwh: 18.50,
            availability: true,
            latitude: indianCities.delhi.lat - 0.02,
            longitude: indianCities.delhi.lng - 0.01,
            address: 'Rajiv Chowk Metro Station, Delhi NCR',
            hostName: 'Delhi Metro Authority',
            rating: 4.2,
            plugType: 'CCS',
            amenities: ['Parking', 'Shopping', 'Metro Access'],
            city: 'Delhi'
          },
          {
            id: '3',
            name: 'Hotel Charging Station',
            type: 'CHAdeMO',
            power: 45,
            pricePerKwh: 0.40,
            availability: true,
            latitude: userLocation.lat + 0.015,
            longitude: userLocation.lng - 0.02,
            address: '789 Hotel Ave, Uptown',
            hostName: 'Luxury Hotel',
            rating: 4.8,
            plugType: 'CHAdeMO',
            amenities: ['Valet', 'Restaurant', 'Lounge'],
            city: 'Delhi'
          },
          // Additional charging stations
          {
            id: '4',
            name: 'South Delhi EV Hub',
            type: 'Type 2',
            power: 30,
            pricePerKwh: 16.50,
            availability: true,
            latitude: indianCities.delhi.lat - 0.03,
            longitude: indianCities.delhi.lng + 0.02,
            address: '123 South Extension, New Delhi',
            hostName: 'Green Power Ltd',
            rating: 4.3,
            plugType: 'Type 2',
            amenities: ['Parking', 'Convenience Store', 'Restrooms'],
            city: 'Delhi'
          },
          {
            id: '5',
            name: 'North Delhi Fast Charger',
            type: 'CCS',
            power: 60,
            pricePerKwh: 19.75,
            availability: false, // This one is occupied
            latitude: indianCities.delhi.lat + 0.04,
            longitude: indianCities.delhi.lng - 0.01,
            address: '456 Model Town, Delhi',
            hostName: 'PowerCharge India',
            rating: 4.7,
            plugType: 'CCS',
            amenities: ['Parking', 'Cafe', 'WiFi'],
            city: 'Delhi'
          },
          {
            id: '6',
            name: 'Shopping Mall Charger',
            type: 'Type 2',
            power: 22,
            pricePerKwh: 14.50,
            availability: true,
            latitude: indianCities.delhi.lat + 0.02,
            longitude: indianCities.delhi.lng + 0.03,
            address: 'Select Citywalk Mall, Saket, New Delhi',
            hostName: 'Mall Charging Solutions',
            rating: 4.1,
            plugType: 'Type 2',
            amenities: ['Shopping', 'Food Court', 'Cinema'],
            city: 'Delhi'
          },
          {
            id: '7',
            name: 'Office Complex Station',
            type: 'CHAdeMO',
            power: 40,
            pricePerKwh: 17.25,
            availability: true,
            latitude: indianCities.delhi.lat - 0.01,
            longitude: indianCities.delhi.lng - 0.04,
            address: 'Cyber City, Gurgaon',
            hostName: 'Corporate EV Solutions',
            rating: 4.4,
            plugType: 'CHAdeMO',
            amenities: ['Parking', 'Coffee Shop', 'Business Center'],
            city: 'Delhi'
          },
          {
            id: '8',
            name: 'Residential Society Charger',
            type: 'Type 2',
            power: 11,
            pricePerKwh: 12.00,
            availability: true,
            latitude: indianCities.delhi.lat - 0.025,
            longitude: indianCities.delhi.lng + 0.035,
            address: 'Green Valley Apartments, Noida',
            hostName: 'Resident Welfare Association',
            rating: 3.9,
            plugType: 'Type 2',
            amenities: ['24x7 Access', 'Security'],
            city: 'Delhi'
          },
          {
            id: '9',
            name: 'Highway Rest Stop',
            type: 'CCS',
            power: 75,
            pricePerKwh: 21.00,
            availability: true,
            latitude: indianCities.delhi.lat + 0.05,
            longitude: indianCities.delhi.lng + 0.05,
            address: 'NH-8 Highway, Delhi-Jaipur Road',
            hostName: 'Highway Infrastructure Ltd',
            rating: 4.6,
            plugType: 'CCS',
            amenities: ['Food', 'Restrooms', 'Convenience Store'],
            city: 'Delhi'
          },
          {
            id: '10',
            name: 'Airport Charging Point',
            type: 'CHAdeMO',
            power: 50,
            pricePerKwh: 20.00,
            availability: true,
            latitude: indianCities.delhi.lat - 0.04,
            longitude: indianCities.delhi.lng - 0.03,
            address: 'IGI Airport, New Delhi',
            hostName: 'Airport Authority',
            rating: 4.8,
            plugType: 'CHAdeMO',
            amenities: ['Premium Parking', 'Lounge Access', 'Valet'],
            city: 'Delhi'
          },
          // Mumbai chargers
          {
            id: '11',
            name: 'Bandra Worli Sea Link EV Station',
            type: 'CCS',
            power: 60,
            pricePerKwh: 16.50,
            availability: true,
            latitude: indianCities.mumbai.lat + 0.01,
            longitude: indianCities.mumbai.lng - 0.01,
            address: 'Sea Link Parking, Bandra, Mumbai',
            hostName: 'Maharashtra EV Corp',
            rating: 4.6,
            plugType: 'CCS',
            amenities: ['Parking', 'Sea View', 'Security'],
            city: 'Mumbai'
          },
          {
            id: '12',
            name: 'Andheri Metro Station Charger',
            type: 'Type 2',
            power: 22,
            pricePerKwh: 14.00,
            availability: false,
            latitude: indianCities.mumbai.lat - 0.02,
            longitude: indianCities.mumbai.lng + 0.01,
            address: 'Andheri Metro Station, Western Line, Mumbai',
            hostName: 'Metro EV Connect',
            rating: 4.1,
            plugType: 'Type 2',
            amenities: ['Metro Access', 'Shopping', 'Food Court'],
            city: 'Mumbai'
          },
          {
            id: '13',
            name: 'Powai Lake EV Hub',
            type: 'CHAdeMO',
            power: 50,
            pricePerKwh: 17.25,
            availability: true,
            latitude: indianCities.mumbai.lat - 0.03,
            longitude: indianCities.mumbai.lng + 0.03,
            address: 'Powai Lake, Near IIT Campus, Mumbai',
            hostName: 'Tech Green Solutions',
            rating: 4.7,
            plugType: 'CHAdeMO',
            amenities: ['Lake View', 'Cafe', 'WiFi'],
            city: 'Mumbai'
          },
          // Bangalore chargers
          {
            id: '14',
            name: 'MG Road Tech Park',
            type: 'Type 2',
            power: 22,
            pricePerKwh: 15.50,
            availability: true,
            latitude: indianCities.bangalore.lat + 0.01,
            longitude: indianCities.bangalore.lng + 0.02,
            address: 'MG Road Tech Park, Bangalore',
            hostName: 'Karnataka Power Ltd',
            rating: 4.4,
            plugType: 'Type 2',
            amenities: ['Parking', 'Coffee Shop', 'WiFi'],
            city: 'Bangalore'
          },
          {
            id: '15',
            name: 'Electronic City Fast Charger',
            type: 'CCS',
            power: 75,
            pricePerKwh: 18.50,
            availability: true,
            latitude: indianCities.bangalore.lat - 0.04,
            longitude: indianCities.bangalore.lng - 0.02,
            address: 'Electronic City Phase 1, Bangalore',
            hostName: 'E-City Power Solutions',
            rating: 4.8,
            plugType: 'CCS',
            amenities: ['Tech Support', 'Cafe', 'Lounge'],
            city: 'Bangalore'
          },
          {
            id: '16',
            name: 'Whitefield Mall Charging Point',
            type: 'CHAdeMO',
            power: 45,
            pricePerKwh: 16.75,
            availability: true,
            latitude: indianCities.bangalore.lat + 0.03,
            longitude: indianCities.bangalore.lng - 0.03,
            address: 'Phoenix Mall, Whitefield, Bangalore',
            hostName: 'Retail EV Solutions',
            rating: 4.3,
            plugType: 'CHAdeMO',
            amenities: ['Shopping', 'Food Court', 'Cinema'],
            city: 'Bangalore'
          },
          // Chennai chargers
          {
            id: '17',
            name: 'Marina Beach EV Point',
            type: 'Type 2',
            power: 22,
            pricePerKwh: 14.25,
            availability: true,
            latitude: indianCities.chennai.lat - 0.01,
            longitude: indianCities.chennai.lng + 0.01,
            address: 'Marina Beach Road, Chennai',
            hostName: 'Tamil Nadu Electric',
            rating: 4.2,
            plugType: 'Type 2',
            amenities: ['Beach View', 'Parking', 'Food Stalls'],
            city: 'Chennai'
          },
          {
            id: '18',
            name: 'IT Corridor Fast Charger',
            type: 'CCS',
            power: 60,
            pricePerKwh: 17.00,
            availability: true,
            latitude: indianCities.chennai.lat + 0.02,
            longitude: indianCities.chennai.lng - 0.02,
            address: 'Rajiv Gandhi IT Highway, Chennai',
            hostName: 'TN Tech Solutions',
            rating: 4.5,
            plugType: 'CCS',
            amenities: ['Tech Support', 'Coffee Shop', 'WiFi'],
            city: 'Chennai'
          },
          // Hyderabad chargers
          {
            id: '19',
            name: 'Hitech City Charging Hub',
            type: 'CCS',
            power: 50,
            pricePerKwh: 16.25,
            availability: true,
            latitude: indianCities.hyderabad.lat + 0.02,
            longitude: indianCities.hyderabad.lng + 0.01,
            address: 'Hitech City Main Road, Hyderabad',
            hostName: 'Telangana Power Grid',
            rating: 4.6,
            plugType: 'CCS',
            amenities: ['Tech Support', 'Cafe', 'WiFi'],
            city: 'Hyderabad'
          },
          {
            id: '20',
            name: 'Charminar Tourist EV Point',
            type: 'Type 2',
            power: 22,
            pricePerKwh: 14.75,
            availability: true,
            latitude: indianCities.hyderabad.lat - 0.03,
            longitude: indianCities.hyderabad.lng - 0.01,
            address: 'Near Charminar, Old City, Hyderabad',
            hostName: 'Heritage EV Solutions',
            rating: 4.0,
            plugType: 'Type 2',
            amenities: ['Tourist Information', 'Local Food', 'Guided Tours'],
            city: 'Hyderabad'
          },
          // Kolkata chargers
          {
            id: '21',
            name: 'Salt Lake Stadium Charger',
            type: 'CHAdeMO',
            power: 45,
            pricePerKwh: 15.25,
            availability: true,
            latitude: indianCities.kolkata.lat + 0.02,
            longitude: indianCities.kolkata.lng + 0.03,
            address: 'Salt Lake Stadium Complex, Kolkata',
            hostName: 'Bengal Power',
            rating: 4.3,
            plugType: 'CHAdeMO',
            amenities: ['Parking', 'Sports Shop', 'Cafe'],
            city: 'Kolkata'
          },
          {
            id: '22',
            name: 'Howrah Bridge EV Station',
            type: 'Type 2',
            power: 22,
            pricePerKwh: 13.75,
            availability: true,
            latitude: indianCities.kolkata.lat - 0.01,
            longitude: indianCities.kolkata.lng - 0.02,
            address: 'Near Howrah Bridge, Kolkata',
            hostName: 'Kolkata Electric',
            rating: 4.1,
            plugType: 'Type 2',
            amenities: ['River View', 'Street Food', 'Tourist Info'],
            city: 'Kolkata'
          },
          // Pune chargers
          {
            id: '23',
            name: 'Koregaon Park Charging Hub',
            type: 'CCS',
            power: 50,
            pricePerKwh: 16.00,
            availability: true,
            latitude: indianCities.pune.lat + 0.01,
            longitude: indianCities.pune.lng + 0.01,
            address: 'Koregaon Park Main Road, Pune',
            hostName: 'Pune Eco Solutions',
            rating: 4.5,
            plugType: 'CCS',
            amenities: ['Valet', 'Fine Dining', 'Shopping'],
            city: 'Pune'
          },
          {
            id: '24',
            name: 'Hinjewadi IT Park Charger',
            type: 'CHAdeMO',
            power: 60,
            pricePerKwh: 17.50,
            availability: true,
            latitude: indianCities.pune.lat - 0.02,
            longitude: indianCities.pune.lng - 0.01,
            address: 'Hinjewadi Phase 2, Pune',
            hostName: 'Tech Valley EV',
            rating: 4.7,
            plugType: 'CHAdeMO',
            amenities: ['Tech Support', 'Coffee Shop', 'WiFi'],
            city: 'Pune'
          },
          // Additional Pune chargers
          {
            id: 'pune-21',
            name: 'TML Balajee Auto - Aundh',
            type: 'AC Type-2 Charger',
            power: 22,
            pricePerKwh: 33.15,
            availability: true,
            latitude: 18.5578,
            longitude: 73.8077,
            address: 'Phase 2, Siddarth Nagar, Aundh, Pune',
            hostName: 'Tata Motors',
            rating: 4.2,
            plugType: 'Type 2',
            hours: '24/7',
            connectorTypes: ['Type 2'],
            amenities: ['Service Center', 'Waiting Area'],
            city: 'Pune'
          },
          {
            id: 'pune-22',
            name: 'Vilux Theater - Khadki',
            type: 'AC Type-2 Charger',
            power: 22,
            pricePerKwh: 33.15,
            availability: true,
            latitude: 18.5679,
            longitude: 73.8567,
            address: 'Vilux Theater, Khadki, Pune',
            hostName: 'Vilux Entertainment',
            rating: 4.0,
            plugType: 'Type 2',
            hours: '24/7',
            connectorTypes: ['Type 2'],
            amenities: ['Cinema', 'Food Court'],
            city: 'Pune'
          },
          {
            id: 'pune-23',
            name: 'Tata Motors (Bafna) - Baner',
            type: 'Bharat DC001 Charger',
            power: 15,
            pricePerKwh: 67.5,
            availability: true,
            latitude: 18.5590,
            longitude: 73.7865,
            address: 'Supreme Headquarters, Showroom No 36, Baner, Pune',
            hostName: 'Bafna Motors',
            rating: 4.3,
            plugType: 'Bharat DC001',
            hours: '24/7',
            connectorTypes: ['Bharat DC001'],
            amenities: ['Showroom', 'Customer Lounge'],
            city: 'Pune'
          },
          {
            id: 'pune-24',
            name: 'Tata Motors (Panchajanya) - Bhosari',
            type: 'Multi-Charger Station',
            power: 50,
            pricePerKwh: 112.5,
            availability: true,
            latitude: 18.6186,
            longitude: 73.8478,
            address: 'Panchajanya, Bhosari, Pune',
            hostName: 'Panchajanya Motors',
            rating: 4.5,
            plugType: 'CCS-2',
            hours: '24/7',
            connectorTypes: ['CHAdeMO', 'CCS-2', 'Bharat DC001'],
            amenities: ['Service Center', 'Restrooms'],
            city: 'Pune'
          },
          {
            id: 'pune-25',
            name: 'IOCL Trishul Service Station',
            type: 'Multi-Charger Station',
            power: 50,
            pricePerKwh: 112.5,
            availability: true,
            latitude: 18.6185,
            longitude: 73.8420,
            address: 'Trishul Service Station, Pune',
            hostName: 'Indian Oil Corporation',
            rating: 4.4,
            plugType: 'CCS-2',
            hours: '24/7',
            connectorTypes: ['CHAdeMO', 'CCS-2', 'AC Type-2'],
            amenities: ['Petrol Pump', 'Convenience Store'],
            city: 'Pune'
          },
          {
            id: 'pune-26',
            name: 'Ginger Hotel - Wakad',
            type: 'Tatapower Charger',
            power: 22,
            pricePerKwh: 33.15,
            availability: true,
            latitude: 18.5994,
            longitude: 73.7665,
            address: 'Near Indira College Rd, Kala Khadak, Wakad, Pune',
            hostName: 'Ginger Hotels',
            rating: 4.1,
            plugType: 'Type 2',
            hours: '24/7',
            connectorTypes: ['Type 2'],
            amenities: ['Hotel', 'Restaurant'],
            city: 'Pune'
          },
          {
            id: 'pune-27',
            name: 'Lodha Belmondo - Opp MCA Stadium',
            type: 'Tatapower Private Charger',
            power: 22,
            pricePerKwh: 33.15,
            availability: false,
            latitude: 18.6500,
            longitude: 73.7600,
            address: 'Lodha Belmondo, Mumbai - Pune Expy, Opposite MCA Stadium, Pune',
            hostName: 'Lodha Group',
            rating: 4.0,
            plugType: 'Type 2',
            hours: 'Private Access',
            connectorTypes: ['Type 2'],
            amenities: ['Residential Complex', 'Security'],
            city: 'Pune'
          },
          {
            id: 'pune-28',
            name: 'VEVC-79 - Infosys Parking, Hinjewadi Phase 2',
            type: 'Volttic Charger',
            power: 50,
            pricePerKwh: 112.5,
            availability: true,
            latitude: 18.5916,
            longitude: 73.7389,
            address: 'Infosys Parking, MLPL Gate 5, Hinjewadi Phase 2, Pune',
            hostName: 'Volttic',
            rating: 4.6,
            plugType: 'CCS',
            hours: '24/7',
            connectorTypes: ['CCS', 'CHAdeMO'],
            amenities: ['IT Park', 'Security'],
            city: 'Pune'
          },
          {
            id: 'pune-29',
            name: 'Bhajan Singh Da Dhabha Charging Station',
            type: 'Sunfuel Charger',
            power: 22,
            pricePerKwh: 33.15,
            availability: true,
            latitude: 18.5000,
            longitude: 73.8500,
            address: 'Bhajan Singh Da Dhabha, Pune',
            hostName: 'Sunfuel',
            rating: 4.2,
            plugType: 'Type 2',
            hours: '24/7',
            connectorTypes: ['Type 2'],
            amenities: ['Restaurant', 'Parking'],
            city: 'Pune'
          },
          {
            id: 'pune-30',
            name: 'Sunfuel - Club Mahindra Resort - Tungi',
            type: 'Sunfuel Charger',
            power: 22,
            pricePerKwh: 33.15,
            availability: true,
            latitude: 18.6000,
            longitude: 73.7000,
            address: 'Club Mahindra Resort, Tungi, Pune',
            hostName: 'Sunfuel & Club Mahindra',
            rating: 4.3,
            plugType: 'Type 2',
            hours: '24/7',
            connectorTypes: ['Type 2'],
            amenities: ['Resort', 'Recreation'],
            city: 'Pune'
          },
          // New Pune chargers - Adding from pune-31 to pune-50
          {
            id: 'pune-31',
            name: 'Tata Power Charging Station - Panchjanya Motors',
            type: 'DC Fast Charger',
            power: 50,
            pricePerKwh: 18.00,
            availability: true,
            latitude: 18.6186,
            longitude: 73.8478,
            address: 'Wakad - Bhosari BRTS Road, Century Enka Colony, Bhosari, Pimpri-Chinchwad, Maharashtra 411039',
            hostName: 'Tata Power',
            rating: 4.5,
            plugType: 'CCS',
            hours: '24/7',
            connectorTypes: ['CCS', 'CHAdeMO'],
            amenities: ['Service Center', 'Restrooms'],
            city: 'Pune'
          },
          {
            id: 'pune-32',
            name: 'Tata Power Charging Station - Rudra Motors',
            type: 'DC Fast Charger',
            power: 50,
            pricePerKwh: 18.00,
            availability: true,
            latitude: 18.5760,
            longitude: 73.9866,
            address: 'Gat No. 1343/A2, Near Ubale Nagar Bus Stop, Wagholi, Pune-412207',
            hostName: 'Tata Power',
            rating: 4.4,
            plugType: 'CCS',
            hours: '24/7',
            connectorTypes: ['CCS', 'CHAdeMO'],
            amenities: ['Showroom', 'Customer Lounge'],
            city: 'Pune'
          },
          {
            id: 'pune-33',
            name: 'Tata Power Charging Station - Concorde Tathawade',
            type: 'DC Fast Charger',
            power: 50,
            pricePerKwh: 18.00,
            availability: true,
            latitude: 18.5921,
            longitude: 73.7550,
            address: 'Gate No. 129/2B/1, Mumbai Bangalore Express Highway, Ashok Nagar, Tathawade, Pune-411033',
            hostName: 'Tata Power',
            rating: 4.3,
            plugType: 'CCS',
            hours: '24/7',
            connectorTypes: ['CCS', 'CHAdeMO'],
            amenities: ['Service Center', 'Restrooms'],
            city: 'Pune'
          },
          {
            id: 'pune-34',
            name: 'Tata Power Charging Station - Concorde Baner',
            type: 'DC Fast Charger',
            power: 50,
            pricePerKwh: 18.00,
            availability: true,
            latitude: 18.5590,
            longitude: 73.7865,
            address: 'Supreme Headquarters, Showroom No. 36, Mumbai-Bangalore Highway, Mohan Nagar Co-Op Society, Baner, Pune, Maharashtra 411045',
            hostName: 'Tata Power',
            rating: 4.2,
            plugType: 'CCS',
            hours: '24/7',
            connectorTypes: ['CCS', 'CHAdeMO'],
            amenities: ['Showroom', 'Customer Lounge'],
            city: 'Pune'
          },
          {
            id: 'pune-35',
            name: 'Tata Power Charging Station - TACO Hinjewadi Phase II',
            type: 'DC Fast Charger',
            power: 50,
            pricePerKwh: 18.00,
            availability: true,
            latitude: 18.5916,
            longitude: 73.7389,
            address: 'SR. NO 280 & 281, Hinjawadi Phase II, Hinjewadi Rajiv Gandhi Infotech Park, Hinjawadi, Pune, Maharashtra 411057',
            hostName: 'Tata Power',
            rating: 4.6,
            plugType: 'CCS',
            hours: '24/7',
            connectorTypes: ['CCS', 'CHAdeMO'],
            amenities: ['IT Park', 'Security'],
            city: 'Pune'
          },
          {
            id: 'pune-36',
            name: 'Tata Power Charging Station - Amanora Urban Plaza',
            type: 'AC Charger',
            power: 22,
            pricePerKwh: 16.50,
            availability: true,
            latitude: 18.5196,
            longitude: 73.9345,
            address: '58, Amanora Park Town, Hadapsar, Pune, Maharashtra 411028',
            hostName: 'Tata Power',
            rating: 4.3,
            plugType: 'Type 2',
            hours: '24/7',
            connectorTypes: ['Type 2'],
            amenities: ['Shopping Mall', 'Restaurants'],
            city: 'Pune'
          },
          {
            id: 'pune-37',
            name: 'Tata Power Charging Station - Ginger Hotel Wakad',
            type: 'AC Charger',
            power: 22,
            pricePerKwh: 16.50,
            availability: true,
            latitude: 18.5994,
            longitude: 73.7665,
            address: 'Near Indira College Rd, Kala Khadak, Wakad, Pune',
            hostName: 'Tata Power',
            rating: 4.1,
            plugType: 'Type 2',
            hours: '24/7',
            connectorTypes: ['Type 2'],
            amenities: ['Hotel', 'Restaurant'],
            city: 'Pune'
          },
          {
            id: 'pune-38',
            name: 'Tata Power Charging Station - Bafna Motors Erandwane',
            type: 'DC Fast Charger',
            power: 50,
            pricePerKwh: 18.00,
            availability: true,
            latitude: 18.5090,
            longitude: 73.8291,
            address: 'Swojas Capital, Law College Rd, Shanti Sheela Society, Apex Colony, Erandwane, Pune, Maharashtra 411008',
            hostName: 'Tata Power',
            rating: 4.4,
            plugType: 'CCS',
            hours: '24/7',
            connectorTypes: ['CCS', 'CHAdeMO'],
            amenities: ['Showroom', 'Customer Lounge'],
            city: 'Pune'
          },
          {
            id: 'pune-39',
            name: 'Tata Power Charging Station - TACO Phase II',
            type: 'DC Fast Charger',
            power: 50,
            pricePerKwh: 18.00,
            availability: true,
            latitude: 18.5916,
            longitude: 73.7450, // Slightly modified to avoid exact duplicate
            address: 'SR. NO 280 & 281, Hinjawadi Phase II, Hinjewadi Rajiv Gandhi Infotech Park, Hinjawadi, Pune, Maharashtra 411057',
            hostName: 'Tata Power',
            rating: 4.6,
            plugType: 'CCS',
            hours: '24/7',
            connectorTypes: ['CCS', 'CHAdeMO'],
            amenities: ['IT Park', 'Security'],
            city: 'Pune'
          },
          {
            id: 'pune-40',
            name: 'Tata Power Charging Station - Rudra Motors Wagholi',
            type: 'DC Fast Charger',
            power: 50,
            pricePerKwh: 18.00,
            availability: true,
            latitude: 18.5760,
            longitude: 73.9860, // Slightly modified to avoid exact duplicate
            address: 'Gat No.1343/A, Near Ubale Nagar Bus Stop, Wagholi-412207',
            hostName: 'Tata Power',
            rating: 4.4,
            plugType: 'CCS',
            hours: '24/7',
            connectorTypes: ['CCS', 'CHAdeMO'],
            amenities: ['Showroom', 'Customer Lounge'],
            city: 'Pune'
          },
          // Adding stations from second batch (41-50)
          // Skipping exact duplicates of pune-41 and pune-42 (they match pune-31 and pune-32)
          // Skipping exact duplicates of pune-43 and pune-44 (they match pune-33 and pune-34)
          {
            id: 'pune-45',
            name: 'Tata Power Charging Station - TACO Hinjewadi Phase II',
            type: 'DC Fast Charger',
            power: 50,
            pricePerKwh: 18.00,
            availability: true,
            latitude: 18.5916,
            longitude: 73.7380, // Slightly modified to avoid exact duplicate
            address: 'SR. NO 280 & 281, Hinjawadi Phase II, Hinjewadi Rajiv Gandhi Infotech Park, Hinjawadi, Pune, Maharashtra 411057',
            hostName: 'Tata Power',
            rating: 4.3,
            plugType: 'CCS',
            hours: '24/7',
            connectorTypes: ['CCS', 'CHAdeMO'],
            amenities: ['Tech Park', 'Cafeteria'],
            city: 'Pune'
          },
          {
            id: 'pune-46',
            name: 'ChargeZone - Novotel Hotel Viman Nagar',
            type: 'AC/DC Charger',
            power: 30,
            pricePerKwh: 16.50,
            availability: true,
            latitude: 18.5679,
            longitude: 73.9143,
            address: 'Novotel Hotel, Block-D, 1F, Sakore Nagar, Viman Nagar, Pune, Maharashtra 411014',
            hostName: 'ChargeZone',
            rating: 4.4,
            plugType: 'CCS',
            hours: '24/7',
            connectorTypes: ['CCS', 'Type 2'],
            amenities: ['Hotel', 'Restaurants'],
            city: 'Pune'
          },
          {
            id: 'pune-47',
            name: 'ChargeZone - JW Marriott Senapati Bapat Road',
            type: 'AC/DC Charger',
            power: 30,
            pricePerKwh: 16.50,
            availability: true,
            latitude: 18.5285,
            longitude: 73.8291,
            address: 'JW Marriott Hotel, Senapati Bapat Rd, Pune, Maharashtra 411053',
            hostName: 'ChargeZone',
            rating: 4.5,
            plugType: 'CCS',
            hours: '24/7',
            connectorTypes: ['CCS', 'Type 2'],
            amenities: ['Hotel', 'Shopping'],
            city: 'Pune'
          },
          {
            id: 'pune-48',
            name: 'ChargeZone - The Ritz-Carlton Yerawada',
            type: 'AC/DC Charger',
            power: 30,
            pricePerKwh: 16.50,
            availability: true,
            latitude: 18.5628,
            longitude: 73.8986,
            address: 'The Ritz-Carlton, Golf Course Square, Airport Rd, Yerawada, Pune, Maharashtra 411006',
            hostName: 'ChargeZone',
            rating: 4.6,
            plugType: 'CCS',
            hours: '24/7',
            connectorTypes: ['CCS', 'Type 2'],
            amenities: ['Luxury Hotel', 'Dining'],
            city: 'Pune'
          },
          {
            id: 'pune-49',
            name: 'ChargeZone - Marriott Suites Fatima Nagar',
            type: 'AC/DC Charger',
            power: 30,
            pricePerKwh: 16.50,
            availability: true,
            latitude: 18.5018,
            longitude: 73.9021,
            address: 'Marriott Suites Pune, 81, Mundhwa Rd, Fatima Nagar, Pune, Maharashtra 411036',
            hostName: 'ChargeZone',
            rating: 4.4,
            plugType: 'CCS',
            hours: '24/7',
            connectorTypes: ['CCS', 'Type 2'],
            amenities: ['Hotel', 'Restaurants'],
            city: 'Pune'
          },
          {
            id: 'pune-50',
            name: 'ChargeZone - ONYX Koregaon Park',
            type: 'AC/DC Charger',
            power: 30,
            pricePerKwh: 16.50,
            availability: true,
            latitude: 18.5362,
            longitude: 73.8938,
            address: 'ONYX, N Main Rd, Koregaon Park Annexe, Koregaon Park, Pune, Maharashtra 411001',
            hostName: 'ChargeZone',
            rating: 4.3,
            plugType: 'CCS',
            hours: '24/7',
            connectorTypes: ['CCS', 'Type 2'],
            amenities: ['Shopping', 'Cafés'],
            city: 'Pune'
          }
        ];
        
        setChargers(allMockChargers);
        setFilteredChargers(allMockChargers);
        
      } catch (error) {
        console.error('Error fetching chargers:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChargers();
  }, [userLocation]);

  const handleFilter = (filters) => {
    let filtered = [...chargers];
    
    // Filter by vehicle type
    if (vehicleType) {
      filtered = filtered.filter(charger => {
        // This is a placeholder. In a real app, you'd have charger compatibility info.
        // For now, assume all chargers are compatible.
        return true;
      });
    }
    
    if (filters.type && filters.type !== 'all') {
      filtered = filtered.filter(charger => charger.plugType === filters.type);
    }
    
    if (filters.minPower) {
      filtered = filtered.filter(charger => charger.power >= parseInt(filters.minPower));
    }
    
    if (filters.maxPrice) {
      filtered = filtered.filter(charger => charger.pricePerKwh <= parseFloat(filters.maxPrice));
    }
    
    if (filters.amenities && filters.amenities.length > 0) {
      filtered = filtered.filter(charger => 
        filters.amenities.every(amenity => charger.amenities.includes(amenity))
      );
    }
    
    setFilteredChargers(filtered);
  };

  const handleBookCharger = async () => {
    if (!selectedCharger || !selectedDate || !selectedTime || !currentUser) return;
    
    try {
      // This will be implemented with actual Firestore booking creation
      // await createBooking({
      //   chargerId: selectedCharger.id,
      //   userId: currentUser.uid,
      //   date: selectedDate,
      //   timeSlot: selectedTime,
      //   status: 'confirmed'
      // });
      
      // For now, just simulate a successful booking
      setTimeout(() => {
        setBookingSuccess(true);
        setShowBookingModal(false);
      }, 1000);
    } catch (error) {
      console.error('Error creating booking:', error);
    }
  };

  const handleMarkerClick = (charger) => {
    setInfoWindowData(charger);
  };

  // Add these new state variables for search functionality
  const [isSearching, setIsSearching] = useState(false);

  // Handle navigation for header links
  const handleNavigation = (path) => {
    navigate(path);
  };

  // Handle search button click
  const handleSearch = () => {
    if (!searchAddress.trim()) return;
    
    setIsSearching(true);
    
    // In a real app, you would use a geocoding API to convert the address to coordinates
    // For now, simulate a search with a delay
    setTimeout(() => {
      // Mock search results - just filter existing chargers by partial address match
      const searchResults = chargers.filter(charger => 
        charger.address.toLowerCase().includes(searchAddress.toLowerCase())
      );
      
      setFilteredChargers(searchResults);
      setIsSearching(false);
      
      // If we have results, center the map on the first result
      if (searchResults.length > 0) {
        setUserLocation({
          lat: searchResults[0].latitude,
          lng: searchResults[0].longitude
        });
      }
    }, 1000);
  };

  // Handle clear filters button
  const handleClearFilters = () => {
    setFilteredChargers(chargers);
    // Reset any filter state in the filter component
    // This would need to be implemented via props/callbacks to the ChargerFilter component
  };
  
  // Handle view button click in station cards
  const handleViewStation = (charger, e) => {
    e.stopPropagation(); // Prevent the card's onClick from firing
    setSelectedCharger(charger);
  };
  
  // Handle Enter key in search input
  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Add a filter by city function
  const filterByCity = (city) => {
    if (city === 'all') {
      setFilteredChargers(chargers);
    } else {
      const cityChargers = chargers.filter(charger => 
        charger.city.toLowerCase() === city.toLowerCase()
      );
      setFilteredChargers(cityChargers);
    }
  };

  return (
    <div className="driver-dashboard">
      <header className="app-header">
        <div className="header-container">
          <div className="logo" onClick={() => handleNavigation('/driver')}>
            <span className="logo-text">EV Charging Network</span>
          </div>
          <div className="nav-links">
            <a 
              href="#" 
              className="nav-item active" 
              onClick={(e) => { e.preventDefault(); handleNavigation('/driver'); }}
            >
              Find Stations
            </a>
            <a 
              href="#" 
              className="nav-item" 
              onClick={(e) => { e.preventDefault(); handleNavigation('/bookings'); }}
            >
              My Bookings
            </a>
            <a 
              href="#" 
              className="nav-item" 
              onClick={(e) => { e.preventDefault(); handleNavigation('/profile'); }}
            >
              Profile
            </a>
            <button onClick={() => logout()} className="btn-logout">Logout</button>
          </div>
        </div>
      </header>

      <div className="hero-section">
        <div className="container">
          <h1>Find EV charging stations near you</h1>
          <div className="search-box">
            <input
              type="text"
              placeholder="Enter your location"
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              className="search-input"
            />
            <button 
              className="search-button" 
              onClick={handleSearch}
              disabled={isSearching}
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>
      </div>
      
      <div className="container main-content">
        <div className="city-filter">
          <h3>Select City</h3>
          <div className="city-options">
            <button 
              className="city-button" 
              onClick={() => filterByCity('all')}
            >
              All Cities
            </button>
            <button 
              className="city-button" 
              onClick={() => filterByCity('Delhi')}
            >
              Delhi NCR
            </button>
            <button 
              className="city-button" 
              onClick={() => filterByCity('Mumbai')}
            >
              Mumbai
            </button>
            <button 
              className="city-button" 
              onClick={() => filterByCity('Bangalore')}
            >
              Bangalore
            </button>
            <button 
              className="city-button" 
              onClick={() => filterByCity('Chennai')}
            >
              Chennai
            </button>
            <button 
              className="city-button" 
              onClick={() => filterByCity('Hyderabad')}
            >
              Hyderabad
            </button>
            <button 
              className="city-button" 
              onClick={() => filterByCity('Pune')}
            >
              Pune
            </button>
            <button 
              className="city-button" 
              onClick={() => filterByCity('Kolkata')}
            >
              Kolkata
            </button>
            <button 
              className="city-button" 
              onClick={() => filterByCity('Jaipur')}
            >
              Jaipur
            </button>
          </div>
        </div>

        <div className="filters-section">
          <div className="vehicle-type-selector">
            <h3>Choose your vehicle</h3>
            <div className="vehicle-options">
              <label className={`vehicle-option ${vehicleType === '2-wheeler' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="vehicleType"
                  value="2-wheeler"
                  checked={vehicleType === '2-wheeler'}
                  onChange={(e) => setVehicleType(e.target.value)}
                />
                <div className="vehicle-icon two-wheeler"></div>
                <span>2-Wheeler</span>
              </label>
              <label className={`vehicle-option ${vehicleType === '4-wheeler' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="vehicleType"
                  value="4-wheeler"
                  checked={vehicleType === '4-wheeler'}
                  onChange={(e) => setVehicleType(e.target.value)}
                />
                <div className="vehicle-icon four-wheeler"></div>
                <span>4-Wheeler</span>
              </label>
            </div>
          </div>
          
          <ChargerFilter onFilterChange={handleFilter} />
        </div>
        
        <div className="content-grid">
          <div className="map-section">
            {loading ? (
              <div className="loading-spinner">
                <div className="spinner"></div>
                <p>Loading charging stations...</p>
              </div>
            ) : (
              <div className="map-container">
                {!googleMapsApiKey ? (
                  <div className="map-error">
                    <p>Please configure your Google Maps API key in environment settings.</p>
                  </div>
                ) : mapLoadError ? (
                  <div className="map-error">
                    <p>Error loading Google Maps. Please try again later.</p>
                  </div>
                ) : (
                  <LoadScript 
                    googleMapsApiKey={googleMapsApiKey}
                    onError={handleMapLoadError}
                  >
                    <GoogleMap
                      mapContainerStyle={{ height: '100%', width: '100%' }}
                      center={userLocation}
                      zoom={13}
                      options={{
                        styles: mapStyles,
                        disableDefaultUI: true,
                        zoomControl: true
                      }}
                      onLoad={handleMapLoad}
                    >
                      {/* User location marker */}
                      <Marker
                        position={userLocation}
                      />
                      
                      {/* Charger markers - only render when map is loaded */}
                      {filteredChargers.map(charger => (
                        <Marker
                          key={charger.id}
                          position={{ lat: charger.latitude, lng: charger.longitude }}
                          onClick={() => handleMarkerClick(charger)}
                        />
                      ))}
                      
                      {/* Info Window */}
                      {infoWindowData && (
                        <InfoWindow
                          position={{ lat: infoWindowData.latitude, lng: infoWindowData.longitude }}
                          onCloseClick={() => setInfoWindowData(null)}
                        >
                          <div className="info-window">
                            <h4>{infoWindowData.name}</h4>
                            <p className="info-address">{infoWindowData.address}</p>
                            <div className="info-details">
                              <span className="info-type">{infoWindowData.type}</span>
                              <span className="info-power">{infoWindowData.power} kW</span>
                            </div>
                            <button 
                              className="info-button"
                              onClick={() => {
                                setSelectedCharger(infoWindowData);
                                setInfoWindowData(null);
                              }}
                            >
                              View Details
                            </button>
                          </div>
                        </InfoWindow>
                      )}
                    </GoogleMap>
                  </LoadScript>
                )}
              </div>
            )}
          </div>
          
          <div className="stations-section">
            <h3>Charging Stations Near You</h3>
            {loading ? (
              <p>Finding stations...</p>
            ) : filteredChargers.length === 0 ? (
              <div className="no-results">
                <p>No chargers found matching your criteria</p>
                <button 
                  onClick={handleClearFilters}
                  className="clear-filters-button"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="stations-list">
                {filteredChargers.map(charger => (
                  <div 
                    key={charger.id} 
                    className={`station-card ${selectedCharger?.id === charger.id ? 'selected' : ''}`}
                    onClick={() => setSelectedCharger(charger)}
                  >
                    <div className="station-content">
                      <h4>{charger.name}</h4>
                      <p className="station-address">{charger.address}</p>
                      <div className="station-features">
                        <span className="feature connector-type">{charger.type}</span>
                        <span className="feature power">{charger.power} kW</span>
                        <span className="feature price">{formatCurrency(charger.pricePerKwh)}/kWh</span>
                      </div>
                      <div className="station-availability">
                        <span className={`status ${charger.availability ? 'available' : 'occupied'}`}>
                          {charger.availability ? 'Available' : 'Occupied'}
                        </span>
                        <button 
                          className="view-button"
                          onClick={(e) => handleViewStation(charger, e)}
                        >
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* ChargerDetails Modal */}
      {selectedCharger && (
        <ChargerDetails 
          charger={selectedCharger} 
          onBookNow={() => setShowBookingModal(true)}
          onClose={() => setSelectedCharger(null)}
        />
      )}
      
      {/* Booking Modal with improved functionality */}
      {showBookingModal && (
        <BookingModal
          charger={selectedCharger}
          onDateChange={(date) => setSelectedDate(date)}
          onTimeChange={(time) => setSelectedTime(time)}
          onConfirm={handleBookCharger}
          onCancel={() => setShowBookingModal(false)}
        />
      )}
      
      {/* Success Modal with improved functionality */}
      {bookingSuccess && (
        <div className="booking-success-modal">
          <div className="modal-content">
            <div className="success-icon">✓</div>
            <h3>Booking Confirmed!</h3>
            <p>Your charging session has been booked for {selectedDate?.toLocaleDateString()} at {selectedTime}.</p>
            <div className="modal-actions">
              <button 
                onClick={() => {
                  setBookingSuccess(false);
                  setSelectedCharger(null);
                }}
              >
                Close
              </button>
              <button 
                className="view-bookings-button"
                onClick={() => {
                  setBookingSuccess(false);
                  handleNavigation('/bookings');
                }}
              >
                View My Bookings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Custom map styles
const mapStyles = [
  {
    featureType: "administrative",
    elementType: "geometry",
    stylers: [{ visibility: "simplified" }]
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }]
  },
  {
    featureType: "poi",
    stylers: [{ visibility: "simplified" }]
  },
  {
    featureType: "poi.attraction",
    stylers: [{ visibility: "off" }]
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#e9e9e9" }]
  }
];

export default DriverDashboard;
