// Entry point for the build script in your package.json
import "@hotwired/turbo-rails"
import "./controllers"

// React and Apollo Client setup
import React from 'react';
import { createRoot } from 'react-dom/client';
import { ApolloProvider } from '@apollo/client';
import { BrowserRouter as Router } from 'react-router-dom';
import client from './graphql/client';
import App from './components/App';

// Wait for DOM to be loaded before rendering React components
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM loaded, looking for #react-root element");
  const rootElement = document.getElementById('react-root');

  if (rootElement) {
    console.log("Found #react-root element, mounting application");
    const root = createRoot(rootElement);

    try {
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
