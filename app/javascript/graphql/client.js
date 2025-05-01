import { ApolloClient, InMemoryCache, split, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { createUploadLink } from 'apollo-upload-client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';
import { blockRedundantRequestsLink } from './link/blockRedundantRequests';

// Use createUploadLink for file upload support
const httpLink = createUploadLink({
  uri: '/graphql',
  credentials: 'same-origin',
  headers: {
    'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
  },
});

// WebSocket link for GraphQL subscriptions
const wsLink = new GraphQLWsLink(
  createClient({
    url: `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/cable`,
    connectionParams: () => {
      const token = localStorage.getItem('golfBuddiesToken');
      return {
        Authorization: token ? `Bearer ${token}` : '',
      };
    },
    retryAttempts: 5,
    shouldRetry: () => true,
    lazy: true, // Only connect when needed
  })
);

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
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  authLink.concat(httpLink)
);

// Create the combined link chain with the blocking link first
const combinedLink = from([
  // First check if we need to block the request
  blockRedundantRequestsLink,
  // Then go through the normal splitting logic
  splitLink
]);

// Create Apollo Client instance
const client = new ApolloClient({
  link: combinedLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});

console.log("Apollo client initialized", client);

export default client;
