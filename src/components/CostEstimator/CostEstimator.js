import React, { useState, useEffect, useMemo } from 'react';
import './CostEstimator.css';

// Export EV_MODELS so it can be imported elsewhere
export const EV_MODELS = {
  // Merged and Updated List:
  'Tata Tiago EV (Medium Range)': { capacity: 19.2 },
  'Tata Tiago EV (Long Range)': { capacity: 24 },
  'Tata Nexon EV Prime (XM)': { capacity: 30.2 },
  'Tata Nexon EV Max': { capacity: 40.5 },
  'Tata Tigor EV': { capacity: 26 },
  'Tata Punch EV (Standard Range)': { capacity: 25 },
  'Tata Punch EV (Long Range)': { capacity: 35 },
  'Tata Curvv EV': { capacity: 55 }, // Concept/Upcoming

  'MG ZS EV Excite': { capacity: 50.3 }, // Often referred to as MG ZS EV
  'MG Comet EV': { capacity: 17.3 },
  'MG Windsor EV': { capacity: 38 },

  'Hyundai Kona Electric': { capacity: 39.2 },
  'Hyundai Creta Electric': { capacity: 51.4 }, // New model
  'Hyundai Ioniq 5 (77.4 kWh)': { capacity: 77.4 }, // Specific variant
  'Hyundai Ioniq 5': { capacity: 77.4 }, // Assuming same as 77.4kWh variant

  'Mahindra XUV400 EC': { capacity: 34.5 },
  'Mahindra XUV400 EL': { capacity: 39.4 },
  'Mahindra BE.05 (Concept)': { capacity: 70 }, // Concept
  'Mahindra XUV.e9 (Concept)': { capacity: 79 }, // Concept
  
  'Citroen eC3': { capacity: 29.2 },
  
  'BYD Atto 3': { capacity: 60.48 },
  'BYD Seal (61.44 kWh)': { capacity: 61.44 },
  'BYD Seal (82.56 kWh)': { capacity: 82.56 },
  'BYD e6 MPV': { capacity: 71.7 },

  'Kia EV6 GT Line': { capacity: 77.4 },
  'Kia EV9': { capacity: 99.8 },

  'Volvo XC40 Recharge (Single Motor)': { capacity: 69 },
  'Volvo XC40 Recharge': { capacity: 75 }, // General XC40 recharge
  'Volvo C40 Recharge': { capacity: 75 },

  'BMW iX (xDrive40)': { capacity: 76.6 }, // Specific variant of BMW iX
  'BMW i4': { capacity: 81.5 },
  'BMW i5': { capacity: 84.3 },
  'BMW i7': { capacity: 105.7 },
  'BMW iX1': { capacity: 64.7 },

  'Audi e-tron GT': { capacity: 84 },
  'Audi RS e-tron GT': { capacity: 97 }, 
  
  'Mercedes-Benz EQA': { capacity: 66.5 },
  'Mercedes-Benz G-Class Electric EQG': { capacity: 116 }, // Concept/Upcoming

  'Mini Countryman Electric': { capacity: 64.7 },
  'Rolls-Royce Spectre': { capacity: 102 },

  'Vayve Mobility Eva': { capacity: 18 },
  'PMV EaS E': { capacity: 10 },
  'Strom Motors R3': { capacity: 30 },

  // 2-Wheelers:
  'Ola S1 Pro (Gen 2)': { capacity: 4, type: '2-wheeler' },
  'Ather 450X (Gen 3 - 3.7kWh)': { capacity: 3.7, type: '2-wheeler' },
  'TVS iQube S': { capacity: 3.04, type: '2-wheeler' },
  'Bajaj Chetak Electric (Premium)': { capacity: 3, type: '2-wheeler' },
  'Hero Vida V1 Pro': { capacity: 3.94, type: '2-wheeler' },
  'Simple One': { capacity: 5, type: '2-wheeler' },
  'Ultraviolette F77 Recon': { capacity: 10.3, type: '2-wheeler' }
};

const DEFAULT_COST_PER_KWH = 18; // Rupees
const DEFAULT_CHARGER_POWER = 25; // kW (average for mixed public chargers - cars)
const DEFAULT_2W_CHARGER_POWER = 3.3; // kW (common power for home/public L2 for 2-wheelers)

