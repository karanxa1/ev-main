import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Map, { NavigationControl, Marker, Popup } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { indianCities, formatCurrency } from '../../utils/formatters';
import { MAPBOX_TOKEN } from '../../services/mapboxConfig';
import { useAuth } from '../../contexts/AuthContext';
import './HomePage.css';

// Log token availability for debugging
console.log("Mapbox token directly imported:", MAPBOX_TOKEN ? "Yes" : "No");

/**
 * HomePage Component:
 * A public landing page for the application.
 */
const HomePage = () => {
  // First initialize all hooks that don't depend on others
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  
  // Make completely sure refs are created first
  const profileRef = useRef(null);
  const aboutRef = useRef(null);
  const stationsRef = useRef(null);
  const howItWorksRef = useRef(null);
  
  // Then all state variables
  const [userLocation, setUserLocation] = useState(indianCities.pune);
  const [selectedStation, setSelectedStation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imagesLoaded, setImagesLoaded] = useState({});
  const [imageFallbackLevel, setImageFallbackLevel] = useState({});
  const [selectedCity, setSelectedCity] = useState('pune');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [locationFound, setLocationFound] = useState(false);
  const [viewState, setViewState] = useState({
    longitude: indianCities.pune.lng,
    latitude: indianCities.pune.lat,
    zoom: 12,
    bearing: 0,
    pitch: 0
  });
  // Add state for popup visibility
  const [showPopup, setShowPopup] = useState(false);

  // Common fallback image that's guaranteed to exist
  const commonFallbackImage = '/images/charging-stations/commonoimage.jpg';

  // Define city locations
  const cityLocations = {
    pune: indianCities.pune,
    delhi: indianCities.delhi,
    mumbai: indianCities.mumbai,
    bangalore: indianCities.bangalore,
    chennai: indianCities.chennai,
    hyderabad: indianCities.hyderabad
  };

  // Comprehensive EV charging station data for multiple cities
  const allChargingStations = {
    pune: [
      // Real Pune charging stations based on data from ZigWheels
      {
        id: 'pune-1',
        name: 'Tata Power Charging Station - Koregaon Park',
        type: 'DC Fast Charger',
        power: 50,
        pricePerKwh: 18.50,
        latitude: 18.5395,
        longitude: 73.8950,
        address: 'Koregaon Park, Pune, Maharashtra 411001',
        rating: 4.7,
        hours: '24/7',
        connectorTypes: ['CCS', 'CHAdeMO'],
        amenities: ['Parking', 'Café', 'Restrooms'],
        image: '/images/charging-stations/pune-tata-koregaon.jpg',
        fallbackImage: 'https://evrevo.in/uploads/profile/2239_profile.jpg'
      },
      {
        id: 'pune-2',
        name: 'HPCL EV Charging Station - University Road',
        type: 'AC Charger',
        power: 22,
        pricePerKwh: 16.00,
        latitude: 18.5218,
        longitude: 73.8560,
        address: 'HPCL Petrol Pump, University Road, Shivajinagar, Pune 411016',
        rating: 4.2,
        hours: '6 AM - 11 PM',
        connectorTypes: ['Type 2', 'Bharat AC-001'],
        amenities: ['Convenience Store', 'Fuel Station'],
        image: '/images/charging-stations/pune-hpcl-university.jpg',
        fallbackImage: 'https://www.thehindubusinessline.com/companies/article65505171.ece/alternates/FREE_1200/Worldline%20EV%20charging%20station%20at%20HPCL%20in%20Bengaluru.JPG'
      },
      {
        id: 'pune-3',
        name: 'Magenta ChargeGrid - Amanora Mall',
        type: 'DC Fast Charger',
        power: 60,
        pricePerKwh: 19.50,
        latitude: 18.5180,
        longitude: 73.9430,
        address: 'Amanora Mall, Hadapsar, Pune 411028',
        rating: 4.6,
        hours: 'Mall Hours',
        connectorTypes: ['CCS', 'CHAdeMO', 'Type 2'],
        amenities: ['Shopping Mall', 'Food Court', 'Restrooms'],
        image: '/images/charging-stations/pune-magenta-amanora.jpg',
        fallbackImage: 'https://www.chargepoints.org/sites/default/files/styles/details_image/public/EV_Charging_Stations_at_Pune_Mall.jpg'
      },
      {
        id: 'pune-4',
        name: 'Ather Charging Grid - FC Road',
        type: 'AC Charger',
        power: 3.3,
        pricePerKwh: 14.50,
        latitude: 18.5210,
        longitude: 73.8433,
        address: 'FC Road, Shivajinagar, Pune 411005',
        rating: 4.4,
        hours: '10 AM - 8 PM',
        connectorTypes: ['Ather Connector'],
        amenities: ['Shopping Area', 'Restaurants'],
        image: '/images/charging-stations/pune-ather-fc.jpg',
        fallbackImage: 'https://cdn.atherenergy.com/Ather-Energy.jpg'
      },
      {
        id: 'pune-5',
        name: 'EON Free Charging Station - IT Park',
        type: 'AC/DC Charger',
        power: 25,
        pricePerKwh: 0.00, // Free
        latitude: 18.5510,
        longitude: 73.9520,
        address: 'EON IT Park, Kharadi, Pune 411014',
        rating: 4.8,
        hours: '24/7',
        connectorTypes: ['CCS', 'Type 2', 'Bharat AC-001'],
        amenities: ['IT Park', 'Free Charging', 'Security'],
        image: '/images/charging-stations/pune-eon-kharadi.jpg',
        fallbackImage: 'https://www.electricvehicleweb.in/wp-content/uploads/2021/04/Tata-Power-EV-charging-station-IT-Park.jpg'
      },
      {
        id: 'pune-6',
        name: 'IOCL Fast Charging Hub - Baner',
        type: 'DC Fast Charger',
        power: 50,
        pricePerKwh: 18.00,
        latitude: 18.5590,
        longitude: 73.7868,
        address: 'IOCL Petrol Pump, Baner Road, Pune 411045',
        rating: 4.3,
        hours: '24/7',
        connectorTypes: ['CCS', 'CHAdeMO'],
        amenities: ['Convenience Store', 'Restrooms', '24/7 Service'],
        image: '/images/charging-stations/pune-iocl-baner.jpg',
        fallbackImage: 'https://imageio.forbes.com/specials-images/imageserve/627bd291a1b0752889105d4e/IOCL-petrol-pump-with-EV-charging/960x0.jpg'
      },
      {
        id: 'pune-7',
        name: 'Statiq Charging - Hinjewadi Phase 1',
        type: 'AC/DC Charger',
        power: 30,
        pricePerKwh: 17.50,
        latitude: 18.5893,
        longitude: 73.7388,
        address: 'Rajiv Gandhi Infotech Park, Hinjewadi Phase 1, Pune 411057',
        rating: 4.5,
        hours: '24/7',
        connectorTypes: ['CCS', 'Type 2'],
        amenities: ['IT Park', 'Cafés', 'Security'],
        image: '/images/charging-stations/pune-statiq-hinjewadi.jpg',
        fallbackImage: 'https://cdn.statiq.in/wp-content/uploads/2022/09/statiq-charging-station.png'
      },
      {
        id: 'pune-8',
        name: 'BESCOM Charging Point - Shivaji Nagar',
        type: 'AC Charger',
        power: 22,
        pricePerKwh: 15.00,
        latitude: 18.5314,
        longitude: 73.8446,
        address: 'Shivaji Nagar Bus Station, Pune 411005',
        rating: 3.9,
        hours: '6 AM - 10 PM',
        connectorTypes: ['Type 2', 'Bharat AC-001'],
        amenities: ['Bus Station', 'Public Transport'],
        image: '/images/charging-stations/pune-bescom-shivaji.jpg',
        fallbackImage: 'https://static.toiimg.com/thumb/msid-67005437,width-1280,height-720,resizemode-4/.jpg'
      },
      {
        id: 'pune-9',
        name: 'Jio-bp Pulse - Baner Road',
        type: 'DC Fast Charger',
        power: 60,
        pricePerKwh: 20.50,
        latitude: 18.5598,
        longitude: 73.7882,
        address: 'Baner Road, Baner, Pune 411045',
        rating: 4.7,
        hours: '24/7',
        connectorTypes: ['CCS', 'CHAdeMO', 'Type 2'],
        amenities: ['Café', 'Convenience Store', '24/7 Service', 'Wifi'],
        image: '/images/charging-stations/pune-jio-bp.jpg',
        fallbackImage: 'https://evreporter.com/wp-content/uploads/2023/01/Jio-bp-pulse.png'
      },
      {
        id: 'pune-10',
        name: 'BPCL EV Charging - FC Road',
        type: 'AC/DC Charger',
        power: 30,
        pricePerKwh: 16.00,
        latitude: 18.5234,
        longitude: 73.8406,
        address: 'BPCL, FC Road, Shivajinagar, Pune 411005',
        rating: 4.0,
        hours: '6 AM - 11 PM',
        connectorTypes: ['CCS', 'Type 2', 'Bharat AC-001'],
        amenities: ['Convenience Store', 'Restrooms'],
        image: '/images/charging-stations/pune-bpcl-fc.jpg',
        fallbackImage: 'https://www.bharatpetroleum.in/images/EV-charging-station1-10-Dec-2020.jpg'
      },
      {
        id: 'pune-11',
        name: 'Exicom Charging - Kharadi',
        type: 'DC Fast Charger',
        power: 50,
        pricePerKwh: 18.00,
        latitude: 18.5504,
        longitude: 73.9584,
        address: 'EON IT Park, Kharadi, Pune 411014',
        rating: 4.5,
        hours: 'Office Hours',
        connectorTypes: ['CCS', 'CHAdeMO'],
        amenities: ['IT Park', 'Food Court', 'Parking'],
        image: '/images/charging-stations/pune-exicom-kharadi.jpg',
        fallbackImage: 'https://www.exicom.in/images/Exicom-EV-chargers.jpg'
      },
      {
        id: 'pune-12',
        name: 'Okaya Power - Hinjewadi',
        type: 'DC Fast Charger',
        power: 60,
        pricePerKwh: 19.00,
        latitude: 18.5793,
        longitude: 73.7398,
        address: 'Rajiv Gandhi Infotech Park, Hinjewadi Phase 1, Pune 411057',
        rating: 4.3,
        hours: '24/7',
        connectorTypes: ['CCS', 'CHAdeMO', 'Type 2'],
        amenities: ['IT Park', 'Parking', '24/7 Support', 'Cafeteria'],
        image: '/images/charging-stations/pune-okaya-hinjewadi.jpg',
        fallbackImage: 'https://auto.hindustantimes.com/auto/news/okaya-ev-installs-over-500-charging-stations-across-india-aims-to-add-500-more-41661507042488.html'
      },
      {
        id: 'pune-13',
        name: 'Ather Grid - Kalyani Nagar',
        type: 'AC Charger',
        power: 3.3,
        pricePerKwh: 12.00,
        latitude: 18.5470,
        longitude: 73.9000,
        address: 'Kalyani Nagar, Pune 411006',
        rating: 4.6,
        hours: '9 AM - 9 PM',
        connectorTypes: ['Ather Connector'],
        amenities: ['Shopping Area', 'Cafés'],
        image: '/images/charging-stations/pune-ather-kalyani.jpg',
        fallbackImage: 'https://www.91wheels.com/assets/ather-genericpages/img/grid.jpg'
      },
      {
        id: 'pune-14',
        name: 'Statiq Charging - Wakad',
        type: 'AC/DC Charger',
        power: 25,
        pricePerKwh: 15.50,
        latitude: 18.5968,
        longitude: 73.7614,
        address: 'Wakad, Pune 411057',
        rating: 4.2,
        hours: '24/7',
        connectorTypes: ['CCS', 'Type 2'],
        amenities: ['Parking', 'Security'],
        image: '/images/charging-stations/pune-statiq-wakad.jpg',
        fallbackImage: 'https://www.statiq.in/wp-content/uploads/2022/09/statiq-charging-station.png'
      },
      {
        id: 'pune-15',
        name: 'Delta EV Charging - Chinchwad',
        type: 'DC Fast Charger',
        power: 60,
        pricePerKwh: 18.50,
        latitude: 18.6298,
        longitude: 73.7997,
        address: 'Chinchwad, Pune 411033',
        rating: 4.1,
        hours: '24/7',
        connectorTypes: ['CCS', 'CHAdeMO'],
        amenities: ['Industrial Area', 'Parking'],
        image: '/images/charging-stations/pune-delta-chinchwad.jpg',
        fallbackImage: 'https://www.deltaelectronicsindia.com/wp-content/uploads/2020/08/Delta-EV-Chargers.png'
      },
      {
        id: 'pune-16',
        name: 'ReVolt EV Station - Wagholi',
        type: 'AC Charger',
        power: 22,
        pricePerKwh: 15.00,
        latitude: 18.5725,
        longitude: 73.9881,
        address: 'Wagholi, Pune 412207',
        rating: 3.9,
        hours: '8 AM - 10 PM',
        connectorTypes: ['Type 2', 'Bharat AC-001'],
        amenities: ['Parking', 'Residential Area'],
        image: '/images/charging-stations/pune-revolt-wagholi.jpg',
        fallbackImage: 'https://auto.economictimes.indiatimes.com/news/oil-and-lubes/ev-charging-station-at-retail-outlets-to-accelerate/75446762'
      },
      {
        id: 'pune-17',
        name: 'Tata Power EZ Charge - Magarpatta City',
        type: 'DC Fast Charger',
        power: 50,
        pricePerKwh: 18.00,
        latitude: 18.5156,
        longitude: 73.9261,
        address: 'Magarpatta City, Hadapsar, Pune 411028',
        rating: 4.5,
        hours: '24/7',
        connectorTypes: ['CCS', 'CHAdeMO'],
        amenities: ['Township', 'Shopping', 'Restaurants'],
        image: '/images/charging-stations/pune-tata-magarpatta.jpg',
        fallbackImage: 'https://tatapower.com/images/all-india-ev-charging.jpg'
      },
      {
        id: 'pune-18',
        name: 'ChargeZone - NIBM Road',
        type: 'AC/DC Charger',
        power: 30,
        pricePerKwh: 16.50,
        latitude: 18.4820,
        longitude: 73.9031,
        address: 'NIBM Road, Pune 411048',
        rating: 4.3,
        hours: '24/7',
        connectorTypes: ['CCS', 'Type 2'],
        amenities: ['Residential Area', 'Cafés', 'Parking'],
        image: '/images/charging-stations/pune-chargezone-nibm.jpg',
        fallbackImage: 'https://ev.chargezone.in/wp-content/uploads/2022/09/chargezone-home-img.png'
      },
      {
        id: 'pune-19',
        name: 'Volttic Charging - Viman Nagar',
        type: 'DC Fast Charger',
        power: 60,
        pricePerKwh: 19.00,
        latitude: 18.5746,
        longitude: 73.9184,
        address: 'Viman Nagar, Pune 411014',
        rating: 4.4,
        hours: '24/7',
        connectorTypes: ['CCS', 'CHAdeMO', 'Type 2'],
        amenities: ['24/7 Service', 'Security', 'Residential Area'],
        image: '/images/charging-stations/pune-volttic-viman.jpg',
        fallbackImage: 'https://volttic.com/wp-content/themes/volttic/assets/images/volttic-charging-unity.jpg'
      },
      {
        id: 'pune-20',
        name: 'Ola Hypercharger - Shivaji Nagar',
        type: 'DC Fast Charger',
        power: 50,
        pricePerKwh: 18.00,
        latitude: 18.5245,
        longitude: 73.8478,
        address: 'Shivaji Nagar, Pune 411005',
        rating: 4.4,
        hours: '24/7',
        connectorTypes: ['CCS', 'Type 2'],
        amenities: ['Central Location', 'Shopping', 'Restaurants'],
        image: '/images/charging-stations/pune-ola-shivajinagar.jpg',
        fallbackImage: 'https://www.91wheels.com/assets/images/images/olanewsimages/Ola%20hypercharger.jpg'
      },
      {
        id: 'pune-21',
        name: 'TML Balajee Auto - Aundh',
        type: 'AC Type-2 Charger',
        power: 22,
        pricePerKwh: 33.15,
        latitude: 18.5578,
        longitude: 73.8077,
        address: 'Phase 2, Siddarth Nagar, Aundh, Pune',
        rating: 4.2,
        hours: '24/7',
        connectorTypes: ['Type 2'],
        amenities: ['Service Center', 'Waiting Area'],
        image: '/images/charging-stations/pune-tml-balajee.jpg',
        fallbackImage: 'https://www.bigwitenergy.com/images/ev-charging.jpg'
      },
      {
        id: 'pune-22',
        name: 'Vilux Theater - Khadki',
        type: 'AC Type-2 Charger',
        power: 22,
        pricePerKwh: 33.15,
        latitude: 18.5679,
        longitude: 73.8567,
        address: 'Vilux Theater, Khadki, Pune',
        rating: 4.0,
        hours: '24/7',
        connectorTypes: ['Type 2'],
        amenities: ['Cinema', 'Food Court'],
        image: '/images/charging-stations/pune-vilux-khadki.jpg',
        fallbackImage: 'https://www.bigwitenergy.com/images/ev-charging.jpg'
      },
      {
        id: 'pune-23',
        name: 'Tata Motors (Bafna) - Baner',
        type: 'Bharat DC001 Charger',
        power: 15,
        pricePerKwh: 67.5,
        latitude: 18.5590,
        longitude: 73.7865,
        address: 'Supreme Headquarters, Showroom No 36, Baner, Pune',
        rating: 4.3,
        hours: '24/7',
        connectorTypes: ['Bharat DC001'],
        amenities: ['Showroom', 'Customer Lounge'],
        image: '/images/charging-stations/pune-tata-baner.jpg',
        fallbackImage: 'https://www.bigwitenergy.com/images/ev-charging.jpg'
      },
      {
        id: 'pune-24',
        name: 'Tata Motors (Panchajanya) - Bhosari',
        type: 'Multi-Charger Station',
        power: 50,
        pricePerKwh: 112.5,
        latitude: 18.6186,
        longitude: 73.8478,
        address: 'Panchajanya, Bhosari, Pune',
        rating: 4.5,
        hours: '24/7',
        connectorTypes: ['CHAdeMO', 'CCS-2', 'Bharat DC001'],
        amenities: ['Service Center', 'Restrooms'],
        image: '/images/charging-stations/pune-tata-bhosari.jpg',
        fallbackImage: 'https://www.bigwitenergy.com/images/ev-charging.jpg'
      },
      {
        id: 'pune-25',
        name: 'IOCL Trishul Service Station',
        type: 'Multi-Charger Station',
        power: 50,
        pricePerKwh: 112.5,
        latitude: 18.6185,
        longitude: 73.8420,
        address: 'Trishul Service Station, Pune',
        rating: 4.4,
        hours: '24/7',
        connectorTypes: ['CHAdeMO', 'CCS-2', 'AC Type-2'],
        amenities: ['Petrol Pump', 'Convenience Store'],
        image: '/images/charging-stations/pune-iocl-trishul.jpg',
        fallbackImage: 'https://www.bigwitenergy.com/images/ev-charging.jpg'
      },
      {
        id: 'pune-26',
        name: 'Ginger Hotel - Wakad',
        type: 'Tatapower Charger',
        power: 22,
        pricePerKwh: 33.15,
        latitude: 18.5994,
        longitude: 73.7665,
        address: 'Near Indira College Rd, Kala Khadak, Wakad, Pune',
        rating: 4.1,
        hours: '24/7',
        connectorTypes: ['Type 2'],
        amenities: ['Hotel', 'Restaurant'],
        image: '/images/charging-stations/pune-ginger-wakad.jpg',
        fallbackImage: 'https://electricpe.com/images/ev-charging.jpg'
      },
      {
        id: 'pune-27',
        name: 'Lodha Belmondo - Opp MCA Stadium',
        type: 'Tatapower Private Charger',
        power: 22,
        pricePerKwh: 33.15,
        latitude: 18.6500,
        longitude: 73.7600,
        address: 'Lodha Belmondo, Mumbai - Pune Expy, Opposite MCA Stadium, Pune',
        rating: 4.0,
        hours: 'Private Access',
        connectorTypes: ['Type 2'],
        amenities: ['Residential Complex', 'Security'],
        image: '/images/charging-stations/pune-lodha-belmondo.jpg',
        fallbackImage: 'https://electricpe.com/images/ev-charging.jpg'
      },
      {
        id: 'pune-28',
        name: 'VEVC-79 - Infosys Parking, Hinjewadi Phase 2',
        type: 'Volttic Charger',
        power: 50,
        pricePerKwh: 112.5,
        latitude: 18.5916,
        longitude: 73.7389,
        address: 'Infosys Parking, MLPL Gate 5, Hinjewadi Phase 2, Pune',
        rating: 4.6,
        hours: '24/7',
        connectorTypes: ['CCS', 'CHAdeMO'],
        amenities: ['IT Park', 'Security'],
        image: '/images/charging-stations/pune-vevc-79.jpg',
        fallbackImage: 'https://electricpe.com/images/ev-charging.jpg'
      },
      {
        id: 'pune-29',
        name: 'Bhajan Singh Da Dhabha Charging Station',
        type: 'Sunfuel Charger',
        power: 22,
        pricePerKwh: 33.15,
        latitude: 18.5000,
        longitude: 73.8500,
        address: 'Bhajan Singh Da Dhabha, Pune',
        rating: 4.2,
        hours: '24/7',
        connectorTypes: ['Type 2'],
        amenities: ['Restaurant', 'Parking'],
        image: '/images/charging-stations/pune-bhajan-singh.jpg',
        fallbackImage: 'https://www.statiq.in/images/ev-charging.jpg'
      },
      {
        id: 'pune-30',
        name: 'Sunfuel - Club Mahindra Resort - Tungi',
        type: 'Sunfuel Charger',
        power: 22,
        pricePerKwh: 33.15,
        latitude: 18.6000,
        longitude: 73.7000,
        address: 'Club Mahindra Resort, Tungi, Pune',
        rating: 4.3,
        hours: '24/7',
        connectorTypes: ['Type 2'],
        amenities: ['Resort', 'Recreation'],
        image: '/images/charging-stations/pune-club-mahindra.jpg',
        fallbackImage: 'https://www.statiq.in/images/ev-charging.jpg'
      },
      {
        id: 'pune-31',
        name: 'Tata Power Charging Station - Panchjanya Motors',
        type: 'DC Fast Charger',
        power: 50,
        pricePerKwh: 18.00,
        latitude: 18.6186,
        longitude: 73.8478,
        address: 'Wakad - Bhosari BRTS Road, Century Enka Colony, Bhosari, Pimpri-Chinchwad, Maharashtra 411039',
        rating: 4.5,
        hours: '24/7',
        connectorTypes: ['CCS', 'CHAdeMO'],
        amenities: ['Service Center', 'Restrooms'],
        image: '/images/charging-stations/pune-panchjanya.jpg',
        fallbackImage: 'https://www.tatapower.com/images/ev-charging.jpg'
      },
      {
        id: 'pune-32',
        name: 'Tata Power Charging Station - Rudra Motors',
        type: 'DC Fast Charger',
        power: 50,
        pricePerKwh: 18.00,
        latitude: 18.5760,
        longitude: 73.9866,
        address: 'Gat No. 1343/A2, Near Ubale Nagar Bus Stop, Wagholi, Pune-412207',
        rating: 4.4,
        hours: '24/7',
        connectorTypes: ['CCS', 'CHAdeMO'],
        amenities: ['Showroom', 'Customer Lounge'],
        image: '/images/charging-stations/pune-rudra-motors.jpg',
        fallbackImage: 'https://www.tatapower.com/images/ev-charging.jpg'
      },
      {
        id: 'pune-33',
        name: 'Tata Power Charging Station - Concorde Tathawade',
        type: 'DC Fast Charger',
        power: 50,
        pricePerKwh: 18.00,
        latitude: 18.5921,
        longitude: 73.7550,
        address: 'Gate No. 129/2B/1, Mumbai Bangalore Express Highway, Ashok Nagar, Tathawade, Pune-411033',
        rating: 4.3,
        hours: '24/7',
        connectorTypes: ['CCS', 'CHAdeMO'],
        amenities: ['Service Center', 'Restrooms'],
        image: '/images/charging-stations/pune-concorde-tathawade.jpg',
        fallbackImage: 'https://www.tatapower.com/images/ev-charging.jpg'
      },
      {
        id: 'pune-34',
        name: 'Tata Power Charging Station - Concorde Baner',
        type: 'DC Fast Charger',
        power: 50,
        pricePerKwh: 18.00,
        latitude: 18.5590,
        longitude: 73.7865,
        address: 'Supreme Headquarters, Showroom No. 36, Mumbai-Bangalore Highway, Mohan Nagar Co-Op Society, Baner, Pune, Maharashtra 411045',
        rating: 4.2,
        hours: '24/7',
        connectorTypes: ['CCS', 'CHAdeMO'],
        amenities: ['Showroom', 'Customer Lounge'],
        image: '/images/charging-stations/pune-concorde-baner.jpg',
        fallbackImage: 'https://www.tatapower.com/images/ev-charging.jpg'
      },
      {
        id: 'pune-35',
        name: 'Tata Power Charging Station - TACO Hinjewadi Phase II',
        type: 'DC Fast Charger',
        power: 50,
        pricePerKwh: 18.00,
        latitude: 18.5916,
        longitude: 73.7389,
        address: 'SR. NO 280 & 281, Hinjawadi Phase II, Hinjewadi Rajiv Gandhi Infotech Park, Hinjawadi, Pune, Maharashtra 411057',
        rating: 4.6,
        hours: '24/7',
        connectorTypes: ['CCS', 'CHAdeMO'],
        amenities: ['IT Park', 'Security'],
        image: '/images/charging-stations/pune-taco-hinjewadi.jpg',
        fallbackImage: 'https://www.tatapower.com/images/ev-charging.jpg'
      },
      {
        id: 'pune-36',
        name: 'Tata Power Charging Station - Amanora Urban Plaza',
        type: 'AC Charger',
        power: 22,
        pricePerKwh: 16.50,
        latitude: 18.5196,
        longitude: 73.9345,
        address: '58, Amanora Park Town, Hadapsar, Pune, Maharashtra 411028',
        rating: 4.3,
        hours: '24/7',
        connectorTypes: ['Type 2'],
        amenities: ['Shopping Mall', 'Restaurants'],
        image: '/images/charging-stations/pune-amanora.jpg',
        fallbackImage: 'https://www.tatapower.com/images/ev-charging.jpg'
      },
      {
        id: 'pune-37',
        name: 'Tata Power Charging Station - Ginger Hotel Wakad',
        type: 'AC Charger',
        power: 22,
        pricePerKwh: 16.50,
        latitude: 18.5994,
        longitude: 73.7665,
        address: 'Near Indira College Rd, Kala Khadak, Wakad, Pune',
        rating: 4.1,
        hours: '24/7',
        connectorTypes: ['Type 2'],
        amenities: ['Hotel', 'Restaurant'],
        image: '/images/charging-stations/pune-ginger-wakad.jpg',
        fallbackImage: 'https://www.tatapower.com/images/ev-charging.jpg'
      },
      {
        id: 'pune-38',
        name: 'Tata Power Charging Station - Bafna Motors Erandwane',
        type: 'DC Fast Charger',
        power: 50,
        pricePerKwh: 18.00,
        latitude: 18.5090,
        longitude: 73.8291,
        address: 'Swojas Capital, Law College Rd, Shanti Sheela Society, Apex Colony, Erandwane, Pune, Maharashtra 411008',
        rating: 4.4,
        hours: '24/7',
        connectorTypes: ['CCS', 'CHAdeMO'],
        amenities: ['Showroom', 'Customer Lounge'],
        image: '/images/charging-stations/pune-bafna-erandwane.jpg',
        fallbackImage: 'https://www.tatapower.com/images/ev-charging.jpg'
      },
      {
        id: 'pune-40',
        name: 'Tata Power Charging Station - Rudra Motors Wagholi',
        type: 'DC Fast Charger',
        power: 50,
        pricePerKwh: 18.00,
        latitude: 18.5760,
        longitude: 73.9870,
        address: 'Gat No.1343/A, Near Ubale Nagar Bus Stop, Wagholi-412207',
        rating: 4.4,
        hours: '24/7',
        connectorTypes: ['CCS', 'CHAdeMO'],
        amenities: ['Showroom', 'Customer Lounge'],
        image: '/images/charging-stations/pune-rudra-wagholi.jpg',
        fallbackImage: 'https://www.tatapower.com/images/ev-charging.jpg'
      },
      // Adding from second batch (skipping duplicates)
      {
        id: 'pune-45',
        name: 'Tata Power Charging Station - TACO Hinjewadi Phase II',
        type: 'DC Fast Charger',
        power: 50,
        pricePerKwh: 18.00,
        latitude: 18.5916,
        longitude: 73.7380,
        address: 'SR. NO 280 & 281, Hinjawadi Phase II, Hinjewadi Rajiv Gandhi Infotech Park, Hinjawadi, Pune, Maharashtra 411057',
        rating: 4.3,
        hours: '24/7',
        connectorTypes: ['CCS', 'CHAdeMO'],
        amenities: ['Tech Park', 'Cafeteria'],
        image: '/images/charging-stations/pune-taco-hinjewadi.jpg',
        fallbackImage: 'https://www.tatapower.com/images/ev-charging.jpg'
      },
      {
        id: 'pune-46',
        name: 'ChargeZone - Novotel Hotel Viman Nagar',
        type: 'AC/DC Charger',
        power: 30,
        pricePerKwh: 16.50,
        latitude: 18.5679,
        longitude: 73.9143,
        address: 'Novotel Hotel, Block-D, 1F, Sakore Nagar, Viman Nagar, Pune, Maharashtra 411014',
        rating: 4.4,
        hours: '24/7',
        connectorTypes: ['CCS', 'Type 2'],
        amenities: ['Hotel', 'Restaurants'],
        image: '/images/charging-stations/pune-chargezone-novotel.jpg',
        fallbackImage: 'https://ev.chargezone.in/wp-content/uploads/2022/09/chargezone-home-img.png'
      },
      {
        id: 'pune-47',
        name: 'ChargeZone - JW Marriott Senapati Bapat Road',
        type: 'AC/DC Charger',
        power: 30,
        pricePerKwh: 16.50,
        latitude: 18.5285,
        longitude: 73.8291,
        address: 'JW Marriott Hotel, Senapati Bapat Rd, Pune, Maharashtra 411053',
        rating: 4.5,
        hours: '24/7',
        connectorTypes: ['CCS', 'Type 2'],
        amenities: ['Hotel', 'Shopping'],
        image: '/images/charging-stations/pune-chargezone-jwmarriott.jpg',
        fallbackImage: 'https://ev.chargezone.in/wp-content/uploads/2022/09/chargezone-home-img.png'
      },
      {
        id: 'pune-48',
        name: 'ChargeZone - The Ritz-Carlton Yerawada',
        type: 'AC/DC Charger',
        power: 30,
        pricePerKwh: 16.50,
        latitude: 18.5628,
        longitude: 73.8986,
        address: 'The Ritz-Carlton, Golf Course Square, Airport Rd, Yerawada, Pune, Maharashtra 411006',
        rating: 4.6,
        hours: '24/7',
        connectorTypes: ['CCS', 'Type 2'],
        amenities: ['Luxury Hotel', 'Dining'],
        image: '/images/charging-stations/pune-chargezone-ritzcarlton.jpg',
        fallbackImage: 'https://ev.chargezone.in/wp-content/uploads/2022/09/chargezone-home-img.png'
      },
      {
        id: 'pune-49',
        name: 'ChargeZone - Marriott Suites Fatima Nagar',
        type: 'AC/DC Charger',
        power: 30,
        pricePerKwh: 16.50,
        latitude: 18.5018,
        longitude: 73.9021,
        address: 'Marriott Suites Pune, 81, Mundhwa Rd, Fatima Nagar, Pune, Maharashtra 411036',
        rating: 4.4,
        hours: '24/7',
        connectorTypes: ['CCS', 'Type 2'],
        amenities: ['Hotel', 'Restaurants'],
        image: '/images/charging-stations/pune-chargezone-marriott.jpg',
        fallbackImage: 'https://ev.chargezone.in/wp-content/uploads/2022/09/chargezone-home-img.png'
      },
      {
        id: 'pune-50',
        name: 'ChargeZone - ONYX Koregaon Park',
        type: 'AC/DC Charger',
        power: 30,
        pricePerKwh: 16.50,
        latitude: 18.5362,
        longitude: 73.8938,
        address: 'ONYX, N Main Rd, Koregaon Park Annexe, Koregaon Park, Pune, Maharashtra 411001',
        rating: 4.3,
        hours: '24/7',
        connectorTypes: ['CCS', 'Type 2'],
        amenities: ['Shopping', 'Cafés'],
        image: '/images/charging-stations/pune-chargezone-onyx.jpg',
        fallbackImage: 'https://ev.chargezone.in/wp-content/uploads/2022/09/chargezone-home-img.png'
      }
    ],
    delhi: [
      // ...existing delhi stations...
    ],
    mumbai: [
      // ...existing mumbai stations...
    ],
    // ...remaining cities...
  };

  // Get currently selected city's stations
  const currentCityStations = allChargingStations[selectedCity] || [];

  // Event handlers
  const handleCityChange = (city) => {
    setSelectedCity(city);
    setUserLocation(cityLocations[city]);
    setSelectedStation(null);
    
    // Update map view for the selected city
    setViewState({
      longitude: cityLocations[city].lng,
      latitude: cityLocations[city].lat,
      zoom: 12,
      bearing: 0,
      pitch: 0,
      transitionDuration: 1000 // Smooth animation
    });
  };

  const handleImageError = (stationId) => {
    // Track fallback level: 0=primary, 1=station fallback, 2=common fallback
    const currentLevel = imageFallbackLevel[stationId] || 0;

    if (currentLevel === 0) {
      // First error - try station's fallback image
      setImageFallbackLevel(prev => ({
        ...prev,
        [stationId]: 1,
      }));
    } else if (currentLevel === 1) {
      // Second error - use common fallback image
      setImageFallbackLevel(prev => ({
        ...prev,
        [stationId]: 2
      }));
      setImagesLoaded(prev => ({
        ...prev,
        [stationId]: 'common-fallback'
      }));
    }
  };

  const handleImageLoad = (stationId) => {
    setImagesLoaded(prev => ({
      ...prev,
      [stationId]: 'loaded'
    }));
  };

  const scrollToSection = (elementRef) => {
    if (elementRef && elementRef.current) {
      window.scrollTo({
        top: elementRef.current.offsetTop - 80, // Subtract header height
        behavior: 'smooth'
      });
    }
  };

  // Enhanced button handlers to ensure all buttons work correctly

  // Join Now button in hero section
  const handleJoinNow = () => {
    navigate('/signup');
  };

  // View Stations button in hero section
  const handleViewStations = () => {
    scrollToSection(stationsRef);
  };

  // Book Now button in station cards
  const handleBookNow = (stationId) => {
    if (currentUser) {
      // If user is logged in, navigate to booking page with station ID
      navigate(`/booking?stationId=${stationId}`);
    } else {
      // If not logged in, redirect to login page with return URL
      navigate(`/login?redirect=/booking&stationId=${stationId}`);
    }
  };

  // Enhance handleLocateOnMap to also show the popup
  const handleLocateOnMap = (station) => {
    setSelectedStation(station);
    setShowPopup(true); // Show popup when station is selected
    scrollToSection(stationsRef);
    
    // Update map view to focus on the selected station with animation
    if (station && station.latitude && station.longitude) {
      setUserLocation({
        lat: station.latitude,
        lng: station.longitude
      });
      
      // Update viewState to move map to station
      setViewState({
        longitude: station.longitude,
        latitude: station.latitude,
        zoom: 15, // Zoom in closer to the station
        bearing: 0,
        pitch: 0,
        transitionDuration: 1000 // Smooth animation (1 second)
      });
      
      // Highlight the station on the map
      const element = document.getElementById(`station-${station.id}`);
      if (element) {
        element.classList.add('highlight');
        setTimeout(() => {
          element.classList.remove('highlight');
        }, 2000);
      }
    }
  };
  
  // Function to handle marker click directly
  const handleMarkerClick = (station) => {
    setSelectedStation(station);
    setShowPopup(true);
  };

  // Get Started Today button in How It Works section
  const handleGetStarted = () => {
    navigate('/signup');
  };

  // Enhanced profile navigation with user type routing
  const handleProfileNavigation = (path) => {
    // Close the profile dropdown menu
    setProfileMenuOpen(false);
    
    // Special handling for dashboard based on user type
    if (path === '/dashboard') {
      // Check if user type exists in the currentUser object
      const userType = currentUser?.userType || currentUser?.type || 
                       localStorage.getItem('userType') || 'user';
      
      // Route to specific dashboard based on user type
      switch (userType.toLowerCase()) {
        case 'driver':
          navigate('/driver-dashboard');
          break;
        case 'admin':
          navigate('/admin-dashboard');
          break;
        case 'operator':
          navigate('/operator-dashboard');
          break;
        case 'business':
          navigate('/business-dashboard');
          break;
        default:
          // Default to regular user dashboard
          navigate('/user-dashboard');
          break;
      }
    } else {
      // For non-dashboard routes, navigate normally
      navigate(path);
    }
  };

  // Enhanced logout with confirmation
  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out?')) {
      try {
        await logout();
        navigate('/');
      } catch (error) {
        console.error("Failed to log out", error);
        alert("Logout failed. Please try again.");
      }
    }
  };

  // Social media links
  const handleSocialLink = (platform) => {
    const socialUrls = {
      facebook: 'https://facebook.com/evchargingnetwork',
      twitter: 'https://twitter.com/evchargingnetwork',
      instagram: 'https://instagram.com/evchargingnetwork',
      linkedin: 'https://linkedin.com/company/evchargingnetwork'
    };
    
    if (socialUrls[platform]) {
      // Open in new tab with security best practices
      const newWindow = window.open();
      newWindow.opener = null;
      newWindow.location = socialUrls[platform];
    }
  };

  // Function to handle clicking "View Details" in the nearest station card
  const handleViewDetails = (station) => {
    handleLocateOnMap(station);
    
    // Scroll to station card after map is updated
    setTimeout(() => {
      const stationElement = document.getElementById(`station-${station.id}`);
      if (stationElement) {
        stationElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 500);
  };

  // Click outside handler for profile dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Geolocation effect
  useEffect(() => {
    // Attempt to get user's location if they allow it
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userCoords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(userCoords);
          setLocationFound(true);
          
          // Update viewState with user location
          setViewState({
            longitude: userCoords.lng,
            latitude: userCoords.lat,
            zoom: 12,
            bearing: 0,
            pitch: 0
          });
          
          // Find closest city and auto-select it
          const cities = Object.entries(cityLocations);
          let closestCity = cities[0];
          let minDistance = calculateDistance(
            userCoords.lat, userCoords.lng,
            closestCity[1].lat, closestCity[1].lng
          );
          
          cities.forEach(([cityName, coords]) => {
            const dist = calculateDistance(
              userCoords.lat, userCoords.lng,
              coords.lat, coords.lng
            );
            if (dist < minDistance) {
              minDistance = dist;
              closestCity = [cityName, coords];
            }
          });
          
          // Update selected city based on user location
          setSelectedCity(closestCity[0]);
        },
        (error) => {
          console.error('Error getting location:', error);
          // Keep default Pune location
          setLocationFound(false);
        }
      );
    }
    setLoading(false);
  }, []);
  
  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance;
  };

  // Find nearest charging stations to user
  const getNearestStations = () => {
    if (!locationFound) return [];
    
    // Get all stations from all cities
    const allStations = Object.values(allChargingStations).flat();
    
    // Calculate distance for each station
    const stationsWithDistance = allStations.map(station => ({
      ...station,
      distance: calculateDistance(
        userLocation.lat, userLocation.lng,
        station.latitude, station.longitude
      )
    }));
    
    // Sort by distance and return top 3
    return stationsWithDistance
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3);
  };

  return (
    <div className="home-page">
      <header className="home-header">
        <div className="container header-container">
          <div 
            className="logo" 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            style={{ cursor: 'pointer' }}
          >
            <span className="logo-text">EV Charging Network</span>
          </div>
          <div className="nav-links">
            <a 
              href="#about" 
              className="nav-item"
              onClick={(e) => { 
                e.preventDefault(); 
                scrollToSection(aboutRef); 
              }}
            >
              About
            </a>
            <a 
              href="#stations" 
              className="nav-item"
              onClick={(e) => { 
                e.preventDefault(); 
                scrollToSection(stationsRef); 
              }}
            >
              Stations
            </a>
            <a 
              href="#how-it-works" 
              className="nav-item"
              onClick={(e) => { 
                e.preventDefault(); 
                scrollToSection(howItWorksRef); 
              }}
            >
              How it Works
            </a>
            
            {/* Conditional rendering based on authentication status */}
            {currentUser ? (
              <div className="profile-menu-container" ref={profileRef}>
                <div 
                  className="profile-button"
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                >
                  <div className="profile-avatar">
                    {currentUser.photoURL ? (
                      <img 
                        src={currentUser.photoURL} 
                        alt={currentUser.displayName || "User"} 
                      />
                    ) : (
                      <div className="avatar-initials">
                        {currentUser.displayName ? currentUser.displayName[0] : "U"}
                      </div>
                    )}
                  </div>
                  <span className="profile-name">
                    {currentUser.displayName || currentUser.email || "User"}
                  </span>
                </div>
                
                {profileMenuOpen && (
                  <div className="profile-dropdown">
                    <div className="profile-dropdown-header">
                      <strong>
                        {currentUser.displayName || currentUser.email || "User"}
                      </strong>
                      <span className="profile-email">{currentUser.email}</span>
                    </div>
                    <div className="profile-dropdown-items">
                      <button onClick={() => handleProfileNavigation('/profile')}>
                        My Profile
                      </button>
                      <button onClick={() => handleProfileNavigation('/bookings')}>
                        My Bookings
                      </button>
                      <button onClick={() => handleProfileNavigation('/dashboard')}>
                        Dashboard
                      </button>
                      <button onClick={handleLogout} className="logout-button">
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="btn-login">Login</Link>
                <Link to="/signup" className="btn-signup">Sign Up</Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-banner">
        <div className="container">
          <div className="hero-content">
            <h1>Find EV Charging Stations Near You</h1>
            <p>Discover convenient and reliable charging stations for your electric vehicle across Pune and beyond.</p>
            <div className="hero-cta">
              <button 
                onClick={handleJoinNow} 
                className="btn-primary"
              >
                Join Now
              </button>
              <button 
                onClick={handleViewStations}
                className="btn-secondary"
              >
                View Stations
              </button>
            </div>
            
            {/* Show nearest stations if user's location found */}
            {locationFound && (
              <div className="nearest-stations">
                <h3>Nearest Charging Stations to You</h3>
                <div className="nearest-stations-cards">
                  {getNearestStations().map(station => (
                    <div 
                      key={station.id} 
                      className="nearest-station-card"
                      onClick={() => handleLocateOnMap(station)}
                    >
                      <h4>{station.name}</h4>
                      <p>{station.distance.toFixed(1)} km away</p>
                      <button 
                        className="btn-view" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(station);
                        }}
                      >
                        View Details
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" ref={aboutRef} className="about-section">
        <div className="container">
          <h2>India's Leading EV Charging Network</h2>
          <div className="features-grid">
            <div className="feature">
              <div className="feature-icon">🔌</div>
              <h3>Widespread Coverage</h3>
              <p>Access to thousands of charging points across major Indian cities.</p>
            </div>
            <div className="feature">
              <div className="feature-icon">⚡</div>
              <h3>Fast Charging</h3>
              <p>DC fast charging options to get you back on the road quickly.</p>
            </div>
            <div className="feature">
              <div className="feature-icon">📱</div>
              <h3>Easy Booking</h3>
              <p>Book and pay for charging sessions directly from your phone.</p>
            </div>
          </div>
        </div>
      </section>

      <div className="container main-content">
        {/* City Selector Section */}
        <div className="city-selector">
          <h3>Select a City</h3>
          <div className="cities-grid">
            {Object.entries(cityLocations).map(([city, coords]) => (
              <div 
                key={city}
                className={`city-option ${selectedCity === city ? 'active' : ''}`}
                onClick={() => handleCityChange(city)}
              >
                <div className="city-icon">
                  {city === 'pune' && '🏙️'}
                  {city === 'delhi' && '🏛️'}
                  {city === 'mumbai' && '🌊'}
                  {city === 'bangalore' && '💻'}
                  {city === 'chennai' && '🌴'}
                  {city === 'hyderabad' && '🏯'}
                </div>
                <div className="city-name">
                  {city.charAt(0).toUpperCase() + city.slice(1)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Map Section */}
        <section id="stations" ref={stationsRef} className="map-section">
          <div className="container">
            <h2>EV Charging Stations in {selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1)}</h2>
            <p className="section-intro">Below is a map of available charging stations. Click on any marker to see details.</p>
            
            {/* Map container with explicit styling */}
            <div 
              className="map-container" 
              id="map-container"
              style={{
                height: '500px',
                width: '100%',
                position: 'relative',
                border: '1px solid #ddd'
              }}
            >
              {!loading && (
                <>
                  {!MAPBOX_TOKEN && (
                    <h3 style={{textAlign: 'center', marginTop: '20px'}}>
                      Mapbox token not found. Please add your token to the .env file.
                    </h3>
                  )}
                  {MAPBOX_TOKEN && (
                    <Map
                      mapboxAccessToken={MAPBOX_TOKEN}
                      {...viewState}
                      onMove={evt => setViewState(evt.viewState)}
                      style={{ width: '100%', height: '100%' }}
                      mapStyle="mapbox://styles/mapbox/streets-v11"
                    >
                      <NavigationControl position="top-right" />
                      
                      {/* Add markers for charging stations */}
                      {currentCityStations.map(station => (
                        <Marker 
                          key={station.id}
                          longitude={station.longitude}
                          latitude={station.latitude}
                          anchor="bottom"
                          onClick={(e) => {
                            e.originalEvent.stopPropagation();
                            handleMarkerClick(station);
                          }}
                        >
                          <div className="map-marker" style={{ 
                            cursor: 'pointer',
                            color: selectedStation && selectedStation.id === station.id ? '#ff6b6b' : '#4a90e2'
                          }}>
                            <div style={{ 
                              fontSize: '24px', 
                              filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.5))' 
                            }}>
                              📍
                            </div>
                          </div>
                        </Marker>
                      ))}
                      
                      {/* Add popup for selected station */}
                      {selectedStation && showPopup && (
                        <Popup
                          longitude={selectedStation.longitude}
                          latitude={selectedStation.latitude}
                          anchor="bottom"
                          onClose={() => setShowPopup(false)}
                          closeOnClick={false}
                          className="station-popup"
                          style={{ maxWidth: '300px' }}
                        >
                          <div className="popup-content">
                            <h3>{selectedStation.name}</h3>
                            <div className="popup-rating">
                              <span>★</span> {selectedStation.rating}
                            </div>
                            <p className="popup-address">{selectedStation.address}</p>
                            <div className="popup-details">
                              <p><strong>Type:</strong> {selectedStation.type}</p>
                              <p><strong>Power:</strong> {selectedStation.power} kW</p>
                              <p><strong>Price:</strong> ₹{selectedStation.pricePerKwh}/kWh</p>
                              <p><strong>Hours:</strong> {selectedStation.hours}</p>
                            </div>
                            <div className="popup-actions">
                              <button 
                                onClick={() => handleBookNow(selectedStation.id)} 
                                className="popup-btn-book"
                              >
                                Book Now
                              </button>
                              <button 
                                onClick={() => {
                                  setShowPopup(false);
                                  const element = document.getElementById(`station-${selectedStation.id}`);
                                  if (element) element.scrollIntoView({ behavior: 'smooth' });
                                }} 
                                className="popup-btn-details"
                              >
                                More Details
                              </button>
                            </div>
                          </div>
                        </Popup>
                      )}
                    </Map>
                  )}
                </>
              )}
            </div>
          </div>
        </section>

        {/* Stations List Section */}
        <section className="stations-list-section">
          <div className="container">
            <h2>Charging Stations in {selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1)}</h2>
            <div className="stations-grid">
              {currentCityStations.map(station => (
                <div key={station.id} id={`station-${station.id}`} className="station-card">
                  <div className="station-image">
                    {/* Image with enhanced fallback strategy */}
                    <img 
                      src={
                        imageFallbackLevel[station.id] === 0 ? station.image : 
                        imageFallbackLevel[station.id] === 1 ? station.fallbackImage : 
                        commonFallbackImage
                      }
                      alt={station.name}
                      onError={() => handleImageError(station.id)}
                      onLoad={() => handleImageLoad(station.id)}
                      loading="lazy"
                    />
                    {!imagesLoaded[station.id] && (
                      <div className="image-loader">
                        <div className="spinner"></div>
                      </div>
                    )}
                    <div className="station-rating">
                      <span className="star-icon">★</span>
                      <span>{station.rating}</span>
                    </div>
                  </div>
                  <div className="station-content">
                    <h3>{station.name}</h3>
                    <p className="address">{station.address}</p>
                    <div className="station-details">
                      <div className="detail">
                        <span className="detail-label">Charger Type:</span>
                        <span className="detail-value">{station.type}</span>
                      </div>
                      <div className="detail">
                        <span className="detail-label">Power Output:</span>
                        <span className="detail-value">{station.power} kW</span>
                      </div>
                      <div className="detail">
                        <span className="detail-label">Price:</span>
                        <span className="detail-value">₹{station.pricePerKwh}/kWh</span>
                      </div>
                      <div className="detail">
                        <span className="detail-label">Hours:</span>
                        <span className="detail-value">{station.hours}</span>
                      </div>
                    </div>
                    <div className="connectors">
                      <span className="detail-label">Connectors:</span>
                      <div className="connector-tags">
                        {station.connectorTypes.map((connector, idx) => (
                          <span key={idx} className="connector-tag">{connector}</span>
                        ))}
                      </div>
                    </div>
                    <div className="station-amenities">
                      <span className="detail-label">Amenities:</span>
                      <div className="amenity-tags">
                        {station.amenities.map((amenity, idx) => (
                          <span key={idx} className="amenity-tag">{amenity}</span>
                        ))}
                      </div>
                    </div>
                    <div className="station-cta">
                      <button 
                        onClick={() => handleBookNow(station.id)} 
                        className="btn-book"
                      >
                        Book Now
                      </button>
                      <button 
                        onClick={() => handleLocateOnMap(station)} 
                        className="btn-locate"
                      >
                        Locate on Map
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" ref={howItWorksRef} className="how-it-works">
          <div className="container">
            <h2>How It Works</h2>
            <div className="steps">
              <div className="step">
                <div className="step-number">1</div>
                <h3>Sign Up</h3>
                <p>Create a free account in seconds and set up your EV vehicle details.</p>
              </div>
              <div className="step">
                <div className="step-number">2</div>
                <h3>Find Stations</h3>
                <p>Discover charging stations near you with real-time availability.</p>
              </div>
              <div className="step">
                <div className="step-number">3</div>
                <h3>Book & Charge</h3>
                <p>Reserve your slot and charge your vehicle hassle-free.</p>
              </div>
              <div className="step">
                <div className="step-number">4</div>
                <h3>Pay Seamlessly</h3>
                <p>Pay securely through the app using multiple payment options.</p>
              </div>
            </div>
            <div className="cta-container">
              <button 
                onClick={handleGetStarted} 
                className="btn-large"
              >
                Get Started Today
              </button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="footer">
          <div className="container">
            <div className="footer-columns">
              <div className="footer-column">
                <h3>EV Charging Network</h3>
                <p>India's premier EV charging network empowering electric mobility across the country.</p>
              </div>
              <div className="footer-column">
                <h4>Quick Links</h4>
                <ul>
                  <li><a href="#about">About</a></li>
                  <li><a href="#stations">Charging Stations</a></li>
                  <li><a href="#how-it-works">How It Works</a></li>
                  <li><Link to="/login">Login</Link></li>
                  <li><Link to="/signup">Sign Up</Link></li>
                </ul>
              </div>
              <div className="footer-column">
                <h4>Contact</h4>
                <ul className="contact-info">
                  <li>Email: info@evchargingnetwork.in</li>
                  <li>Phone: +91 1234567890</li>
                  <li>Address: Pune, Maharashtra, India</li>
                </ul>
              </div>
              <div className="footer-column">
                <h4>Connect with Us</h4>
                <div className="social-links">
                  <button 
                    onClick={() => handleSocialLink('facebook')}
                    className="social-link"
                  >
                    Facebook
                  </button>
                  <button 
                    onClick={() => handleSocialLink('twitter')}
                    className="social-link"
                  >
                    Twitter
                  </button>
                  <button 
                    onClick={() => handleSocialLink('instagram')}
                    className="social-link"
                  >
                    Instagram
                  </button>
                  <button 
                    onClick={() => handleSocialLink('linkedin')}
                    className="social-link"
                  >
                    LinkedIn
                  </button>
                </div>
              </div>
            </div>
            <div className="copyright">
              <p>© 2023 EV Charging Network. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default HomePage;
