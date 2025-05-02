import React, { useState, useEffect, useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { CURRENT_USER_WITH_NOTIFICATIONS } from '../graphql/notifications';
import { CurrentUserProvider, CurrentUserContext } from '../app/CurrentUserContext';

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
  
  // The CurrentUserContext will handle refreshing the user data
  
  const handleLogin = (token) => {
    console.log("Login successful with token", token);
    localStorage.setItem('golfBuddiesToken', token);
    setIsAuthenticated(true);
    window.location.href = '/';
  };
  
  const AppContent = () => {
    const { currentUser, loading } = useContext(CurrentUserContext);
    
    if (isAuthenticated && loading) {
      return (
        <div className="min-h-screen bg-fairway-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-fairway-600"></div>
        </div>
      );
    }
    
    return (
      <div className="min-h-screen bg-fairway-50">
        {isAuthenticated && currentUser && <NavBar currentUser={currentUser} />}
        <div className="container mx-auto px-4 py-6">
          <Routes>
            <Route path="/login" element={
              isAuthenticated ? <Navigate to="/" /> : <Login onLogin={handleLogin} />
            } />
            
            <Route path="/signup" element={
              isAuthenticated ? <Navigate to="/" /> : <Signup onLogin={handleLogin} />
            } />
            
            <Route path="/" element={
              isAuthenticated ? <Feed /> : <Navigate to="/login" />
            } />
            
            <Route path="/profile" element={
              isAuthenticated ? <ProfilePage /> : <Navigate to="/login" />
            } />
            
            <Route path="/users/:id" element={
              isAuthenticated ? <UserProfilePage /> : <Navigate to="/login" />
            } />
            
            <Route path="/messages" element={
              isAuthenticated ? <Inbox /> : <Navigate to="/login" />
            } />
            
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </div>
    );
  };
  
  return (
    <CurrentUserProvider>
      <AppContent />
    </CurrentUserProvider>
  );
};

export default App;
