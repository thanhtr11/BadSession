import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: '#f5f7fa',
          flexDirection: 'column',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            maxWidth: '600px',
            textAlign: 'center'
          }}>
            <h1 style={{ color: '#e74c3c', marginBottom: '20px' }}>⚠️ Application Error</h1>
            <p style={{ marginBottom: '20px', color: '#2c3e50' }}>
              Something went wrong. Please check the console for details.
            </p>
            {this.state.error && (
              <details style={{ textAlign: 'left', marginBottom: '20px', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '4px' }}>
                <summary style={{ cursor: 'pointer', color: '#17a2b8', fontWeight: 'bold' }}>Error Details</summary>
                <pre style={{ marginTop: '10px', fontSize: '12px', overflow: 'auto', maxHeight: '200px' }}>
                  {this.state.error.toString()}
                  {'\n'}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            <button 
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 20px',
                backgroundColor: '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
