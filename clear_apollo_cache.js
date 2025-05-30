// Clear Apollo Client cache for debugging
// Run this in the browser console on the Golf Buddies app

// Function to clear Apollo cache
function clearApolloCache() {
  // Try to find Apollo Client instance
  if (window.__APOLLO_CLIENT__) {
    console.log('Found Apollo Client, clearing cache...');
    window.__APOLLO_CLIENT__.clearStore();
    console.log('Apollo cache cleared');
    return true;
  }
  
  // Check for React DevTools Apollo
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    const instances = window.__REACT_DEVTOOLS_GLOBAL_HOOK__.getFiberRoots(1);
    for (let instance of instances) {
      const apolloClient = findApolloClientInFiber(instance.current);
      if (apolloClient) {
        console.log('Found Apollo Client via React DevTools, clearing cache...');
        apolloClient.clearStore();
        console.log('Apollo cache cleared');
        return true;
      }
    }
  }
  
  console.log('Apollo Client not found');
  return false;
}

// Helper function to find Apollo Client in React fiber tree
function findApolloClientInFiber(fiber) {
  if (!fiber) return null;
  
  // Check if this fiber has Apollo Client in context
  if (fiber.memoizedState && fiber.memoizedState.baseState && fiber.memoizedState.baseState.client) {
    return fiber.memoizedState.baseState.client;
  }
  
  // Check context
  if (fiber.dependencies && fiber.dependencies.firstContext) {
    let context = fiber.dependencies.firstContext;
    while (context) {
      if (context.context && context.context._currentValue && context.context._currentValue.client) {
        return context.context._currentValue.client;
      }
      context = context.next;
    }
  }
  
  // Recursively check children
  let child = fiber.child;
  while (child) {
    const result = findApolloClientInFiber(child);
    if (result) return result;
    child = child.sibling;
  }
  
  return null;
}

// Clear local storage and session storage as well
function clearAllStorage() {
  localStorage.clear();
  sessionStorage.clear();
  console.log('Local and session storage cleared');
}

// Main function
function clearEverything() {
  clearApolloCache();
  clearAllStorage();
  console.log('All caches cleared. Refreshing page...');
  window.location.reload();
}

// Run the clearing function
clearEverything();
