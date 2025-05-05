import { ApolloClient, InMemoryCache, split, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { createUploadLink } from 'apollo-upload-client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';
import { blockRedundantRequestsLink } from './link/blockRedundantRequests';

// Add custom error link to better handle subscription errors
import { onError } from '@apollo/client/link/error';

// We'll create and export a function to create the client instead of exporting a singleton instance
// This ensures ActionCable is properly initialized before we try to use it

// Use createUploadLink for file upload support
const httpLink = createUploadLink({
  uri: '/graphql',
  credentials: 'same-origin',
  headers: {
    'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
  },
});

// Track reconnection attempts
let reconnectAttempts = 0;
const maxReconnectAttempts = 10;
const baseReconnectDelay = 1000; // 1 second
let reconnectTimer = null;

// Helper to calculate exponential backoff time
const getReconnectDelay = () => {
  const delay = baseReconnectDelay * Math.pow(1.5, reconnectAttempts);
  return Math.min(delay, 30000); // Cap at 30 seconds
};

// Track WebSocket status and share it across components
const updateWebSocketStatus = (status) => {
  try {
    localStorage.setItem('wsStatus', status);
    window.dispatchEvent(new CustomEvent('ws-status-change', { 
      detail: { status } 
    }));
    console.log('WebSocket status updated:', status);
    
    // If connection is successful, reset reconnect attempts
    if (status === 'connected') {
      reconnectAttempts = 0;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    }
  } catch (e) {
    console.error('Error updating WebSocket status:', e);
  }
};

// Schedule a reconnection attempt with exponential backoff
const scheduleReconnect = () => {
  if (reconnectAttempts >= maxReconnectAttempts) {
    console.log('Max reconnection attempts reached, giving up');
    updateWebSocketStatus('failed');
    return;
  }
  
  reconnectAttempts++;
  const delay = getReconnectDelay();
  
  console.log(`Scheduling WebSocket reconnection attempt ${reconnectAttempts} in ${delay/1000} seconds`);
  
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
  }
  
  reconnectTimer = setTimeout(() => {
    console.log('Attempting to reconnect WebSocket...');
    
    // Trigger a client recreation by refreshing the page or by notifying components
    window.dispatchEvent(new CustomEvent('ws-reconnect-attempt', {
      detail: { attempt: reconnectAttempts }
    }));
    
    // Components that listen for this event can recreate their Apollo client
    // or perform other recovery actions
  }, delay);
};

// Create and configure WebSocket connection for ActionCable
const createActionCableLink = () => {
  // Check if ActionCable is available
  if (!window.ActionCable) {
    console.error('ActionCable not found. Loading ActionCable client library...');
    // You might want to dynamically load ActionCable here
  }

  // Get the authentication token
  const token = localStorage.getItem('golfBuddiesToken');
  
  // Create a consumer to connect to the ActionCable server with auth token
  let cable;
  try {
    // Create a URL with the token as a query parameter
    const wsUrl = token ? `/cable?token=${encodeURIComponent(token)}` : '/cable';
    
    // Use existing consumer if available
    if (window.__GOLF_BUDDIES_CABLE_CONSUMER) {
      console.log('Reusing existing ActionCable consumer');
      cable = window.__GOLF_BUDDIES_CABLE_CONSUMER;
    } else {
      console.log('Creating new ActionCable consumer');
      cable = window.ActionCable.createConsumer(wsUrl);
      // Store the consumer globally for future use
      window.__GOLF_BUDDIES_CABLE_CONSUMER = cable;
    }
    
    console.log('ActionCable consumer created successfully with auth token');
    
    // Update WebSocket status
    updateWebSocketStatus('connecting');
  } catch (e) {
    console.error('Error creating ActionCable consumer:', e);
    updateWebSocketStatus('error');
    // Set up reconnection attempt
    scheduleReconnect();
    // Fallback empty implementation
    cable = { subscriptions: { create: () => ({ unsubscribe: () => {} }) } };
  }

  // Track all subscriptions for proper cleanup
  const subscriptions = {};
  
  // Use the already defined updateWebSocketStatus function from above
  // This avoids duplicating the function and causing state conflicts

  // Schedule a reconnection attempt
  function scheduleReconnect() {
    if (reconnectAttempts < maxReconnectAttempts) {
      reconnectAttempts++;
      const delay = getReconnectDelay();
      console.log(`Scheduling reconnect in ${delay}ms (attempt ${reconnectAttempts})`);
      
      reconnectTimer = setTimeout(() => {
        console.log('Attempting to reconnect WebSocket...');
        // Try to recreate the ActionCable link
        createActionCableLink();
      }, delay);
    } else {
      console.error('Max reconnect attempts reached. Giving up on WebSocket connection.');
    }
  }

  // Return a standard Apollo Link
  return {
    request: operation => {
      return new Observable(observer => {
        const channelId = Math.round(Math.random() * 1000000).toString();

        // Get the token for auth
        const token = localStorage.getItem('golfBuddiesToken');
        
        // Log operation info for debugging
        console.log(`Creating subscription ${channelId} for operation:`, 
          operation.operationName || 'unnamed operation');

        // Create the ActionCable subscription
        // Add authorization headers for the connection
        const headers = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        // Setup heartbeat listener
        const heartbeatHandler = () => {
          if (subscriptions[channelId]) {
            try {
              // Send a ping to keep the connection alive
              subscriptions[channelId].perform('ping');
            } catch (e) {
              console.log('Error sending ping to keep subscription alive:', e);
            }
          }
        };
        
        // Listen for heartbeat events
        window.addEventListener('ws-heartbeat', heartbeatHandler);
        
        subscriptions[channelId] = cable.subscriptions.create(
          {
            channel: 'GraphqlChannel',
            // The server doesn't directly use token in params but it helps with debugging
            token: token ? 'present' : 'missing' 
          },
          {
            connected: () => {
              console.log(`Subscription ${channelId} connected`);
              updateWebSocketStatus('connected');
              reconnectAttempts = 0; // Reset on successful connection
              clearTimeout(reconnectTimer); // Clear any existing reconnect timer
              
              // Send the GraphQL query to the server
              subscriptions[channelId].perform('execute', {
                query: operation.query.loc.source.body,
                variables: operation.variables,
                operationName: operation.operationName
              });
            },
            
            received: payload => {
              console.log(`Subscription ${channelId} received:`, payload);
              
              // Forward the result to the observer
              if (payload.result && !payload.more) {
                // This is a regular query/mutation result
                observer.next(payload.result);
                observer.complete();
              } else if (payload.result) {
                // This is a subscription with more updates to come
                observer.next(payload.result);
              }
            },
            
            disconnected: () => {
              console.log(`Subscription ${channelId} disconnected`);
              updateWebSocketStatus('closed');
              
              // Let the app know the subscription was disconnected
              observer.error(new Error('Subscription disconnected'));
            },
            
            rejected: () => {
              console.error(`Subscription ${channelId} rejected`);
              updateWebSocketStatus('rejected');
              
              observer.error(new Error('Subscription rejected'));
            },
            
            ping: () => {
              // Handle ping requests from server
              console.log(`Subscription ${channelId} ping received`);
              
              // Respond with a pong if needed
              try {
                subscriptions[channelId].perform('pong');
              } catch (e) {
                console.log('Error sending pong response:', e);
              }
            }
          }
        );

        // Return a cleanup function
        return () => {
          console.log(`Cleaning up subscription ${channelId}`);
          window.removeEventListener('ws-heartbeat', heartbeatHandler);
          if (subscriptions[channelId]) {
            subscriptions[channelId].unsubscribe();
            delete subscriptions[channelId];
          }
        };
      });
    }
  };
};

