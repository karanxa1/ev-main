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
  'BYD Seal (61.44 kWh)': 'https://media-hosting.imagekit.io/f1022ddd89624287/bydseal.jpeg?Expires=1841848538&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=Ur5vvJhaCjd8VfNhgGP9LlGm3-vDLPfoAKkA7krIkX31EdE1hiCFttWCA4eloz2lQvVfK2hJMdcxbmtqvqE2QDxV7yU6KzntX9OZqvsq91yzxSxiyyKnIY-V0iFqsDH8Dwxu~yjbhr3sEcv-ygezxAcIb4MHmY~1Q7S4KwcUN-CwZNseqmuD60fFZwzSxHZHGhc1BPv7EY69a~~jtgHrDOX77iP-tjBaaAw-T5wHvvHsh4PIaeR7ntsOmaAcHoC5kABeZlwTBAAxMzVrHHgpeQcrJY-Cw5RJlqRiAQEs5PKbGYL40tEWV9BwW9gyJVifG1k7A7r1DVyFVvQX2N2~QA__',
  'BYD Seal (82.56 kWh)': 'https://media-hosting.imagekit.io/f1022ddd89624287/bydseal.jpeg?Expires=1841848538&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=Ur5vvJhaCjd8VfNhgGP9LlGm3-vDLPfoAKkA7krIkX31EdE1hiCFttWCA4eloz2lQvVfK2hJMdcxbmtqvqE2QDxV7yU6KzntX9OZqvsq91yzxSxiyyKnIY-V0iFqsDH8Dwxu~yjbhr3sEcv-ygezxAcIb4MHmY~1Q7S4KwcUN-CwZNseqmuD60fFZwzSxHZHGhc1BPv7EY69a~~jtgHrDOX77iP-tjBaaAw-T5wHvvHsh4PIaeR7ntsOmaAcHoC5kABeZlwTBAAxMzVrHHgpeQcrJY-Cw5RJlqRiAQEs5PKbGYL40tEWV9BwW9gyJVifG1k7A7r1DVyFVvQX2N2~QA__',
  'BYD Atto 3': 'https://media-hosting.imagekit.io/f029e5b2563f48b4/bydatto.jpeg?Expires=1841849159&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=G6Mvm0tKw4ro59wE0d5jCbQiX2d2Kvjsi6PJW8U1Yn4TMsVFcJ0iSCoc5TZo40Mtv8dUquuOJ1tFkCf7jaYBjugQ7URNbc8CFcc027AN5zw7WtKQI2YP5ZaGpdzv2ENkf6vipIL4O~SCWPvEVYir30Zc-pm5G5wIzBnX14nhIgQwOAcS4UcXrxRIFXswVzYLtaWkHYEZwwTbRvQmE07DIm0HCJlzwKt-syQO2Zqr7Kh849LHJzdS-1kPmMHIOIiZ1AdrbTPJUW9CFZVlsn-huaMzjZ-RJJ-z6mC9qxcWkVqBm-eEFMGdcyKS9TOoYZcWdGztrcfVCzEMjJi7VXDJAw__',
  'BYD e6 MPV': 'https://media-hosting.imagekit.io/304433c8756f4dc3/Generated%20Image%20May%2014,%202025%20-%2010_17PM.jpeg?Expires=1841849297&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=XuG80ruN5jCasIle0SuUBuJBgLE6kvyawzaPiTQmcMTxI~9-Tqh0FFswxH2MANjMCa8zISRfqLcoK1d1Dsgg5bMTS78tvdzsF-pXQMR~FyislI6zprYxGFHG-zTOwwVK13nnTqZVPze3WTWWrh~Pz2GPJQqduFPRVNp4ZfYBKi5kaMJ1zjW0-cVmfDPlkMk-0YJipttaaZUlfDK1gQYJ1IJWl8M0cXqNpTrgtYK9oT7cDbztrmd6rc88Rn8ADeE-MwdbABIzBEOM84zGqCDFp1HCa7NW3eFqMGsgtJ25fGvPRRagF37CDrWqo0lnMz83kHwvqyTa3Ds9~dIBGxaIFw__',
  'Tata Tiago EV (Medium Range)': 'https://media-hosting.imagekit.io/5575f029551a4cf8/Generated%20Image%20May%2014,%202025%20-%2010_22PM.jpeg?Expires=1841849598&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=GNPuUKi5X3PtYcVR5wpldzajPz7o88t--4t4DAKdwRoLQwa2LKUlpyxnKFASmS6pH5rXHsobKMTjOoqUlLnlyFnM8ZYFNBXP9MSGIvQApOhVXM23bf2adpb11eel6naiksGz1F~AsnLom4OUfeMpZJd262XhwcffdXejzJbj7OGYVYBInGpxua6WF0CleCHuwGF4zQOlskfxHFJa~5kgMSO6KDksfX7pJrvXO5Els~TPddl10uGTNwzlvbEsQbXE74Xx3lkFDmFyScUX-VxdyKC5rViFoXwcT7XftSHRE7y583Z3KohwbsmB2i6Gv0D3Hfr8xmD6j0B7H0RUN3Rugg__',
  'Tata Tiago EV (Long Range)': 'https://media-hosting.imagekit.io/5575f029551a4cf8/Generated%20Image%20May%2014,%202025%20-%2010_22PM.jpeg?Expires=1841849598&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=GNPuUKi5X3PtYcVR5wpldzajPz7o88t--4t4DAKdwRoLQwa2LKUlpyxnKFASmS6pH5rXHsobKMTjOoqUlLnlyFnM8ZYFNBXP9MSGIvQApOhVXM23bf2adpb11eel6naiksGz1F~AsnLom4OUfeMpZJd262XhwcffdXejzJbj7OGYVYBInGpxua6WF0CleCHuwGF4zQOlskfxHFJa~5kgMSO6KDksfX7pJrvXO5Els~TPddl10uGTNwzlvbEsQbXE74Xx3lkFDmFyScUX-VxdyKC5rViFoXwcT7XftSHRE7y583Z3KohwbsmB2i6Gv0D3Hfr8xmD6j0B7H0RUN3Rugg__',
  'Tata Nexon EV Prime (XM)': 'https://media-hosting.imagekit.io/5247d55c105c4757/Generated%20Image%20May%2014,%202025%20-%2010_26PM.jpeg?Expires=1841849914&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=gu8ifS7jF2tJtgx8xQfgpRVfu~C1JeKJ80w9xjW1FTd-ZK7e~7jxSJAvy148WVdHgyE6GLVzYvHhePeiCNkCC3zV--P3DCRFcm4lMaYgv-kJaKoRO4MXYxV~iBAm4IlnIbuP3bNijYoiI6hvuRnWYhdCPhhlSDYFFineDUfBcju7DsKPV6nzuwcNBgcTeFnRL2ptvmtfp8rLbC6dgTN8BOYyp6jT-O4lIaBr2fAayDbrUnSp8T5i8vzpxgjbmv6SVoINHy4fo4E1ANFH8o6bOXKZUhBiFVvZsGss4XluLDKXq7NNgW~Lwh-1lbpc3v3dLABaz5bgkPsniG4hz7vYFw__',
  'Tata Nexon EV Max': 'https://media-hosting.imagekit.io/5247d55c105c4757/Generated%20Image%20May%2014,%202025%20-%2010_26PM.jpeg?Expires=1841849914&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=gu8ifS7jF2tJtgx8xQfgpRVfu~C1JeKJ80w9xjW1FTd-ZK7e~7jxSJAvy148WVdHgyE6GLVzYvHhePeiCNkCC3zV--P3DCRFcm4lMaYgv-kJaKoRO4MXYxV~iBAm4IlnIbuP3bNijYoiI6hvuRnWYhdCPhhlSDYFFineDUfBcju7DsKPV6nzuwcNBgcTeFnRL2ptvmtfp8rLbC6dgTN8BOYyp6jT-O4lIaBr2fAayDbrUnSp8T5i8vzpxgjbmv6SVoINHy4fo4E1ANFH8o6bOXKZUhBiFVvZsGss4XluLDKXq7NNgW~Lwh-1lbpc3v3dLABaz5bgkPsniG4hz7vYFw__',
  'Tata Tigor EV': 'https://s7ap1.scene7.com/is/image/tatapassenger/MagneticRed-0?$PO-850-600-S$&fit=crop&fmt=avif-alpha',
  'Tata Punch EV (Standard Range)': 'https://s7ap1.scene7.com/is/image/tatapassenger/Oxidegrey-0?$PO-850-600-S$&fit=crop&fmt=avif-alpha',
  'Tata Punch EV (Long Range)': 'https://s7ap1.scene7.com/is/image/tatapassenger/Oxidegrey-0?$PO-850-600-S$&fit=crop&fmt=avif-alpha',
  'Tata Curvv EV': 'https://s7ap1.scene7.com/is/image/tatapassenger/VirtualSunrise-0?$PO-750-500-S$&fit=crop&fmt=avif-alpha',
  'Rolls-Royce Spectre': 'https://imgd.aeplcdn.com/664x374/n/cw/ec/168715/spectre-exterior-right-front-three-quarter-3.jpeg?isig=0&q=80',
  'Audi e-tron GT': 'https://imgd.aeplcdn.com/664x374/n/cw/ec/47073/e-tron-gt-exterior-right-front-three-quarter-2.jpeg?isig=0&q=80',
  'BMW iX (xDrive40)': 'https://imgd.aeplcdn.com/664x374/n/cw/ec/108499/ix-exterior-right-front-three-quarter-3.jpeg?isig=0&q=80',
  'BMW i4': 'https://imgd.aeplcdn.com/664x374/n/cw/ec/109123/i4-exterior-right-front-three-quarter.jpeg?isig=0&q=80',
  'BMW i5': 'https://imgd.aeplcdn.com/664x374/n/cw/ec/174353/i5-exterior-right-front-three-quarter-2.jpeg?isig=0&q=80',
  'BMW i7': 'https://imgd.aeplcdn.com/664x374/n/cw/ec/137875/i7-exterior-right-front-three-quarter-8.jpeg?isig=0&q=80',
  'BMW iX1': 'https://imgd.aeplcdn.com/664x374/n/cw/ec/196035/ix1-exterior-right-front-three-quarter.jpeg?isig=0&q=80',
  'Ather 450X': 'https://imgd.aeplcdn.com/664x374/n/cw/ec/1/versions/ather-450x-29-kwh-20251735974741344.jpg?q=80',
  'Bajaj Chetak': 'https://imgd.aeplcdn.com/664x374/n/cw/ec/1/versions/--35031745819961752.jpg?q=80',
  'Citroen eC3': 'https://imgd.aeplcdn.com/664x374/n/cw/ec/132771/ec3-exterior-right-front-three-quarter-7.jpeg?isig=0&q=80',
  'Hero Vida V1 Pro': 'https://imgd.aeplcdn.com/664x374/n/cw/ec/132397/v1-right-front-three-quarter-8.jpeg?isig=0&q=80',
  'Hyundai Ioniq 5': 'https://imgd.aeplcdn.com/664x374/n/cw/ec/110289/ioniq-5-exterior-right-front-three-quarter-95.jpeg?isig=0&q=80',
  'Hyundai Creta Electric': 'https://imgd.aeplcdn.com/664x374/n/cw/ec/167017/creta-ev-exterior-right-front-three-quarter-14.jpeg?isig=0&q=80',
  'Hyundai Kona Electric': 'https://imgd.aeplcdn.com/664x374/n/cw/ec/29580/kona-electric-exterior-right-front-three-quarter-162254.jpeg?isig=0&wm=1&q=80',
  'Kia EV6 GT Line': 'https://imgd.aeplcdn.com/664x374/n/cw/ec/186465/ev6-exterior-right-front-three-quarter-2.jpeg?isig=0&q=80',
  'Kia EV9': 'https://imgd.aeplcdn.com/664x374/n/cw/ec/144485/ev9-exterior-right-front-three-quarter-3.jpeg?isig=0&q=80',
  'MG ZS EV': 'https://imgd.aeplcdn.com/664x374/n/cw/ec/110437/zs-ev-exterior-right-front-three-quarter-69.jpeg?isig=0&q=80',
  'MG Comet EV': 'https://imgd.aeplcdn.com/664x374/n/cw/ec/125193/comet-ev-exterior-right-front-three-quarter-29.jpeg?isig=0&q=80'
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