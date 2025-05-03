/**
 * Utility functions for safely handling potentially undefined or non-array values
 */

// Safely map over a collection, handling cases where the input might not be an array
export const safeMap = (collection, mapFn, fallback = []) => {
  // Check if collection exists and is an array
  if (!collection) {
    console.warn('Collection is undefined or null in safeMap');
    return fallback;
  }
  
  if (!Array.isArray(collection)) {
    console.warn('Expected an array but received:', typeof collection, collection);
    return fallback;
  }
  
  return collection.map(mapFn);
};

// Safe rendering of station lists with error boundary
export const renderStationsList = (stations, renderFn) => {
  try {
    return safeMap(stations, renderFn);
  } catch (error) {
    console.error('Error rendering stations list:', error);
    return null;
  }
};

// Ensure a value is always an array
export const ensureArray = (possibleArray) => {
  if (possibleArray === null || possibleArray === undefined) {
    return [];
  }
  return Array.isArray(possibleArray) ? possibleArray : [possibleArray];
};
