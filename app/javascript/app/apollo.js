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
  cache: new InMemoryCache(),
  connectToDevTools: process.env.NODE_ENV === 'development',
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
});

export default client;