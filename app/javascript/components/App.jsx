import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { CURRENT_USER_QUERY } from '../graphql/queries';

// Import page components
import Login from './auth/Login';
import Signup from './auth/Signup';
import Feed from './feed/Feed';
import NavBar from './shared/NavBar';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Check if token exists in localStorage
  useEffect(() => {
    const token = localStorage.getItem('golfBuddiesToken');
    console.log("Authentication check - Token exists:", !!token);
    setIsAuthenticated(!!token);
  }, []);
  
  // Query current user info if authenticated
  const { data: userData } = useQuery(CURRENT_USER_QUERY, {
    skip: !isAuthenticated
  });
  
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
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </div>
  );
};

export default App;
