// Custom Apollo Link to block redundant message read marking requests
import { ApolloLink, Observable } from '@apollo/client';

// Create a link that blocks specific redundant mutations
export const blockRedundantRequestsLink = new ApolloLink((operation, forward) => {
  // Check if this is an individual message marking operation
  const operationName = operation.operationName;
  const operationType = operation.query.definitions.find(def => def.kind === 'OperationDefinition')?.operation;
  
  // Only intercept mutations with name MarkMessageAsRead
  if (operationType === 'mutation' && operationName === 'MarkMessageAsRead') {
    // Get stack trace to help debug where the call is coming from
    const stack = new Error().stack;
    const stackLines = stack.split('\n').slice(1, 5).join('\n'); // Get a few stack frames
    
    console.log(`🛑 Blocked individual MarkMessageAsRead mutation for messageId: ${operation.variables.messageId}`);
    console.log(`Call originated from: ${stackLines}`);
    
    // Return a dummy result that mimics a successful mutation
    // This prevents app breakage while eliminating the network request
    const messageId = operation.variables.messageId;
    return new Observable(observer => {
      observer.next({
        data: {
          markMessageAsRead: {
            message: {
              id: messageId,
              read: true,
              __typename: 'Message'
            },
            errors: [],
            __typename: 'MarkMessageAsReadPayload'
          }
        }
      });
      observer.complete();
    });
  }
  
  // For all other operations, continue normal execution
  return forward(operation);
});
