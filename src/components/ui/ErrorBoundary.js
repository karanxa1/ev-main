import React from 'react';

// Error reporting service (placeholder)
const logErrorToService = (error, errorInfo, userAgent, url) => {
  // In a real app, this would send to Sentry, LogRocket, etc.
  if (process.env.NODE_ENV === 'production') {
    console.log('Error would be sent to monitoring service:', {
      error: error.toString(),
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      userAgent,
      url,
      timestamp: new Date().toISOString()
    });
  }
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { 
      hasError: true,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Log error to monitoring service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Enhanced error reporting
    logErrorToService(
      error, 
      errorInfo, 
      navigator.userAgent,
      window.location.href
    );
    
    // Track error frequency
    const errorKey = `error_${error.name}_${error.message}`;
    const errorCount = parseInt(localStorage.getItem(errorKey) || '0') + 1;
    localStorage.setItem(errorKey, errorCount.toString());
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

  handleReportIssue = () => {
    const { error, errorInfo, errorId } = this.state;
    const issueData = {
      errorId,
      error: error?.toString(),
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    };
    
    // In a real app, this would open a support ticket or feedback form
    console.log('Issue report data:', issueData);
    alert('Error report has been logged. Our team will investigate this issue.');
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, errorId, retryCount } = this.state;
      const maxRetries = 3;
      
      return (
        <div className="error-boundary" role="alert">
          <div className="error-boundary-content">
            <div className="error-icon" aria-hidden="true">⚠️</div>
            <h2>Oops! Something went wrong</h2>
            <p>We're sorry for the inconvenience. The application encountered an unexpected error.</p>
            
            {retryCount > 0 && (
              <p className="retry-info">
                Retry attempts: {retryCount}/{maxRetries}
              </p>
            )}
            
            {process.env.NODE_ENV === 'development' && error && (
              <details className="error-details">
                <summary>Error Details (Development)</summary>
                <div className="error-info">
                  <p><strong>Error ID:</strong> {errorId}</p>
                  <p><strong>Error Type:</strong> {error.name}</p>
                  <p><strong>Message:</strong> {error.message}</p>
                </div>
                <pre className="error-stack">
                  <strong>Stack Trace:</strong>
                  {error.stack}
                  
                  <strong>Component Stack:</strong>
                  {errorInfo?.componentStack}
                </pre>
              </details>
            )}
            
            <div className="error-actions">
              {retryCount < maxRetries ? (
                <button 
                  className="btn-retry primary" 
                  onClick={this.handleRetry}
                  aria-label="Try to recover from the error"
                >
                  Try Again
                </button>
              ) : (
                <p className="max-retries-message">
                  Maximum retry attempts reached. Please reload the page.
                </p>
              )}
              
              <button 
                className="btn-reload" 
                onClick={this.handleReload}
                aria-label="Reload the entire page"
              >
                Reload Page
              </button>
              
              <button 
                className="btn-report" 
                onClick={this.handleReportIssue}
                aria-label="Report this issue to support"
              >
                Report Issue
              </button>
            </div>
            
            <div className="error-help">
              <p>If this problem persists, please:</p>
              <ul>
                <li>Check your internet connection</li>
                <li>Clear your browser cache</li>
                <li>Try using a different browser</li>
                <li>Contact support if the issue continues</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 