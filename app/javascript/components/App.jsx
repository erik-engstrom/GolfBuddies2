import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { CURRENT_USER_QUERY } from '../graphql/queries';

// Import page components
import Login from './auth/Login';
import Signup from './auth/Signup';
import Feed from './feed/Feed';
import NavBar from './shared/NavBar';
import ProfilePage from './profile/ProfilePage';
import UserProfilePage from './profile/UserProfilePage';
import Inbox from './messages/Inbox';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Check if token exists in localStorage
  useEffect(() => {
    const token = localStorage.getItem('golfBuddiesToken');
    console.log("Authentication check - Token exists:", !!token);
    setIsAuthenticated(!!token);
  }, []);
  
  // Query current user info if authenticated
  const { data: userData, refetch: refetchUserData } = useQuery(CURRENT_USER_QUERY, {
    skip: !isAuthenticated,
    fetchPolicy: 'network-only', // Always get fresh data from the server
    pollInterval: 30000 // Refresh every 30 seconds to keep badge counts updated
  });
  
  // Set up a refresh of user data when this component mounts
  useEffect(() => {
    if (isAuthenticated) {
      // Force a refresh of the user data when the app initializes
      refetchUserData();
      
      // Also refresh when the tab becomes visible again
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          refetchUserData();
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [isAuthenticated, refetchUserData]);
  
  const handleLogin = (token) => {
    console.log("Login successful with token", token);
    localStorage.setItem('golfBuddiesToken', token);
    setIsAuthenticated(true);
    window.location.href = '/';
  };
  
  return (
    <div className="min-h-screen bg-fairway-50">
      {isAuthenticated && userData?.me && <NavBar currentUser={userData.me} />}
      <div className="container mx-auto px-4 py-6">
        <Routes>
          <Route path="/login" element={
            isAuthenticated ? <Navigate to="/" /> : <Login onLogin={handleLogin} />
          } />
          
          <Route path="/signup" element={
            isAuthenticated ? <Navigate to="/" /> : <Signup onLogin={handleLogin} />
          } />
          
          <Route path="/" element={
            isAuthenticated ? <Feed currentUser={userData?.me} /> : <Navigate to="/login" />
          } />
          
          <Route path="/profile" element={
            isAuthenticated ? <ProfilePage /> : <Navigate to="/login" />
          } />
          
          <Route path="/users/:id" element={
            isAuthenticated ? <UserProfilePage /> : <Navigate to="/login" />
          } />
          
          <Route path="/messages" element={
            isAuthenticated ? <Inbox currentUser={userData?.me} /> : <Navigate to="/login" />
          } />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </div>
  );
};

export default App;