// Import token refresh link
import tokenRefreshLink from './link/tokenRefreshLink';

// Export a factory function to create and configure the Apollo Client
export function createApolloClient() {
  console.log("Creating Apollo Client...");
  
  // Verify ActionCable is available
  if (!window.ActionCable || typeof window.ActionCable.createConsumer !== 'function') {
    console.error("ActionCable is not properly initialized:", window.ActionCable);
    throw new Error("ActionCable must be initialized before creating Apollo Client");
  }
  
  // Create the ActionCable link
  const wsLink = createActionCableLink();

  // Auth link middleware to add JWT token to requests
  const authLink = setContext((_, { headers }) => {
    // Get the authentication token from local storage if it exists
    const token = localStorage.getItem('golfBuddiesToken');
    
    // Return the headers to the context so httpLink can read them
    return {
      headers: {
        ...headers,
        authorization: token ? `Bearer ${token}` : '',
      }
    };
  });

  // Split link based on operation type (query/mutation vs subscription)
  const splitLink = split(
    ({ query }) => {
      const definition = getMainDefinition(query);
      const isSubscription = (
        definition.kind === 'OperationDefinition' &&
        definition.operation === 'subscription'
      );
      
      if (isSubscription) {
        console.log('Detected subscription operation, using ActionCable link');
      }
      
      return isSubscription;
    },
    wsLink,
    authLink.concat(httpLink)
  );

  // Create the combined link chain
  const combinedLink = from([
    // First check if we need to block the request
    blockRedundantRequestsLink,
    // Handle token expiration and refresh
    tokenRefreshLink,
    // Then go through the normal splitting logic
    splitLink
  ]);

  // Listen for websocket reconnect events
  window.addEventListener('ws-reconnect-needed', () => {
    console.log('WebSocket reconnect requested, creating new ActionCable consumer');
    
    // Force reconnect by creating a new client and updating cache
    setTimeout(() => {
      // This will trigger a page reload only in extreme cases
      window.location.reload();
    }, 100);
  });

  // Create Apollo Client instance
  const client = new ApolloClient({
    link: combinedLink,
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'cache-and-network',
        errorPolicy: 'all',
      },
      query: {
        fetchPolicy: 'cache-and-network',
        errorPolicy: 'all',
      },
      mutate: {
        errorPolicy: 'all',
      },
      subscription: {
        errorPolicy: 'all',
      }
    },
    assumeImmutableResults: false, // More tolerant of cache conflicts
  });

  console.log("Apollo client successfully initialized", client);
  
  return client;
}

// For backwards compatibility with existing imports
let defaultClient = null;

// Create a fallback getter for modules that import client directly
export default {
  get default() {
    if (!defaultClient) {
      console.warn("Client being accessed directly. This may cause initialization issues.");
      try {
        defaultClient = createApolloClient();
      } catch (e) {
        console.error("Failed to create Apollo client on demand:", e);
        throw e;
      }
    }
    return defaultClient;
  }
};
