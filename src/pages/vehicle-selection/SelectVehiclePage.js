import React, { useState, useMemo } from 'react';
// import { indianEVs, vehicleBrands } from '../../data/vehicleData';
import { EV_MODELS } from '../../components/CostEstimator/CostEstimator'; // Fixed path
import { FaSearch } from 'react-icons/fa';
import './SelectVehiclePage.css'; // Path will be correct as it's a sibling
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext'; // Fixed path
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase'; // Fixed path

// Special image URLs for specific models
const SPECIAL_VEHICLE_IMAGES = {
  'BYD Seal (61.44 kWh)': 'https://imgd.aeplcdn.com/664x374/n/cw/ec/139619/seal-exterior-right-front-three-quarter-9.png?isig=0&q=80',
  'BYD Seal (82.56 kWh)': 'https://imgd.aeplcdn.com/664x374/n/cw/ec/139619/seal-exterior-right-front-three-quarter-9.png?isig=0&q=80',
  'BYD Atto 3': 'https://imgd.aeplcdn.com/664x374/n/cw/ec/130183/atto-3-exterior-right-front-three-quarter-104.jpeg?isig=0&q=80',
  'BYD e6 MPV': 'https://images.91wheels.com/assets/b_images/main/models/profile/profile1702528072.jpg?width=420&q=60?w=420&q=60',
  'Tata Tiago EV (Medium Range)': 'https://imgd.aeplcdn.com/664x374/n/cw/ec/40453/tiago-ev-exterior-right-front-three-quarter-14.jpeg?isig=0&q=80',
  'Tata Tiago EV (Long Range)': 'https://imgd.aeplcdn.com/664x374/n/cw/ec/40453/tiago-ev-exterior-right-front-three-quarter-14.jpeg?isig=0&q=80',
  'Tata Nexon EV Prime (XM)': 'https://imgd.aeplcdn.com/664x374/n/cw/ec/149123/nexon-ev-exterior-right-front-three-quarter-79.jpeg?isig=0&q=80',
  'Tata Nexon EV Max': 'https://imgd.aeplcdn.com/664x374/n/cw/ec/149123/nexon-ev-exterior-right-front-three-quarter-79.jpeg?isig=0&q=80',
  'Tata Tigor EV': 'https://s7ap1.scene7.com/is/image/tatapassenger/MagneticRed-0?$PO-850-600-S$&fit=crop&fmt=avif-alpha',
  'Tata Punch EV (Standard Range)': 'https://s7ap1.scene7.com/is/image/tatapassenger/Oxidegrey-0?$PO-850-600-S$&fit=crop&fmt=avif-alpha',
  'Tata Punch EV (Long Range)': 'https://s7ap1.scene7.com/is/image/tatapassenger/Oxidegrey-0?$PO-850-600-S$&fit=crop&fmt=avif-alpha',
  'Tata Curvv EV': 'https://s7ap1.scene7.com/is/image/tatapassenger/VirtualSunrise-0?$PO-750-500-S$&fit=crop&fmt=avif-alpha',
  'Rolls-Royce Spectre': 'https://imgd.aeplcdn.com/664x374/n/cw/ec/168715/spectre-exterior-right-front-three-quarter-3.jpeg?isig=0&q=80',
  'Audi e-tron GT': 'https://imgd.aeplcdn.com/664x374/n/cw/ec/47073/e-tron-gt-exterior-right-front-three-quarter-2.jpeg?isig=0&q=80',
  'Audi RS e-tron GT': 'https://imgd.aeplcdn.com/664x374/n/cw/ec/47073/e-tron-gt-exterior-right-front-three-quarter-2.jpeg?isig=0&q=80',
  'BMW iX (xDrive40)': 'https://imgd.aeplcdn.com/664x374/n/cw/ec/108499/ix-exterior-right-front-three-quarter-3.jpeg?isig=0&q=80',
  'BMW i4': 'https://imgd.aeplcdn.com/664x374/n/cw/ec/109123/i4-exterior-right-front-three-quarter.jpeg?isig=0&q=80',
  'BMW i5': 'https://imgd.aeplcdn.com/664x374/n/cw/ec/174353/i5-exterior-right-front-three-quarter-2.jpeg?isig=0&q=80',
  'BMW i7': 'https://imgd.aeplcdn.com/664x374/n/cw/ec/137875/i7-exterior-right-front-three-quarter-8.jpeg?isig=0&q=80',
  'BMW iX1': 'https://imgd.aeplcdn.com/664x374/n/cw/ec/196035/ix1-exterior-right-front-three-quarter.jpeg?isig=0&q=80',
  'Hyundai Ioniq 5': 'https://imgd.aeplcdn.com/664x374/n/cw/ec/110289/ioniq-5-exterior-right-front-three-quarter-95.jpeg?isig=0&q=80',
  'Hyundai Ioniq 5 (77.4 kWh)': 'https://imgd.aeplcdn.com/664x374/n/cw/ec/110289/ioniq-5-exterior-right-front-three-quarter-95.jpeg?isig=0&q=80',
  'Hyundai Creta Electric': 'https://imgd.aeplcdn.com/664x374/n/cw/ec/167017/creta-ev-exterior-right-front-three-quarter-14.jpeg?isig=0&q=80',
  'Hyundai Kona Electric': 'https://imgd.aeplcdn.com/664x374/n/cw/ec/29580/kona-electric-exterior-right-front-three-quarter-162254.jpeg?isig=0&wm=1&q=80',
  'Kia EV6 GT Line': 'https://imgd.aeplcdn.com/664x374/n/cw/ec/186465/ev6-exterior-right-front-three-quarter-2.jpeg?isig=0&q=80',
  'Kia EV9': 'https://imgd.aeplcdn.com/664x374/n/cw/ec/144485/ev9-exterior-right-front-three-quarter-3.jpeg?isig=0&q=80',
  'MG ZS EV': 'https://imgd.aeplcdn.com/664x374/n/cw/ec/110437/zs-ev-exterior-right-front-three-quarter-69.jpeg?isig=0&q=80',
  'MG ZS EV Excite': 'https://imgd.aeplcdn.com/664x374/n/cw/ec/110437/zs-ev-exterior-right-front-three-quarter-69.jpeg?isig=0&q=80',
  'MG Comet EV': 'https://imgd.aeplcdn.com/664x374/n/cw/ec/125193/comet-ev-exterior-right-front-three-quarter-29.jpeg?isig=0&q=80',
  'MG Windsor EV': 'https://imgd.aeplcdn.com/664x374/n/cw/ec/174611/windsor-ev-exterior-right-front-three-quarter-82.jpeg?isig=0&q=80',
  'Volvo XC40 Recharge (Single Motor)': 'https://imgd.aeplcdn.com/664x374/n/cw/ec/189773/ex40-exterior-right-front-three-quarter.jpeg?isig=0&q=80',
  'Volvo XC40 Recharge': 'https://imgd.aeplcdn.com/664x374/n/cw/ec/189773/ex40-exterior-right-front-three-quarter.jpeg?isig=0&q=80',
  'Volvo C40 Recharge': 'https://imgd.aeplcdn.com/664x374/n/cw/ec/150611/c40-recharge-exterior-right-front-three-quarter-3.jpeg?isig=0&q=80',
  'Ather 450X (Gen 3 - 3.7kWh)': 'https://imgd.aeplcdn.com/664x374/n/cw/ec/1/versions/ather-450x-29-kwh-20251735974741344.jpg?q=80',
  'Bajaj Chetak Electric (Premium)': 'https://imgd.aeplcdn.com/664x374/n/cw/ec/1/versions/--35031745819961752.jpg?q=80',
  'Citroen eC3': 'https://imgd.aeplcdn.com/664x374/n/cw/ec/132771/ec3-exterior-right-front-three-quarter-7.jpeg?isig=0&q=80',
  'Hero Vida V1 Pro': 'https://imgd.aeplcdn.com/664x374/n/cw/ec/132397/v1-right-front-three-quarter-8.jpeg?isig=0&q=80',
  'Mahindra XUV400 EC': 'https://imgd.aeplcdn.com/664x374/n/cw/ec/45278/xuv400-exterior-right-front-three-quarter-5.jpeg?isig=0&q=80',
  'Mahindra XUV400 EL': 'https://imgd.aeplcdn.com/664x374/n/cw/ec/45278/xuv400-exterior-right-front-three-quarter-5.jpeg?isig=0&q=80',
  'Mahindra BE.05 (Concept)': 'https://imgd.aeplcdn.com/664x374/n/cw/ec/42355/mahindra-be05-right-front-three-quarter0.jpeg?isig=0&q=80',
  'Mahindra XUV.e9 (Concept)': 'https://imgd.aeplcdn.com/664x374/n/cw/ec/42353/mahindra-xuve9-exterior-right-front-three-quarter-2.jpeg?isig=0&q=80',
  'Mahindra BE 6e': 'https://imgd.aeplcdn.com/664x374/n/cw/ec/131825/be-6e-exterior-right-front-three-quarter-5.jpeg?isig=0&q=80',
  'Mahindra XEV 9e': 'https://imgd.aeplcdn.com/664x374/n/cw/ec/130595/xev-9e-exterior-right-front-three-quarter.jpeg?isig=0&q=80',
  'Mercedes-Benz EQA': 'https://imgd.aeplcdn.com/664x374/n/cw/ec/178797/eqa-exterior-right-front-three-quarter.jpeg?isig=0&q=80',
  'Mercedes-Benz G-Class Electric EQG': 'https://imgd.aeplcdn.com/664x374/n/cw/ec/175191/g-class-with-eq-power-exterior-right-front-three-quarter-8.jpeg?isig=0&q=80',
  'Mini Countryman Electric': 'https://imgd.aeplcdn.com/664x374/n/cw/ec/181081/countryman-electric-exterior-right-front-three-quarter.jpeg?isig=0&q=80',
  'Ola S1 Pro (Gen 2)': 'https://imgd.aeplcdn.com/664x374/n/bw/models/colors/ola-select-model-midnight-blue-1692089506834.png?q=80',
  'TVS iQube S': 'https://imgd.aeplcdn.com/664x374/n/cw/ec/1/versions/--22-kwh1747293190144.jpg?q=80',
  'Simple One': 'https://cdn.bikedekho.com/processedimages/simple-energy/simple-one/source/simple-one67e54ea1a9e29.jpg?imwidth=360&impolicy=resize',
  'Ultraviolette F77 Recon': 'https://imgd.aeplcdn.com/664x374/n/cw/ec/1/versions/ultraviolette-f77-mach-2-std-supersonic-silver1742896201550.jpg?q=80',
  'Vayve Mobility Eva': 'https://car.zigcdn.com/images/car-images/930x620/Vayve-Mobility/Eva/9679/1737214417671/226_Azure-Horizon_4a708c.jpg',
  'PMV EaS E': 'https://stimg.cardekho.com/images/carexteriorimages/630x420/PMV/EaS-E/9441/1742617227255/front-left-side-47.jpg?tr=w-230',
  'Strom Motors R3': 'https://stimg.cardekho.com/images/car-images/360x240/Strom-Motors/R3/8412/1615968099081/223_red-with-white-roof_ff4659.jpg?imwidth=360&impolicy=resize'
};

