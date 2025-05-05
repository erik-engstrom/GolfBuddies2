// Token refresh logic for JWT authentication
import { gql } from '@apollo/client';
import client from './client';

// GraphQL mutation for refreshing the token
const REFRESH_TOKEN_MUTATION = gql`
  mutation RefreshToken {
    refreshToken {
      token
      errors
      tokenExpired
    }
  }
`;

// Set up a timer for token refresh
let refreshTimer = null;

// Calculate when we should refresh the token (e.g., after 23 hours)
const getRefreshTime = () => {
  // Refresh 1 hour before expiration (tokens last 24 hours)
  return 23 * 60 * 60 * 1000;
};

// Function to refresh the token
export const refreshToken = async () => {
  try {
    console.log('Attempting to refresh authentication token');
    const result = await client.default.mutate({
      mutation: REFRESH_TOKEN_MUTATION,
      // Skip the cache for this operation
      fetchPolicy: 'no-cache',
      // Don't update the cache with the result
      update: () => {},
      // Important: Don't use the token refresh link for this operation to avoid infinite loops
      context: {
        skipTokenRefresh: true
      }
    });

    if (result?.data?.refreshToken?.token) {
      const newToken = result.data.refreshToken.token;
      console.log('Token refreshed successfully');
      
      // Store the new token
      localStorage.setItem('golfBuddiesToken', newToken);
      
      // Set up the next refresh
      scheduleTokenRefresh();
      
      // Broadcast a token refresh event that components can listen for
      try {
        window.dispatchEvent(new CustomEvent('token-refreshed', {
          detail: { success: true, timestamp: Date.now() }
        }));
      } catch (e) {
        console.error('Error dispatching token refresh event:', e);
      }
      
      return true;
    } else {
      console.error('Token refresh failed:', result?.data?.refreshToken?.errors || 'Unknown error');
      
      // Dispatch failure event
      try {
        window.dispatchEvent(new CustomEvent('token-refreshed', {
          detail: { success: false, timestamp: Date.now() }
        }));
      } catch (e) {
        console.error('Error dispatching token refresh failure event:', e);
      }
      
      return false;
    }
  } catch (error) {
    console.error('Error refreshing token:', error);
    return false;
  }
};

// Schedule the token refresh
export const scheduleTokenRefresh = () => {
  // Clear any existing timer
  if (refreshTimer) {
    clearTimeout(refreshTimer);
  }
  
  // Set up a new timer
  const refreshTime = getRefreshTime();
  console.log(`Scheduling token refresh in ${refreshTime / (60 * 60 * 1000)} hours`);
  
  refreshTimer = setTimeout(() => {
    refreshToken();
  }, refreshTime);
};

// Initialize token refresh when the app starts
export const initTokenRefresh = () => {
  const token = localStorage.getItem('golfBuddiesToken');
  if (token) {
    console.log('Setting up token refresh schedule');
    scheduleTokenRefresh();
  }
};
