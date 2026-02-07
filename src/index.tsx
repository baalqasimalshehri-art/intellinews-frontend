
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

console.log('Starting IntelliNews...');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Root element not found!');
  throw new Error("Could not find root element to mount to");
}

console.log('Root element found, rendering app...');

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log('App rendered successfully');
} catch (error) {
  console.error('Error rendering app:', error);
  // Fallback: show error on page
  rootElement.innerHTML = `
    <div style="padding: 20px; color: red;">
      <h1>Error loading IntelliNews</h1>
      <pre>${error}</pre>
    </div>
  `;
}
