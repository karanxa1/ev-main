// Utility functions for formatting data in Indian context

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(amount);
};

export const formatDate = (date) => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Format in Indian date style (DD/MM/YYYY)
  return dateObj.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export const getIndianTimeZoneTime = (date) => {
  const options = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata'
  };
  
  return new Date(date).toLocaleTimeString('en-IN', options);
};

// Common Indian cities with their coordinates
export const indianCities = {
  mumbai: { lat: 19.0760, lng: 72.8777 },
  delhi: { lat: 28.6139, lng: 77.2090 },
  bangalore: { lat: 12.9716, lng: 77.5946 },
  hyderabad: { lat: 17.3850, lng: 78.4867 },
  chennai: { lat: 13.0827, lng: 80.2707 },
  kolkata: { lat: 22.5726, lng: 88.3639 },
  pune: { lat: 18.5204, lng: 73.8567 },
  ahmedabad: { lat: 23.0225, lng: 72.5714 }
};
