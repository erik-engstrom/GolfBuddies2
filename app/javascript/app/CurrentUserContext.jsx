import React, { createContext, useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { CURRENT_USER_WITH_NOTIFICATIONS } from '../graphql/notifications';

// Create the context
export const CurrentUserContext = createContext({
  currentUser: null,
  loading: false,
  error: null,
  refetchCurrentUser: () => {},
});

// Create the provider component
export const CurrentUserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  
  const { loading, error, data, refetch } = useQuery(CURRENT_USER_WITH_NOTIFICATIONS, {
    fetchPolicy: 'network-only',
  });

  // Update the current user whenever the data changes
  useEffect(() => {
    if (data && data.me) {
      setCurrentUser(data.me);
    } else {
      setCurrentUser(null);
    }
  }, [data]);

  // The value that will be given to consumers of this context
  const value = {
    currentUser,
    loading,
    error,
    refetchCurrentUser: refetch,
  };

  return (
    <CurrentUserContext.Provider value={value}>
      {children}
    </CurrentUserContext.Provider>
  );
};
