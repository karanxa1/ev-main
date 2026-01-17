import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Report error to monitoring service (if available)
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: error.toString(),
        fatal: false
      });
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <div className="error-icon">⚠️</div>
            <h2>Oops! Something went wrong</h2>
            <p>We're sorry for the inconvenience. Please try refreshing the page.</p>
            
            {process.env.NODE_ENV === 'development' && (
              <details className="error-details">
                <summary>Error Details (Development)</summary>
                <pre>{this.state.error && this.state.error.toString()}</pre>
                <pre>{this.state.errorInfo.componentStack}</pre>
              </details>
            )}
            
            <div className="error-actions">
              {this.state.retryCount < 3 && (
                <button 
                  onClick={this.handleRetry}
                  className="btn-retry"
                  aria-label="Try again"
                >
                  Try Again
                </button>
              )}
              <button 
                onClick={this.handleReload}
                className="btn-reload"
                aria-label="Reload page"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional component wrapper for hooks
export const ErrorFallback = ({ error, resetError }) => (
  <div className="error-boundary">
    <div className="error-boundary-content">
      <div className="error-icon">⚠️</div>
      <h2>Something went wrong</h2>
      <p>We encountered an unexpected error. Please try again.</p>
      
      {process.env.NODE_ENV === 'development' && error && (
        <details className="error-details">
          <summary>Error Details (Development)</summary>
          <pre>{error.toString()}</pre>
        </details>
      )}
      
      <div className="error-actions">
        <button onClick={resetError} className="btn-retry">
          Try Again
        </button>
        <button onClick={() => window.location.reload()} className="btn-reload">
          Reload Page
        </button>
      </div>
    </div>
  </div>
);

export default ErrorBoundary; 