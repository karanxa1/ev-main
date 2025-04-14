import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LoadScript, GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { indianCities, formatCurrency } from '../../utils/formatters';
import './HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState(indianCities.pune);
  const [selectedStation, setSelectedStation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imagesLoaded, setImagesLoaded] = useState({});
  const [imageFallbackLevel, setImageFallbackLevel] = useState({}); // Track fallback level
  const [selectedCity, setSelectedCity] = useState('pune');

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
      {
        id: '1',
        name: 'Tata Power Charging Station - Phoenix Mall',
        type: 'DC Fast Charger',
        power: 50,
        pricePerKwh: 18.50,
        latitude: 18.5619,
        longitude: 73.9180,
        address: 'Phoenix Marketcity, Viman Nagar, Pune, Maharashtra 411014',
        rating: 4.6,
        hours: '24/7',
        connectorTypes: ['CCS', 'CHAdeMO'],
        amenities: ['Parking', 'Shopping Mall', 'Food Court'],
        image: '/images/charging-stations/tata-power.jpg',
        // Backup external URL as fallback
        fallbackImage: 'https://images.livemint.com/img/2021/07/03/1600x900/EV_charging_1625297278612_1625297287152.PNG'
      },
      {
        id: '2',
        name: 'HPCL EV Charging Station',
        type: 'AC Charger',
        power: 22,
        pricePerKwh: 15.00,
        latitude: 18.5074,
        longitude: 73.8077,
        address: 'HPCL Petrol Pump, Deccan Gymkhana, Pune, Maharashtra 411004',
        rating: 4.1,
        hours: '7 AM - 10 PM',
        connectorTypes: ['Type 2', 'Bharat AC-001'],
        amenities: ['Convenience Store', 'Restrooms'],
        image: '/images/charging-stations/hpcl.jpg',
        fallbackImage: 'https://www.hindustanpetroleum.com/documents/2475722/0/NAVI+MUMBAI+POKHRAN+ROAD.jpg/618c5aea-757a-535c-919a-1202ee645bcc?t=1631096435916'
      },
      {
        id: '3',
        name: 'Magenta ChargeGrid - Amanora Mall',
        type: 'DC Fast Charger',
        power: 60,
        pricePerKwh: 19.50,
        latitude: 18.5180,
        longitude: 73.9430,
        address: 'Amanora Town Centre, Hadapsar, Pune, Maharashtra 411028',
        rating: 4.8,
        hours: 'Mall Hours',
        connectorTypes: ['CCS', 'Type 2'],
        amenities: ['Parking', 'Shopping Mall', 'Food Court', 'Restrooms'],
        image: '/images/charging-stations/magenta-chargegrid.jpg',
      },
      {
        id: '4',
        name: 'Ather Charging Station - Koregaon Park',
        type: 'AC Charger',
        power: 3.3,
        pricePerKwh: 12.00,
        latitude: 18.5362,
        longitude: 73.8914,
        address: 'North Main Road, Koregaon Park, Pune, Maharashtra 411001',
        rating: 4.4,
        hours: '9 AM - 8 PM',
        connectorTypes: ['Ather Connector'],
        amenities: ['Café Nearby', 'Shopping Area'],
        image: 'https://cdn.eetgroup.com/img/live/news/pulse/2021/10/cwksae-ather-energy-opens-its-first-experience-center-in-koregaon-park-pune.jpg'
      },
      {
        id: '5',
        name: 'IOCL Fast EV Charging Point',
        type: 'DC Fast Charger',
        power: 50,
        pricePerKwh: 17.50,
        latitude: 18.4529,
        longitude: 73.8652,
        address: 'IOCL Petrol Pump, Sinhagad Road, Pune, Maharashtra 411041',
        rating: 4.2,
        hours: '24/7',
        connectorTypes: ['CCS', 'CHAdeMO', 'Type 2'],
        amenities: ['Convenience Store', 'Restrooms', '24/7 Service'],
        image: 'https://theevreporter.com/wp-content/uploads/2021/09/IndianOil-Charging-Station-Bangalore.jpeg'
      },
      // Additional Pune charging stations (15 more)
      {
        id: 'pune6',
        name: 'Jio-bp Pulse - Baner Road',
        type: 'DC Fast Charger',
        power: 60,
        pricePerKwh: 20.50,
        latitude: 18.5598,
        longitude: 73.7882,
        address: 'Baner Road, Baner, Pune, Maharashtra 411045',
        rating: 4.7,
        hours: '24/7',
        connectorTypes: ['CCS', 'CHAdeMO', 'Type 2'],
        amenities: ['Café', 'Convenience Store', '24/7 Service', 'Wifi'],
        image: '/images/charging-stations/pune-jio-bp.jpg',
        fallbackImage: 'https://evreporter.com/wp-content/uploads/2023/01/Jio-bp-pulse.png'
      },
      {
        id: 'pune7',
        name: 'BPCL EV Charging - FC Road',
        type: 'AC/DC Charger',
        power: 30,
        pricePerKwh: 16.00,
        latitude: 18.5234,
        longitude: 73.8406,
        address: 'BPCL, FC Road, Shivajinagar, Pune, Maharashtra 411005',
        rating: 4.0,
        hours: '6 AM - 11 PM',
        connectorTypes: ['CCS', 'Type 2', 'Bharat AC-001'],
        amenities: ['Convenience Store', 'Restrooms'],
        image: '/images/charging-stations/pune-bpcl-fc.jpg',
        fallbackImage: 'https://www.bharatpetroleum.in/images/EV-charging-station1-10-Dec-2020.jpg'
      },
      {
        id: 'pune8',
        name: 'Exicom Charging - Kharadi',
        type: 'DC Fast Charger',
        power: 50,
        pricePerKwh: 18.00,
        latitude: 18.5504,
        longitude: 73.9584,
        address: 'EON IT Park, Kharadi, Pune, Maharashtra 411014',
        rating: 4.5,
        hours: 'Office Hours',
        connectorTypes: ['CCS', 'CHAdeMO'],
        amenities: ['IT Park', 'Food Court', 'Parking'],
        image: '/images/charging-stations/pune-exicom-kharadi.jpg',
        fallbackImage: 'https://www.exicom.in/images/Exicom-EV-chargers.jpg'
      },
      {
        id: 'pune9',
        name: 'Okaya Power - Hinjewadi',
        type: 'DC Fast Charger',
        power: 60,
        pricePerKwh: 19.00,
        latitude: 18.5793,
        longitude: 73.7398,
        address: 'Rajiv Gandhi Infotech Park, Hinjewadi Phase 1, Pune, Maharashtra 411057',
        rating: 4.3,
        hours: '24/7',
        connectorTypes: ['CCS', 'CHAdeMO', 'Type 2'],
        amenities: ['IT Park', 'Parking', '24/7 Support', 'Cafeteria'],
        image: '/images/charging-stations/pune-okaya-hinjewadi.jpg',
        fallbackImage: 'https://auto.hindustantimes.com/auto/news/okaya-ev-installs-over-500-charging-stations-across-india-aims-to-add-500-more-41661507042488.html'
      },
      {
        id: 'pune10',
        name: 'Ather Grid - Kalyani Nagar',
        type: 'AC Charger',
        power: 3.3,
        pricePerKwh: 12.00,
        latitude: 18.5470,
        longitude: 73.9000,
        address: 'Kalyani Nagar, Pune, Maharashtra 411006',
        rating: 4.6,
        hours: '9 AM - 9 PM',
        connectorTypes: ['Ather Connector'],
        amenities: ['Shopping Area', 'Cafés'],
        image: '/images/charging-stations/pune-ather-kalyani.jpg',
        fallbackImage: 'https://www.91wheels.com/assets/ather-genericpages/img/grid.jpg'
      },
      {
        id: 'pune11',
        name: 'Statiq Charging - Wakad',
        type: 'AC/DC Charger',
        power: 25,
        pricePerKwh: 15.50,
        latitude: 18.5968,
        longitude: 73.7614,
        address: 'Wakad, Pune, Maharashtra 411057',
        rating: 4.2,
        hours: '24/7',
        connectorTypes: ['CCS', 'Type 2'],
        amenities: ['Parking', 'Security'],
        image: '/images/charging-stations/pune-statiq-wakad.jpg',
        fallbackImage: 'https://www.statiq.in/assets/news/press-releases/statiq-installs-evzon.jpg'
      },
      {
        id: 'pune12',
        name: 'Delta EV Charging - Chinchwad',
        type: 'DC Fast Charger',
        power: 60,
        pricePerKwh: 18.50,
        latitude: 18.6298,
        longitude: 73.7997,
        address: 'Chinchwad, Pune, Maharashtra 411033',
        rating: 4.1,
        hours: '24/7',
        connectorTypes: ['CCS', 'CHAdeMO'],
        amenities: ['Industrial Area', 'Parking'],
        image: '/images/charging-stations/pune-delta-chinchwad.jpg',
        fallbackImage: 'https://www.deltaelectronicsindia.com/wp-content/uploads/2020/08/Delta-EV-Chargers.png'
      },
      {
        id: 'pune13',
        name: 'ReVolt EV Station - Wagholi',
        type: 'AC Charger',
        power: 22,
        pricePerKwh: 15.00,
        latitude: 18.5725,
        longitude: 73.9881,
        address: 'Wagholi, Pune, Maharashtra 412207',
        rating: 3.9,
        hours: '8 AM - 10 PM',
        connectorTypes: ['Type 2', 'Bharat AC-001'],
        amenities: ['Parking', 'Residential Area'],
        image: '/images/charging-stations/pune-revolt-wagholi.jpg',
        fallbackImage: 'https://auto.economictimes.indiatimes.com/news/oil-and-lubes/ev-charging-station-at-retail-outlets-to-accelerate/75446762'
      },
      {
        id: 'pune14',
        name: 'Tata Power EZ Charge - Magarpatta City',
        type: 'DC Fast Charger',
        power: 50,
        pricePerKwh: 18.00,
        latitude: 18.5156,
        longitude: 73.9261,
        address: 'Magarpatta City, Hadapsar, Pune, Maharashtra 411028',
        rating: 4.5,
        hours: '24/7',
        connectorTypes: ['CCS', 'CHAdeMO'],
        amenities: ['Township', 'Shopping', 'Restaurants'],
        image: '/images/charging-stations/pune-tata-magarpatta.jpg',
        fallbackImage: 'https://tatapower.com/images/all-india-ev-charging.jpg'
      },
      {
        id: 'pune15',
        name: 'ChargeZone - NIBM Road',
        type: 'AC/DC Charger',
        power: 30,
        pricePerKwh: 16.50,
        latitude: 18.4820,
        longitude: 73.9031,
        address: 'NIBM Road, Pune, Maharashtra 411048',
        rating: 4.3,
        hours: '24/7',
        connectorTypes: ['CCS', 'Type 2'],
        amenities: ['Residential Area', 'Cafés', 'Parking'],
        image: '/images/charging-stations/pune-chargezone-nibm.jpg',
        fallbackImage: 'https://ev.chargezone.in/wp-content/uploads/2022/09/chargezone-home-img.png'
      },
      {
        id: 'pune16',
        name: 'Volttic Charging - Viman Nagar',
        type: 'DC Fast Charger',
        power: 60,
        pricePerKwh: 19.00,
        latitude: 18.5746,
        longitude: 73.9184,
        address: 'Viman Nagar, Pune, Maharashtra 411014',
        rating: 4.4,
        hours: '24/7',
        connectorTypes: ['CCS', 'CHAdeMO', 'Type 2'],
        amenities: ['24/7 Service', 'Security', 'Residential Area'],
        image: '/images/charging-stations/pune-volttic-viman.jpg',
        fallbackImage: 'https://volttic.com/wp-content/themes/volttic/assets/images/volttic-charging-unity.jpg'
      },
      {
        id: 'pune17',
        name: 'Kazam EV - Kothrud',
        type: 'AC Charger',
        power: 7.4,
        pricePerKwh: 14.00,
        latitude: 18.5036,
        longitude: 73.8151,
        address: 'Kothrud, Pune, Maharashtra 411038',
        rating: 4.0,
        hours: '7 AM - 11 PM',
        connectorTypes: ['Type 2', 'Bharat AC-001'],
        amenities: ['Residential Area', 'Parking'],
        image: '/images/charging-stations/pune-kazam-kothrud.jpg',
        fallbackImage: 'https://kazam.in/blogs/wp-content/uploads/2022/02/Best-Electric-Vehicle-EV-Charging-Network-App-in-India-Kazam-1.jpg'
      },
      {
        id: 'pune18',
        name: 'Power Grid - Pimpri',
        type: 'DC Fast Charger',
        power: 50,
        pricePerKwh: 17.50,
        latitude: 18.6210,
        longitude: 73.8083,
        address: 'Pimpri, Pune, Maharashtra 411018',
        rating: 4.1,
        hours: '24/7',
        connectorTypes: ['CCS', 'CHAdeMO'],
        amenities: ['Industrial Area', 'Parking'],
        image: '/images/charging-stations/pune-powergrid-pimpri.jpg',
        fallbackImage: 'https://www.thehindubusinessline.com/companies/others/article28227870.ece/alternates/LANDSCAPE_1200/bl10PGCILIMAGE'
      },
      {
        id: 'pune19',
        name: 'ElectriVa - Wanowrie',
        type: 'AC/DC Charger',
        power: 40,
        pricePerKwh: 16.00,
        latitude: 18.4841,
        longitude: 73.9012,
        address: 'Wanowrie, Pune, Maharashtra 411040',
        rating: 4.2,
        hours: '24/7',
        connectorTypes: ['CCS', 'Type 2', 'Bharat AC-001'],
        amenities: ['Residential Area', 'Shopping', 'Cafés'],
        image: '/images/charging-stations/pune-electriva-wanowrie.jpg',
        fallbackImage: 'https://electriva.in/Files/Articles/Smart_Mobility/EV_charging_station.jpg'
      },
      {
        id: 'pune20',
        name: 'Ola Hypercharger - Shivaji Nagar',
        type: 'DC Fast Charger',
        power: 50,
        pricePerKwh: 18.00,
        latitude: 18.5245,
        longitude: 73.8478,
        address: 'Shivaji Nagar, Pune, Maharashtra 411005',
        rating: 4.4,
        hours: '24/7',
        connectorTypes: ['CCS', 'Type 2'],
        amenities: ['Central Location', 'Shopping', 'Restaurants'],
        image: '/images/charging-stations/pune-ola-shivajinagar.jpg',
        fallbackImage: 'https://www.91wheels.com/assets/images/images/olanewsimages/Ola%20hypercharger.jpg'
      },
    ],
    delhi: [
      {
        id: 'delhi1',
        name: 'EESL Charging Station - Connaught Place',
        type: 'DC Fast Charger',
        power: 50,
        pricePerKwh: 18.00,
        latitude: 28.6304,
        longitude: 77.2177,
        address: 'Connaught Place, New Delhi, Delhi 110001',
        rating: 4.5,
        hours: '24/7',
        connectorTypes: ['CCS', 'CHAdeMO', 'Type 2'],
        amenities: ['Shopping Area', 'Restaurants', 'Metro Access'],
        fallbackImage: 'https://i.ytimg.com/vi/xH1vgFtckA8/maxresdefault.jpg'
      },
      {
        id: 'delhi2',
        name: 'BSES EV Charging Hub',
        type: 'AC Charger',
        power: 22,
        pricePerKwh: 15.00,
        latitude: 28.5921,
        longitude: 77.2290,
        address: 'Nehru Place, New Delhi, Delhi 110019',
        rating: 4.2,
        hours: '6 AM - 10 PM',
        connectorTypes: ['Type 2', 'Bharat AC'],
        amenities: ['Parking', 'Market Nearby'],
        fallbackImage: 'https://static.toiimg.com/thumb/msid-86431060,width-1280,height-720,resizemode-4/.jpg'
      },
      {
        id: 'delhi3',
        name: 'Fortum Charge & Drive - Select Citywalk',
        type: 'DC Fast Charger',
        power: 60,
        pricePerKwh: 19.00,
        latitude: 28.5285,
        longitude: 77.2187,
        address: 'Select Citywalk Mall, Saket, New Delhi, Delhi 110017',
        rating: 4.7,
        hours: 'Mall Hours',
        connectorTypes: ['CCS', 'CHAdeMO'],
        amenities: ['Mall', 'Food Court', 'Cinema'],
        fallbackImage: 'https://akm-img-a-in.tosshub.com/businesstoday/images/story/202306/1687518850-charging-sixteen_nine.jpg'
      },
      // Additional Delhi charging stations (17 more)
      {
        id: 'delhi4',
        name: 'Tata Power - Delhi Airport T3',
        type: 'DC Fast Charger',
        power: 60,
        pricePerKwh: 21.00,
        latitude: 28.5562,
        longitude: 77.0999,
        address: 'Indira Gandhi International Airport, Terminal 3, New Delhi, 110037',
        rating: 4.6,
        hours: '24/7',
        connectorTypes: ['CCS', 'CHAdeMO', 'Type 2'],
        amenities: ['Airport', '24/7 Service', 'Parking', 'Cafés'],
        image: '/images/charging-stations/delhi-tata-airport.jpg',
        fallbackImage: 'https://www.businesstoday.in/quicktakes/story/indigo-will-provide-25-free-electric-vehicle-charging-stations-at-delhi-airport-by-2025-359256-2023-01-12'
      },
      {
        id: 'delhi5',
        name: 'NDMC EV Charging Point - India Gate',
        type: 'AC Charger',
        power: 22,
        pricePerKwh: 16.00,
        latitude: 28.6129,
        longitude: 77.2295,
        address: 'India Gate, New Delhi, 110001',
        rating: 4.3,
        hours: '6 AM - 11 PM',
        connectorTypes: ['Type 2', 'Bharat AC-001'],
        amenities: ['Tourist Spot', 'Parking'],
        image: '/images/charging-stations/delhi-ndmc-indiagate.jpg',
        fallbackImage: 'https://images.hindustantimes.com/auto/img/2021/10/13/600x338/ndmc_ev_charging_1634102095133_1634102101167.jpg'
      },
      {
        id: 'delhi6',
        name: 'Jio-bp Pulse - Dwarka',
        type: 'DC Fast Charger',
        power: 60,
        pricePerKwh: 19.50,
        latitude: 28.5923,
        longitude: 77.0288,
        address: 'Sector 12, Dwarka, New Delhi, 110075',
        rating: 4.4,
        hours: '24/7',
        connectorTypes: ['CCS', 'CHAdeMO'],
        amenities: ['Residential Area', 'Convenience Store', '24/7 Support'],
        image: '/images/charging-stations/delhi-jio-dwarka.jpg',
        fallbackImage: 'https://www.financialexpress.com/wp-content/uploads/2021/10/jio-BP.jpg'
      },
      {
        id: 'delhi7',
        name: 'IOCL Electric Vehicle Station - Hauz Khas',
        type: 'AC/DC Charger',
        power: 50,
        pricePerKwh: 18.00,
        latitude: 28.5494,
        longitude: 77.2001,
        address: 'Hauz Khas, New Delhi, 110016',
        rating: 4.1,
        hours: '24/7',
        connectorTypes: ['CCS', 'Type 2'],
        amenities: ['Convenience Store', 'Restrooms', 'Café'],
        image: '/images/charging-stations/delhi-iocl-hauzkhas.jpg',
        fallbackImage: 'https://static.toiimg.com/thumb/resizemode-4,width-1200,height-900,msid-87785344/87785344.jpg'
      },
      {
        id: 'delhi8',
        name: 'Ather Space - Green Park',
        type: 'AC Charger',
        power: 3.3,
        pricePerKwh: 12.00,
        latitude: 28.5581,
        longitude: 77.2012,
        address: 'Green Park, New Delhi, 110016',
        rating: 4.5,
        hours: '9 AM - 9 PM',
        connectorTypes: ['Ather Connector'],
        amenities: ['Service Center', 'Café', 'Parking'],
        image: '/images/charging-stations/delhi-ather-greenpark.jpg',
        fallbackImage: 'https://cdn.atherenergy.com/prod/connection-main-banner/connection/1587712830010-ather-grid-main-banner.jpg'
      },
      {
        id: 'delhi9',
        name: 'ChargeZone - Mayur Vihar',
        type: 'DC Fast Charger',
        power: 30,
        pricePerKwh: 17.00,
        latitude: 28.6014,
        longitude: 77.2972,
        address: 'Mayur Vihar Phase 1, New Delhi, 110091',
        rating: 4.0,
        hours: '24/7',
        connectorTypes: ['CCS', 'Type 2'],
        amenities: ['Residential Area', 'Parking'],
        image: '/images/charging-stations/delhi-chargezone-mayurvihar.jpg',
        fallbackImage: 'https://www.financialexpress.com/wp-content/uploads/2022/06/chargezone.jpg'
      },
      {
        id: 'delhi10',
        name: 'ElectriVa - Lajpat Nagar',
        type: 'AC/DC Charger',
        power: 25,
        pricePerKwh: 16.50,
        latitude: 28.5700,
        longitude: 77.2410,
        address: 'Lajpat Nagar, New Delhi, 110024',
        rating: 4.2,
        hours: '8 AM - 10 PM',
        connectorTypes: ['CCS', 'Type 2', 'Bharat AC-001'],
        amenities: ['Shopping Area', 'Restaurants'],
        image: '/images/charging-stations/delhi-electriva-lajpat.jpg',
        fallbackImage: 'https://www.autocarpro.in/Utils/ImageResizer.ashx?n=http://img.autopro.in/News/ElectriVa-to-electrify-Delhi-with-more-than-10000-EV-charging-stations-by-2025-3.jpg&w=735'
      },
      {
        id: 'delhi11',
        name: 'BluSmart Hub - Gurugram Border',
        type: 'DC Fast Charger',
        power: 60,
        pricePerKwh: 20.00,
        latitude: 28.5021,
        longitude: 77.0836,
        address: 'Delhi-Gurugram Border, Delhi NCR, 122002',
        rating: 4.7,
        hours: '24/7',
        connectorTypes: ['CCS', 'CHAdeMO'],
        amenities: ['EV Taxi Hub', 'Lounge', 'Cafeteria', '24/7 Service'],
        image: '/images/charging-stations/delhi-blusmart-gurugram.jpg',
        fallbackImage: 'https://blusmart.com/assets/uploads/ev-hub-page-demo.png'
      },
      {
        id: 'delhi12',
        name: 'Okaya Power - Janakpuri',
        type: 'AC/DC Charger',
        power: 30,
        pricePerKwh: 16.00,
        latitude: 28.6292,
        longitude: 77.0926,
        address: 'Janakpuri, New Delhi, 110058',
        rating: 4.1,
        hours: '7 AM - 11 PM',
        connectorTypes: ['CCS', 'Type 2'],
        amenities: ['Residential Area', 'Market Nearby'],
        image: '/images/charging-stations/delhi-okaya-janakpuri.jpg',
        fallbackImage: 'https://auto.economictimes.indiatimes.com/news/auto-components/okaya-power-bags-order-for-eighty-ev-charging-stations-from-bhel/76305286'
      },
      {
        id: 'delhi13',
        name: 'DMRC Charging Station - Rajiv Chowk',
        type: 'AC Charger',
        power: 15,
        pricePerKwh: 14.00,
        latitude: 28.6333,
        longitude: 77.2200,
        address: 'Rajiv Chowk Metro Station, New Delhi, 110001',
        rating: 4.3,
        hours: 'Metro Hours',
        connectorTypes: ['Type 2', 'Bharat AC-001'],
        amenities: ['Metro Station', 'Public Transport', 'Food Stalls'],
        image: '/images/charging-stations/delhi-dmrc-rajivchowk.jpg',
        fallbackImage: 'https://img.etimg.com/thumb/width-640,height-480,imgsize-1187351,resizemode-75,msid-82644969/industry/renewables/electric-vehicles/electric-vehicles-to-get-hundreds-of-charging-stations-in-delhi-this-year.jpg'
      },
      {
        id: 'delhi14',
        name: 'NTPC Vidyut - Okhla',
        type: 'DC Fast Charger',
        power: 50,
        pricePerKwh: 18.50,
        latitude: 28.5681,
        longitude: 77.2645,
        address: 'Okhla Industrial Area, New Delhi, 110020',
        rating: 4.2,
        hours: '24/7',
        connectorTypes: ['CCS', 'CHAdeMO', 'Type 2'],
        amenities: ['Industrial Area', 'Parking', 'Security'],
        image: '/images/charging-stations/delhi-ntpc-okhla.jpg',
        fallbackImage: 'https://www.ntpc.co.in/en/node/4432/45669'
      },
      {
        id: 'delhi15',
        name: 'Statiq Charging - Vasant Kunj',
        type: 'AC Charger',
        power: 22,
        pricePerKwh: 15.50,
        latitude: 28.5294,
        longitude: 77.1592,
        address: 'Vasant Kunj, New Delhi, 110070',
        rating: 4.4,
        hours: '24/7',
        connectorTypes: ['Type 2', 'Bharat AC-001'],
        amenities: ['Residential Area', 'Shopping Mall Nearby'],
        image: '/images/charging-stations/delhi-statiq-vasantkunj.jpg',
        fallbackImage: 'https://cdn.statiq.in/media/statiq_at_work/hero-1400.jpg'
      },
      {
        id: 'delhi16',
        name: 'Kazam EV - Karol Bagh',
        type: 'AC/DC Charger',
        power: 20,
        pricePerKwh: 15.00,
        latitude: 28.6520,
        longitude: 77.1901,
        address: 'Karol Bagh, New Delhi, 110005',
        rating: 4.0,
        hours: '9 AM - 9 PM',
        connectorTypes: ['CCS', 'Type 2'],
        amenities: ['Shopping Area', 'Market'],
        image: '/images/charging-stations/delhi-kazam-karolbagh.jpg',
        fallbackImage: 'https://www.91wheels.com/assets/kazam/img/product-page/charger-3.jpg'
      },
      {
        id: 'delhi17',
        name: 'Magenta ChargeGrid - South Extension',
        type: 'DC Fast Charger',
        power: 60,
        pricePerKwh: 19.00,
        latitude: 28.5736,
        longitude: 77.2160,
        address: 'South Extension, New Delhi, 110049',
        rating: 4.5,
        hours: '24/7',
        connectorTypes: ['CCS', 'CHAdeMO'],
        amenities: ['Shopping Area', 'Restaurants', 'Parking'],
        image: '/images/charging-stations/delhi-magenta-southex.jpg',
        fallbackImage: 'https://www.financialexpress.com/wp-content/uploads/2022/05/magenta-charger-1.jpeg'
      },
      {
        id: 'delhi18',
        name: 'Delta EV Charging - Greater Kailash',
        type: 'AC/DC Charger',
        power: 40,
        pricePerKwh: 17.50,
        latitude: 28.5484,
        longitude: 77.2273,
        address: 'Greater Kailash I, New Delhi, 110048',
        rating: 4.3,
        hours: '7 AM - 10 PM',
        connectorTypes: ['CCS', 'Type 2'],
        amenities: ['Residential Area', 'Market', 'Restaurants'],
        image: '/images/charging-stations/delhi-delta-gk.jpg',
        fallbackImage: 'https://www.deltaelectronicsindia.com/wp-content/uploads/2019/09/Delta-Showcases-Smart-Green-Solutions-for-Smart-City-at-IEC-2019-1.jpg'
      },
      {
        id: 'delhi19',
        name: 'HPCL EV Station - RK Puram',
        type: 'DC Fast Charger',
        power: 50,
        pricePerKwh: 18.00,
        latitude: 28.5672,
        longitude: 77.1830,
        address: 'RK Puram, New Delhi, 110022',
        rating: 4.1,
        hours: '24/7',
        connectorTypes: ['CCS', 'CHAdeMO'],
        amenities: ['Convenience Store', 'Restrooms', '24/7 Service'],
        image: '/images/charging-stations/delhi-hpcl-rkpuram.jpg',
        fallbackImage: 'https://www.hindustanpetroleum.com/images/HP2-1400.jpg'
      },
      {
        id: 'delhi20',
        name: 'Exicom Power - Noida Border',
        type: 'AC/DC Charger',
        power: 30,
        pricePerKwh: 16.00,
        latitude: 28.5842,
        longitude: 77.3089,
        address: 'Delhi-Noida Border, Delhi NCR, 110092',
        rating: 4.2,
        hours: '24/7',
        connectorTypes: ['CCS', 'Type 2', 'Bharat AC-001'],
        amenities: ['Border Crossing', 'Food Stalls', 'Security'],
        image: '/images/charging-stations/delhi-exicom-noida.jpg',
        fallbackImage: 'https://www.exicom.in/images/EV-chargers-Home-Banner1.jpg'
      },
    ],
    mumbai: [
      {
        id: 'mumbai1',
        name: 'Tata Power EZ Charge - BKC',
        type: 'DC Fast Charger',
        power: 60,
        pricePerKwh: 21.00,
        latitude: 19.0612,
        longitude: 72.8637,
        address: 'Bandra Kurla Complex, Mumbai, Maharashtra 400051',
        rating: 4.6,
        hours: '24/7',
        connectorTypes: ['CCS', 'CHAdeMO'],
        amenities: ['Business District', 'Restaurants'],
        fallbackImage: 'https://auto.hindustantimes.com/auto/ev/tata-power-to-install-300-fast-charging-stations-for-evs-across-indian-cities-in-fy23-41658220532308.html'
      },
      {
        id: 'mumbai2',
        name: 'Adani Electricity Charging Point',
        type: 'AC/DC Charger',
        power: 30,
        pricePerKwh: 17.00,
        latitude: 19.0190,
        longitude: 72.8270,
        address: 'Worli, Mumbai, Maharashtra 400018',
        rating: 4.3,
        hours: '7 AM - 11 PM',
        connectorTypes: ['CCS', 'Type 2'],
        amenities: ['Sea-facing', 'Cafes Nearby'],
        fallbackImage: 'https://static.toiimg.com/thumb/msid-80124959,width-1280,height-720,resizemode-4/.jpg'
      },
      // Add 18 more Mumbai stations
      {
        id: 'mumbai3',
        name: 'Jio-bp Pulse - Andheri',
        type: 'DC Fast Charger',
        power: 60,
        pricePerKwh: 20.00,
        latitude: 19.1195,
        longitude: 72.8476,
        address: 'Andheri East, Mumbai, Maharashtra 400069',
        rating: 4.5,
        hours: '24/7',
        connectorTypes: ['CCS', 'CHAdeMO'],
        amenities: ['Business District', '24/7 Service', 'Café'],
        image: '/images/charging-stations/mumbai-jio-andheri.jpg',
        fallbackImage: 'https://www.financialexpress.com/wp-content/uploads/2021/10/jio-BP.jpg'
      },
      
      // Add all other Mumbai stations here...
    ],
    bangalore: [
      {
        id: 'blr1',
        name: 'Ather Grid - Indiranagar',
        type: 'AC Charger',
        power: 3.3,
        pricePerKwh: 14.50,
        latitude: 12.9784,
        longitude: 77.6408,
        address: '100 Feet Road, Indiranagar, Bengaluru, Karnataka 560038',
        rating: 4.8,
        hours: '9 AM - 9 PM',
        connectorTypes: ['Ather Connector'],
        amenities: ['Cafe', 'Shopping Area'],
        fallbackImage: 'https://images.financialexpress.com/2021/08/Ather-Grid.jpg'
      },
      {
        id: 'blr2',
        name: 'BESCOM EV Charging Station',
        type: 'DC Fast Charger',
        power: 50,
        pricePerKwh: 18.00,
        latitude: 12.9716,
        longitude: 77.5946,
        address: 'Cubbon Park, Bengaluru, Karnataka 560001',
        rating: 4.4,
        hours: '24/7',
        connectorTypes: ['CCS', 'CHAdeMO', 'Type 2'],
        amenities: ['Park', 'Government Offices'],
        fallbackImage: 'https://cdn.zeebiz.com/sites/default/files/2021/02/19/143034-ev-pti.jpg'
      },
      // Add 18 more Bangalore stations
      // ...
    ],
    chennai: [
      {
        id: 'chen1',
        name: 'AARGO EV Charging Hub',
        type: 'DC Fast Charger',
        power: 60,
        pricePerKwh: 18.50,
        latitude: 13.0827,
        longitude: 80.2707,
        address: 'Anna Salai, Chennai, Tamil Nadu 600002',
        rating: 4.3,
        hours: '24/7',
        connectorTypes: ['CCS', 'CHAdeMO'],
        amenities: ['Central Location', '24/7 Support'],
        fallbackImage: 'https://img.etimg.com/thumb/width-1200,height-900,imgsize-128694,resizemode-75,msid-100238243/industry/renewables/electric-vehicles/indias-first-fast-charger-for-electric-vehicles-installed-in-nagpur.jpg'
      },
      // Add 19 more Chennai stations
      // ...
    ],
    hyderabad: [
      {
        id: 'hyd1',
        name: 'PowerGrid Fast Charging Station',
        type: 'DC Fast Charger',
        power: 60,
        pricePerKwh: 19.00,
        latitude: 17.4399,
        longitude: 78.4983,
        address: 'HITEC City, Hyderabad, Telangana 500081',
        rating: 4.5,
        hours: '24/7',
        connectorTypes: ['CCS', 'CHAdeMO', 'Type 2'],
        amenities: ['IT Park', 'Restaurants', '24/7 Support'],
        fallbackImage: 'https://electricvehicles.in/wp-content/uploads/2019/07/Fortum-India-EV-Charging-Station.jpg'
      },
      // Add 19 more Hyderabad stations
      // ...
    ]
  };

  // Get currently selected city's stations
  const currentCityStations = allChargingStations[selectedCity] || [];

  const handleCityChange = (city) => {
    setSelectedCity(city);
    setUserLocation(cityLocations[city]);
    setSelectedStation(null); // Clear selected station when changing city
  };

  // Enhanced image error handling with multi-level fallbacks
  const handleImageError = (stationId) => {
    // Track fallback level: 0=primary, 1=station fallback, 2=common fallback
    const currentLevel = imageFallbackLevel[stationId] || 0;
    
    if (currentLevel === 0) {
      // First error - try station's fallback image
      setImageFallbackLevel(prev => ({
        ...prev,
        [stationId]: 1
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

  useEffect(() => {
    // Attempt to get user's location if they allow it
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          // Keep default Pune location
        }
      );
    }
    setLoading(false);
  }, []);

  return (
    <div className="home-page">
      {/* Hero Header with Navigation */}
      <header className="home-header">
        <div className="container header-container">
          <div className="logo">
            <span className="logo-text">EV Charging Network</span>
          </div>
          <div className="nav-links">
            <a href="#about" className="nav-item">About</a>
            <a href="#stations" className="nav-item">Stations</a>
            <a href="#how-it-works" className="nav-item">How it Works</a>
            <div className="auth-buttons">
              <Link to="/login" className="btn-login">Login</Link>
              <Link to="/signup" className="btn-signup">Sign Up</Link>
            </div>
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
              <button onClick={() => navigate('/signup')} className="btn-primary">Join Now</button>
              <a href="#stations" className="btn-secondary">View Stations</a>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about-section">
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
        {/* New City Selector Section */}
        <div className="city-selector">
          <h3>Select a City</h3>
          <div className="cities-grid">
            <div 
              className={`city-option ${selectedCity === 'pune' ? 'active' : ''}`}
              onClick={() => handleCityChange('pune')}
            >
              <div className="city-icon">🏙️</div>
              <div className="city-name">Pune</div>
            </div>
            <div 
              className={`city-option ${selectedCity === 'delhi' ? 'active' : ''}`}
              onClick={() => handleCityChange('delhi')}
            >
              <div className="city-icon">🏛️</div>
              <div className="city-name">Delhi</div>
            </div>
            <div 
              className={`city-option ${selectedCity === 'mumbai' ? 'active' : ''}`}
              onClick={() => handleCityChange('mumbai')}
            >
              <div className="city-icon">🌊</div>
              <div className="city-name">Mumbai</div>
            </div>
            <div 
              className={`city-option ${selectedCity === 'bangalore' ? 'active' : ''}`}
              onClick={() => handleCityChange('bangalore')}
            >
              <div className="city-icon">💻</div>
              <div className="city-name">Bangalore</div>
            </div>
            <div 
              className={`city-option ${selectedCity === 'chennai' ? 'active' : ''}`}
              onClick={() => handleCityChange('chennai')}
            >
              <div className="city-icon">🌴</div>
              <div className="city-name">Chennai</div>
            </div>
            <div 
              className={`city-option ${selectedCity === 'hyderabad' ? 'active' : ''}`}
              onClick={() => handleCityChange('hyderabad')}
            >
              <div className="city-icon">🏯</div>
              <div className="city-name">Hyderabad</div>
            </div>
          </div>
        </div>

        {/* Update the Map Section Title */}
        <section id="stations" className="map-section">
          <div className="container">
            <h2>EV Charging Stations in {selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1)}</h2>
            <p className="section-intro">Below is a map of available charging stations. Click on any marker to see details.</p>
            
            <div className="map-container">
              {!loading && (
                <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
                  <GoogleMap
                    mapContainerStyle={{ height: '500px', width: '100%' }}
                    center={userLocation}
                    zoom={12}
                    options={{
                      styles: mapStyles,
                      disableDefaultUI: false,
                      zoomControl: true
                    }}
                  >
                    {/* User location marker */}
                    <Marker
                      position={userLocation}
                      icon={{
                        path: 0, // Circle
                        scale: 7,
                        fillColor: '#4285F4',
                        fillOpacity: 1,
                        strokeWeight: 2,
                        strokeColor: '#FFFFFF'
                      }}
                    />

                    {/* Station markers for current selected city */}
                    {currentCityStations.map(station => (
                      <Marker
                        key={station.id}
                        position={{ lat: station.latitude, lng: station.longitude }}
                        onClick={() => setSelectedStation(station)}
                        icon={{
                          path: 0, // Circle
                          scale: 7,
                          fillColor: '#0C5F2C',
                          fillOpacity: 1,
                          strokeWeight: 2,
                          strokeColor: '#FFFFFF'
                        }}
                      />
                    ))}

                    {/* Info Window for selected station */}
                    {selectedStation && (
                      <InfoWindow
                        position={{ 
                          lat: selectedStation.latitude, 
                          lng: selectedStation.longitude 
                        }}
                        onCloseClick={() => setSelectedStation(null)}
                      >
                        <div className="station-infowindow">
                          <h3>{selectedStation.name}</h3>
                          <p className="address">{selectedStation.address}</p>
                          <div className="info-details">
                            <p>Type: {selectedStation.type}</p>
                            <p>Power: {selectedStation.power} kW</p>
                            <p>Price: ₹{selectedStation.pricePerKwh}/kWh</p>
                          </div>
                          <button 
                            onClick={() => {
                              const element = document.getElementById(`station-${selectedStation.id}`);
                              element?.scrollIntoView({ behavior: 'smooth' });
                            }}
                          >
                            See Details
                          </button>
                        </div>
                      </InfoWindow>
                    )}
                  </GoogleMap>
                </LoadScript>
              )}
            </div>
          </div>
        </section>

        {/* Update Stations List Section */}
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
                      <button onClick={() => navigate('/login')} className="btn-book">Book Now</button>
                      <button onClick={() => {
                        setSelectedStation(station);
                        const mapSection = document.getElementById('stations');
                        mapSection?.scrollIntoView({ behavior: 'smooth' });
                      }} className="btn-locate">Locate on Map</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="how-it-works">
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
              <Link to="/signup" className="btn-large">Get Started Today</Link>
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
                  <a href="#" className="social-link">Facebook</a>
                  <a href="#" className="social-link">Twitter</a>
                  <a href="#" className="social-link">Instagram</a>
                  <a href="#" className="social-link">LinkedIn</a>
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

// Custom map styles (subtle styling for the map)
const mapStyles = [
  {
    featureType: "administrative",
    elementType: "geometry",
    stylers: [{ visibility: "simplified" }]
  },
  {
    featureType: "poi",
    stylers: [{ visibility: "simplified" }]
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }]
  },
  {
    featureType: "water",
    stylers: [{ color: "#e9e9e9" }]
  }
];

export default HomePage;
