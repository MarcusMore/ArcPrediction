import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Global error handler to suppress ENS and name resolution errors
window.addEventListener('error', (event) => {
  // Suppress ENS-related and name resolution errors
  const error = event.error || event;
  const errorMessage = error?.message || event.message || '';
  const errorCode = error?.code;
  const errorOperation = error?.operation;
  
  if (
    (errorCode === 'UNSUPPORTED_OPERATION' || errorCode === 'UNCONFIGURED_NAME') &&
    (errorOperation === 'getEnsAddress' || 
     errorMessage.includes('ENS') ||
     errorMessage.includes('network does not support ENS') ||
     errorMessage.includes('unconfigured name'))
  ) {
    event.preventDefault();
    event.stopPropagation();
    console.warn('ENS/Name resolution not supported on Arc Testnet (this is expected and harmless)');
    return false;
  }
}, true); // Use capture phase to catch errors early

// Also catch unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  // Suppress ENS-related and name resolution promise rejections
  const reason = event.reason || {};
  const errorMessage = reason?.message || String(reason) || '';
  const errorCode = reason?.code;
  const errorOperation = reason?.operation;
  
  if (
    (errorCode === 'UNSUPPORTED_OPERATION' || errorCode === 'UNCONFIGURED_NAME') &&
    (errorOperation === 'getEnsAddress' || 
     errorMessage.includes('ENS') ||
     errorMessage.includes('network does not support ENS') ||
     errorMessage.includes('unconfigured name'))
  ) {
    event.preventDefault();
    console.warn('ENS/Name resolution not supported on Arc Testnet (this is expected and harmless)');
    return false;
  }
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
