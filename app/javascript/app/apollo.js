import { ApolloClient, InMemoryCache, createHttpLink, split } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { createUploadLink } from 'apollo-upload-client';

// Create an upload link that supports file uploads
const uploadLink = createUploadLink({
  uri: '/graphql',
});

// Add auth headers to graphql requests
const authLink = setContext((_, { headers }) => {
  // Get the authentication token from local storage
  const token = localStorage.getItem('golfBuddiesToken');
  
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  };
});

// Create the Apollo Client
const client = new ApolloClient({
  link: authLink.concat(uploadLink),
  cache: new InMemoryCache({
    typePolicies: {
      Post: {
        fields: {
          imageUrl: {
            // This ensures we always get the latest image URL
            merge: false, // Don't merge, always use the new value
            // Custom read function to handle URLs with caching strategy
            read(imageUrl) {
              return imageUrl; // We're now adding cache-buster on the server
            }
          }
        }
      },
      Query: {
        fields: {
          posts: {
            // For the posts field on the Query type
            merge: false // Don't merge, always use the new value
          }
        }
      }
    }
  }),
  connectToDevTools: process.env.NODE_ENV === 'development',
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'network-only', // Always get fresh data from server
      errorPolicy: 'all',
      nextFetchPolicy: 'network-only', // Keep getting fresh data
    },
    query: {
      fetchPolicy: 'network-only', // Always get fresh data from server
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
      // After mutation, refetch all active queries
      refetchQueries: 'active',
    },
  },
});

export default client;