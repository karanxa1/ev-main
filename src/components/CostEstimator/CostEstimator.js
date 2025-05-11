import React, { useState, useEffect, useMemo } from 'react';
import './CostEstimator.css';

const EV_MODELS = {
  'Tata Tiago EV (Medium Range)': { capacity: 19.2 }, // kWh
  'Tata Tiago EV (Long Range)': { capacity: 24 },
  'Tata Nexon EV Prime (XM)': { capacity: 30.2 },
  'Tata Nexon EV Max': { capacity: 40.5 },
  'Tata Tigor EV': { capacity: 26 },
  'MG ZS EV Excite': { capacity: 50.3 },
  'MG Comet EV': { capacity: 17.3 },
  'Hyundai Kona Electric': { capacity: 39.2 },
  'Mahindra XUV400 EC': { capacity: 34.5 },
  'Mahindra XUV400 EL': { capacity: 39.4 },
  'Citroen eC3': { capacity: 29.2 },
  'BYD Atto 3': { capacity: 60.48 },
  'Kia EV6 GT Line': { capacity: 77.4 },
  'Volvo XC40 Recharge (Single Motor)': { capacity: 69 },
  'BMW iX (xDrive40)': { capacity: 76.6 },
  'Tata Punch EV (Standard Range)': { capacity: 25 },
  'Tata Punch EV (Long Range)': { capacity: 35 },
  'Vayve Mobility Eva': { capacity: 0 },
  'PMV EaS E': { capacity: 0 },
  'Strom Motors R3': { capacity: 0 },
  'BMW i5': { capacity: 0 },
  'BMW i7': { capacity: 0 },
  'BYD Seal (61.44 kWh)': { capacity: 61.44 },
  'BYD Seal (82.56 kWh)': { capacity: 82.56 },
  'Audi e-tron GT': { capacity: 0 },
  'Audi RS e-tron GT': { capacity: 0 },
  'Hyundai Creta Electric': { capacity: 0 },
  'Mahindra BE.05 (Concept)': { capacity: 0 },
  'Mahindra XUV.e9 (Concept)': { capacity: 0 },
  'MG Windsor EV': { capacity: 0 },
  'Tata Curvv EV': { capacity: 0 },
  'Hyundai Ioniq 5 (77.4 kWh)': { capacity: 77.4 },
  'BMW iX1': { capacity: 0 },
  'Kia EV9': { capacity: 0 },
  'Mercedes-Benz EQA': { capacity: 0 },
  'Mini Countryman Electric': { capacity: 0 },
  'Rolls-Royce Spectre': { capacity: 0 },
  'Mercedes-Benz G-Class Electric (EQG)': { capacity: 0 },
  'BYD e6 MPV': { capacity: 71.7 },
  'Ola S1 Pro (Gen 2)': { capacity: 4 },
  'Ather 450X (Gen 3 - 3.7kWh)': { capacity: 3.7 },
  'TVS iQube S': { capacity: 3.04 },
  'Bajaj Chetak Electric (Premium)': { capacity: 3 },
  'Hero Vida V1 Pro': { capacity: 3.94 },
  'Simple One': { capacity: 5 },
  'Ultraviolette F77 Recon': { capacity: 10.3 }
};

const DEFAULT_COST_PER_KWH = 18; // Rupees
const DEFAULT_CHARGER_POWER = 25; // kW (average for mixed public chargers)

const CostEstimator = () => {
  const [selectedModelKey, setSelectedModelKey] = useState(Object.keys(EV_MODELS)[0]);
  const [currentSoc, setCurrentSoc] = useState(20); // Default current State of Charge (%) 
  const [desiredSoc, setDesiredSoc] = useState(80); // Default desired State of Charge (%)
  
  const [estimatedEnergy, setEstimatedEnergy] = useState(0); // kWh
  const [estimatedCost, setEstimatedCost] = useState(0); // Rupees
  const [estimatedTime, setEstimatedTime] = useState(''); // Hours and minutes string

  const selectedEv = useMemo(() => EV_MODELS[selectedModelKey], [selectedModelKey]);

  useEffect(() => {
    if (!selectedEv) return;

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
    const timeHoursDecimal = energyNeeded / DEFAULT_CHARGER_POWER;
    
    const hours = Math.floor(timeHoursDecimal);
    const minutes = Math.round((timeHoursDecimal - hours) * 60);
    
    let timeString = '';
    if (hours > 0) {
      timeString += `${hours} hr `;
    }
    if (minutes > 0 || hours === 0) {
      timeString += `${minutes} min`;
    }
    if (!timeString) timeString = '0 min';

    setEstimatedEnergy(parseFloat(energyNeeded.toFixed(2)));
    setEstimatedCost(parseFloat(cost.toFixed(2)));
    setEstimatedTime(timeString.trim());

  }, [selectedEv, currentSoc, desiredSoc]);

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
        <div className="form-group">
          <label htmlFor="ev-model">Select EV Model:</label>
          <select id="ev-model" value={selectedModelKey} onChange={handleModelChange}>
            {Object.keys(EV_MODELS).map(key => (
              <option key={key} value={key}>{key} ({EV_MODELS[key].capacity} kWh)</option>
            ))}
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
        <p className="estimator-note">
          Estimates are based on an average cost of ₹{DEFAULT_COST_PER_KWH}/kWh and an average charger power of {DEFAULT_CHARGER_POWER}kW. Actual figures may vary.
        </p>
      </div>
    </div>
  );
};

export default CostEstimator; 