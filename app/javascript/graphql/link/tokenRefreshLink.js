import { onError } from '@apollo/client/link/error';
import { fromPromise } from '@apollo/client';
import { refreshToken } from '../refreshToken';

// This link handles token expiration errors from the GraphQL API
const tokenRefreshLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  // Skip token refresh for operations that are themselves trying to refresh the token
  const context = operation.getContext();
  if (context.skipTokenRefresh) {
    console.log('Skipping token refresh for this operation');
    return;
  }
  
  // Check if this is a refresh token operation by operation name
  const operationName = operation.operationName;
  if (operationName === 'RefreshToken') {
    console.log('Skipping token refresh for RefreshToken operation');
    return;
  }
  
  if (graphQLErrors) {
    for (const err of graphQLErrors) {
      // Check for token expiration errors
      const isExpiredTokenError = (
        (err.extensions?.code === 'UNAUTHENTICATED' || 
         err.message?.includes('token expired') ||
         err.message?.includes('not authenticated') ||
         err.extensions?.token_expired === true)
      );
      
      if (isExpiredTokenError) {
        console.log('Token expired error detected, attempting refresh...');
        
        // Return a new observable that will refresh token and retry
        return fromPromise(
          refreshToken()
            .then(success => {
              // If token refresh succeeded
              if (success) {
                console.log('Token refresh successful, retrying original request');
                
                // Get the token from localStorage
                const token = localStorage.getItem('golfBuddiesToken');
                
                // Modify the operation context with new token
                const oldHeaders = operation.getContext().headers || {};
                operation.setContext({
                  headers: {
                    ...oldHeaders,
                    authorization: token ? `Bearer ${token}` : ''
                  }
                });
                
                // Retry the operation with new token
                return true;
              } else {
                // If token refresh failed, we should redirect to login
                console.log('Token refresh failed, redirecting to login page');
                localStorage.removeItem('golfBuddiesToken');
                window.location.href = '/login';
                return false;
              }
            })
        ).flatMap(() => {
          // Retry the operation with new token
          return forward(operation);
        });
      }
    }
  }
  
  // For network errors that might be related to authentication
  if (networkError && networkError.statusCode === 401) {
    console.log('Network error 401 detected, attempting token refresh...');
    
    // Return a new observable that will refresh token and retry
    return fromPromise(
      refreshToken()
        .then(success => {
          if (success) {
            // If token refresh succeeded, retry the operation
            return true;
          } else {
            // If token refresh failed, redirect to login
            localStorage.removeItem('golfBuddiesToken');
            window.location.href = '/login';
            return false;
          }
        })
    ).flatMap(() => {
      // Retry the operation
      return forward(operation);
    });
  }
});

export default tokenRefreshLink;