const SelectVehiclePage = () => {
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Helper function to determine compatible charger types
  const getCompatibleChargerTypes = (vehicle) => {
    // Default charger types for most EVs
    const compatibleTypes = ['Type 2', 'CCS'];
    
    if (!vehicle) return compatibleTypes;
    
    // Add specific charger compatibility logic based on brands/models
    const brand = vehicle.brand.toLowerCase();
    
    if (brand === 'tata' || brand === 'mahindra' || brand === 'mg') {
      compatibleTypes.push('Bharat AC', 'Bharat DC');
    }
    
    if (brand === 'tesla') {
      compatibleTypes.push('Tesla Supercharger');
    }
    
    if (vehicle.name.toLowerCase().includes('ioniq') || 
        brand === 'hyundai' || 
        brand === 'kia') {
      compatibleTypes.push('CCS Combo 2');
    }
    
    // Handle 2-wheelers differently
    const isEVMotorcycle = EV_MODELS[vehicle.id]?.type === '2-wheeler';
    if (isEVMotorcycle) {
      return ['Type 2', 'Bharat AC', 'Standard Home Outlet'];
    }
    
    return compatibleTypes;
  };

  // Transform EV_MODELS into an array of vehicle objects
  const processedVehicles = useMemo(() => {
    return Object.keys(EV_MODELS).map(modelName => {
      const brand = modelName.split(' ')[0]; // Extract brand from model name
      
      // Check if this model has a special image URL
      let imageUrl;
      if (SPECIAL_VEHICLE_IMAGES[modelName]) {
        imageUrl = SPECIAL_VEHICLE_IMAGES[modelName];
      } else {
        // Use the default image naming convention
        const imageName = modelName.replace(/(\(\)|\\|\/)/g, '').replace(/\s+/g, '_') + '.png'; // Fixed regex syntax
        imageUrl = `/images/vehicles/${imageName}`;
      }

      return {
        id: modelName, // Use modelName as a unique ID
        name: modelName,
        brand: brand,
        imageUrl: imageUrl,
        capacity: EV_MODELS[modelName].capacity, // Include battery capacity
        type: EV_MODELS[modelName].type || '4-wheeler', // Include vehicle type
        // Add any other relevant properties from EV_MODELS
      };
    });
  }, []);

  // Dynamically generate vehicle brands from processedVehicles
  const vehicleBrands = useMemo(() => {
    const brands = new Set(processedVehicles.map(vehicle => vehicle.brand));
    return ['All', ...Array.from(brands).sort()];
  }, [processedVehicles]);

  const filteredVehicles = useMemo(() => {
    // return indianEVs.filter(vehicle => {
    return processedVehicles.filter(vehicle => {
      const brandMatch = selectedBrand === 'All' || vehicle.brand === selectedBrand;
      const searchMatch = vehicle.name.toLowerCase().includes(searchTerm.toLowerCase());
      return brandMatch && searchMatch;
    });
  // }, [selectedBrand, searchTerm]);
  }, [selectedBrand, searchTerm, processedVehicles]);

  const handleVehicleSelect = (vehicle) => {
    setSelectedVehicle(vehicle);
    console.log('Selected vehicle:', vehicle);
    // Get compatible charger types
    const compatibleChargerTypes = getCompatibleChargerTypes(vehicle);
    console.log('Compatible charger types:', compatibleChargerTypes);
  };

  const handleAddVehicle = async () => {
    if (!selectedVehicle) {
      setError('Please select a vehicle first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (!currentUser) {
        throw new Error('You must be logged in to add a vehicle');
      }

      // Prepare vehicle data with compatible charger information
      const vehicleData = {
        ...selectedVehicle,
        compatibleChargerTypes: getCompatibleChargerTypes(selectedVehicle),
        dateAdded: new Date().toISOString()
      };

      // Reference to the user document
      const userRef = doc(db, 'users', currentUser.uid);
      
      try {
        // First, try to create the user document if it doesn't exist
        // This ensures we have a document to update
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
          console.log('User document not found, creating new one...');
          // Create a new user document
          await setDoc(userRef, {
            uid: currentUser.uid,
            email: currentUser.email,
            createdAt: new Date().toISOString()
          });
          console.log('User document created successfully');
        }
        
        // Now update the user document with the vehicle data
        console.log('Updating user document with vehicle data...');
        await updateDoc(userRef, {
          vehicle: vehicleData
        });
        console.log('Vehicle data updated successfully');
      } catch (firestoreError) {
        console.error('Firestore operation failed:', firestoreError);
        // If updateDoc fails, try setDoc as a fallback
        console.log('Attempting fallback with setDoc...');
        await setDoc(userRef, {
          uid: currentUser.uid,
          email: currentUser.email,
          vehicle: vehicleData,
          createdAt: new Date().toISOString()
        });
      }

      console.log('Vehicle added to profile:', selectedVehicle.name);
      
      // Navigate to driver dashboard with vehicle data
      navigate('/driver', { 
        state: { 
          vehicleAdded: true,
          vehicle: vehicleData
        }
      });
      
    } catch (error) {
      console.error('Error adding vehicle:', error);
      setError('Failed to add vehicle: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="select-vehicle-page">
      <header className="svp-header">
        <h2>Select your vehicle</h2>
      </header>

      {error && (
        <div className="svp-error-message">
          {error}
        </div>
      )}

      <nav className="svp-brand-tabs">
        {vehicleBrands.map(brand => (
          <button 
            key={brand} 
            className={`svp-tab-button ${selectedBrand === brand ? 'active' : ''}`}
            onClick={() => setSelectedBrand(brand)}
          >
            {brand}
          </button>
        ))}
      </nav>

      <div className="svp-search-container">
        <FaSearch className="svp-search-icon" />
        <input 
          type="text" 
          placeholder="Search for vehicle name" 
          className="svp-search-input"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <main className="svp-vehicle-grid">
        {filteredVehicles.length > 0 ? (
          filteredVehicles.map(vehicle => (
            <div 
              key={vehicle.id} 
              className={`svp-vehicle-card ${selectedVehicle?.id === vehicle.id ? 'selected' : ''}`}
              onClick={() => handleVehicleSelect(vehicle)}
            >
              <img src={vehicle.imageUrl} alt={vehicle.name} className="svp-vehicle-image" onError={(e) => e.target.src='/images/vehicles/fallback_ev.png'} />
              <p className="svp-vehicle-name">{vehicle.name}</p>
            </div>
          ))
        ) : (
          <p className="svp-no-results">No vehicles found matching your criteria.</p>
        )}
      </main>

      <footer className="svp-footer">
        <button 
          className="svp-add-vehicle-button" 
          onClick={handleAddVehicle} 
          disabled={!selectedVehicle || loading}
        >
          {loading ? 'Adding...' : 'Add Vehicle'}
        </button>
      </footer>
    </div>
  );
};

export default SelectVehiclePage; 