const CostEstimator = () => {
  const [vehicleCategory, setVehicleCategory] = useState('4-wheeler'); // '4-wheeler' or '2-wheeler'

  const availableModels = useMemo(() => {
    return Object.entries(EV_MODELS)
      .filter(([_, modelDetails]) => 
        vehicleCategory === '2-wheeler' ? modelDetails.type === '2-wheeler' : modelDetails.type !== '2-wheeler'
      )
      .reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {});
  }, [vehicleCategory]);

  // Set initial model key based on the filtered list
  const [selectedModelKey, setSelectedModelKey] = useState(Object.keys(availableModels)[0] || '');
  
  // Effect to update selectedModelKey when availableModels changes (e.g., due to category change)
  // and ensure it's a valid key from the new list.
  useEffect(() => {
    const modelKeys = Object.keys(availableModels);
    if (modelKeys.length > 0 && !availableModels[selectedModelKey]) {
      setSelectedModelKey(modelKeys[0]);
    } else if (modelKeys.length === 0) {
      setSelectedModelKey(''); // No models in this category
    }
  }, [availableModels, selectedModelKey]);

  const [currentSoc, setCurrentSoc] = useState(20); // Default current State of Charge (%) 
  const [desiredSoc, setDesiredSoc] = useState(80); // Default desired State of Charge (%)
  
  const [estimatedEnergy, setEstimatedEnergy] = useState(0); // kWh
  const [estimatedCost, setEstimatedCost] = useState(0); // Rupees
  const [estimatedTime, setEstimatedTime] = useState(''); // Hours and minutes string

  const selectedEv = useMemo(() => availableModels[selectedModelKey], [selectedModelKey, availableModels]);

  useEffect(() => {
    if (!selectedEv || !selectedModelKey) { // Added !selectedModelKey check
      setEstimatedEnergy(0);
      setEstimatedCost(0);
      setEstimatedTime('Select a model');
      return;
    }

    if (selectedEv.capacity <= 0) {
      setEstimatedEnergy(0);
      setEstimatedCost(0);
      setEstimatedTime('Data unavailable');
      return;
    }

    const current = Math.max(0, Math.min(100, Number(currentSoc)));
    const desired = Math.max(0, Math.min(100, Number(desiredSoc)));

    if (desired <= current) {
      setEstimatedEnergy(0);
      setEstimatedCost(0);
      setEstimatedTime('0 min');
      return;
    }

    const energyNeeded = (selectedEv.capacity * (desired - current)) / 100;
    const cost = energyNeeded * DEFAULT_COST_PER_KWH;

    const chargerPower = selectedEv.type === '2-wheeler' 
      ? DEFAULT_2W_CHARGER_POWER 
      : DEFAULT_CHARGER_POWER;

    const timeHoursDecimal = energyNeeded / chargerPower;
    
    const hours = Math.floor(timeHoursDecimal);
    const minutes = Math.round((timeHoursDecimal - hours) * 60);
    
    let timeString = '';
    if (hours > 0) {
      timeString += `${hours} hr `;
    }
    if (minutes > 0 || hours === 0) {
      timeString += `${minutes} min`;
    }
    if (!timeString && energyNeeded > 0) { 
      timeString = '< 1 min'; 
    } else if (!timeString) {
      timeString = '0 min';
    }

    setEstimatedEnergy(parseFloat(energyNeeded.toFixed(2)));
    setEstimatedCost(parseFloat(cost.toFixed(2)));
    setEstimatedTime(timeString.trim());

  }, [selectedEv, currentSoc, desiredSoc, selectedModelKey, availableModels]); // Added selectedModelKey and availableModels to dependencies

  const handleModelChange = (event) => {
    setSelectedModelKey(event.target.value);
  };

  const handleCurrentSocChange = (event) => {
    setCurrentSoc(event.target.value);
  };

  const handleDesiredSocChange = (event) => {
    setDesiredSoc(event.target.value);
  };

  return (
    <div className="cost-estimator-card">
      <div className="estimator-form">
        <div className="form-group vehicle-type-toggle">
          <label>Vehicle Type:</label>
          <div className="toggle-buttons">
            <button 
              className={vehicleCategory === '4-wheeler' ? 'active' : ''}
              onClick={() => setVehicleCategory('4-wheeler')}
            >
              4-Wheeler
            </button>
            <button 
              className={vehicleCategory === '2-wheeler' ? 'active' : ''}
              onClick={() => setVehicleCategory('2-wheeler')}
            >
              2-Wheeler
            </button>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="ev-model">Select EV Model:</label>
          <select id="ev-model" value={selectedModelKey} onChange={handleModelChange} disabled={Object.keys(availableModels).length === 0}>
            {Object.keys(availableModels).length > 0 ? (
              Object.keys(availableModels).map(key => (
                <option key={key} value={key}>{key} ({availableModels[key].capacity} kWh)</option>
              ))
            ) : (
              <option value="" disabled>No models available for this type</option>
            )}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="current-soc">Current Battery (%):</label>
          <input 
            type="number" 
            id="current-soc" 
            value={currentSoc} 
            onChange={handleCurrentSocChange} 
            min="0" 
            max="100"
          />
        </div>

        <div className="form-group">
          <label htmlFor="desired-soc">Target Battery (%):</label>
          <input 
            type="number" 
            id="desired-soc" 
            value={desiredSoc} 
            onChange={handleDesiredSocChange} 
            min="0" 
            max="100"
          />
        </div>
      </div>

      <div className="estimator-results">
        <h4>Estimated Results:</h4>
        {selectedModelKey && selectedEv ? (
          <>
            <div className="result-item">
              <span>Energy Needed:</span> 
              <strong>{estimatedEnergy} kWh</strong>
            </div>
            <div className="result-item">
              <span>Estimated Cost:</span> 
              <strong>₹{estimatedCost}</strong>
            </div>
            <div className="result-item">
              <span>Estimated Time:</span> 
              <strong>{estimatedTime}</strong>
            </div>
          </>
        ) : (
          <p>Please select a vehicle model.</p>
        )}
        <p className="estimator-note">
          Estimates are based on an average cost of ₹{DEFAULT_COST_PER_KWH}/kWh. 
          Assumed charger power: {DEFAULT_CHARGER_POWER}kW for cars, {DEFAULT_2W_CHARGER_POWER}kW for 2-wheelers.
          Actual figures may vary.
        </p>
      </div>
    </div>
  );
};

export default CostEstimator; 