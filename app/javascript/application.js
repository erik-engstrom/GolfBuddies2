// Entry point for the build script in your package.json
import "@hotwired/turbo-rails"
import "./controllers"

// Import ActionCable to support WebSocket subscriptions
import { createConsumer } from "@rails/actioncable"

// Make sure ActionCable is available globally BEFORE any other module tries to use it
window.ActionCable = { createConsumer };
console.log("ActionCable initialized:", window.ActionCable);

// Setup global WebSocket reconnection mechanism
window.golfBuddiesWsReconnect = () => {
  console.log('Attempting global WebSocket reconnection...');
  
  // First, try to refresh existing WebSocket connections
  try {
    window.dispatchEvent(new CustomEvent('ws-reconnect-attempt', {
      detail: { global: true }
    }));
  } catch (e) {
    console.error('Error dispatching reconnection event:', e);
  }
  
  // If we have an existing ActionCable consumer, disconnect it
  if (window.__GOLF_BUDDIES_CABLE_CONSUMER) {
    try {
      console.log('Disconnecting existing ActionCable consumer');
      window.__GOLF_BUDDIES_CABLE_CONSUMER.disconnect();
      window.__GOLF_BUDDIES_CABLE_CONSUMER = null;
    } catch (e) {
      console.error('Error disconnecting ActionCable consumer:', e);
    }
  }
  
  return true;
};

// Listen for WebSocket errors and attempt reconnection
window.addEventListener('ws-status-change', (event) => {
  if (event.detail?.status === 'error' || event.detail?.status === 'closed') {
    console.log('WebSocket error detected, will attempt reconnection');
    
    // Wait a moment before trying to reconnect to avoid immediate failure
    setTimeout(() => window.golfBuddiesWsReconnect(), 1000);
  }
});

// React and Apollo Client setup - importing the factory function instead of the client directly
// This ensures ActionCable is available before GraphQL client initialization
import React from 'react';
import { createRoot } from 'react-dom/client';
import { ApolloProvider } from '@apollo/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { createApolloClient } from './graphql/client';
import App from './components/App';

// Import notification testing utility in development
if (process.env.NODE_ENV === 'development') {
  // Initialize the Apollo client after ActionCable is available
  const client = createApolloClient();
  
  // Make Apollo client available for testing
  window.__APOLLO_CLIENT__ = client;
  
  // Import testing utilities
  Promise.all([
    import('./test_notification'),
    import('./notification_tester')
  ]).then(([testModule]) => {
    if (testModule && testModule.testNotificationSystem) {
      testModule.testNotificationSystem();
    }
  }).catch(err => console.error('Failed to load notification testing utilities:', err));
}

// Wait for DOM to be loaded before rendering React components
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM loaded, looking for #react-root element");
  const rootElement = document.getElementById('react-root');

  if (rootElement) {
    console.log("Found #react-root element, mounting application");
    const root = createRoot(rootElement);

    try {
      // Initialize the Apollo client here to ensure ActionCable is available
      const client = createApolloClient();
      console.log("Apollo client initialized for React rendering");
      
      // Render the App component with Apollo and Router providers
      root.render(
        <ApolloProvider client={client}>
          <Router>
            <App />
          </Router>
        </ApolloProvider>
      );
      console.log("App component mounted successfully");
    } catch (error) {
      console.error("Error rendering React application:", error);
    }
  } else {
    console.error("Cannot find #react-root element to mount React application");
  }
});
