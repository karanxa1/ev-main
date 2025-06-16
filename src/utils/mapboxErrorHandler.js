// Mapbox GL Error Handler
// This utility helps suppress known Mapbox GL fog-related errors

let errorHandlerInitialized = false;

export const initializeMapboxErrorHandler = () => {
  if (errorHandlerInitialized) return;

  // Suppress console errors related to Mapbox fog
  const originalConsoleError = console.error;
  console.error = (...args) => {
    const message = args.join(' ');
    
    // Suppress known Mapbox fog-related errors
    if (
      message.includes('Cannot read properties of undefined (reading \'get\')') ||
      message.includes('_queryFogOpacity') ||
      message.includes('getOpacityAtLatLng') ||
      message.includes('fog') && message.includes('opacity')
    ) {
      // Silently ignore these errors
      return;
    }
    
    // Log other errors normally
    originalConsoleError.apply(console, args);
  };

  // Handle window errors
  const originalWindowError = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    if (
      typeof message === 'string' && (
        message.includes('Cannot read properties of undefined (reading \'get\')') ||
        message.includes('_queryFogOpacity') ||
        message.includes('getOpacityAtLatLng')
      )
    ) {
      // Suppress these errors
      return true;
    }
    
    // Handle other errors normally
    if (originalWindowError) {
      return originalWindowError(message, source, lineno, colno, error);
    }
    return false;
  };

  // Handle unhandled promise rejections
  const originalUnhandledRejection = window.onunhandledrejection;
  window.onunhandledrejection = (event) => {
    const message = event.reason?.message || event.reason?.toString() || '';
    
    if (
      message.includes('Cannot read properties of undefined (reading \'get\')') ||
      message.includes('_queryFogOpacity') ||
      message.includes('getOpacityAtLatLng')
    ) {
      // Prevent the error from being logged
      event.preventDefault();
      return;
    }
    
    // Handle other rejections normally
    if (originalUnhandledRejection) {
      return originalUnhandledRejection(event);
    }
  };

  errorHandlerInitialized = true;
};

export const cleanupMapboxErrorHandler = () => {
  // This could be used to restore original error handlers if needed
  errorHandlerInitialized = false;
};

// Auto-initialize when module is imported
if (typeof window !== 'undefined') {
  initializeMapboxErrorHandler();
} 