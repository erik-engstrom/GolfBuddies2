import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const TopNavbar = ({ currentUser, onLogout }) => {
  const navigate = useNavigate();
  
  if (!currentUser) return null;
  
  return (
    <nav className="bg-fairway-700 text-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
              </svg>
              <span className="text-xl font-bold">Golf Buddies</span>
            </Link>
          </div>
          
          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="hover:text-fairway-300 transition duration-150">
              Feed
            </Link>
            <Link to={`/profile/${currentUser.id}`} className="hover:text-fairway-300 transition duration-150">
              My Profile
            </Link>
            <div className="relative">
              <Link to="/messages" className="hover:text-fairway-300 transition duration-150 flex items-center">
                Messages
                {currentUser.unreadMessagesCount > 0 && (
                  <span className="ml-1 bg-flag-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {currentUser.unreadMessagesCount > 9 ? '9+' : currentUser.unreadMessagesCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
          
          {/* User Menu */}
          <div className="flex items-center">
            <div className="relative group">
              <button className="flex items-center focus:outline-none">
                {currentUser.profilePictureUrl ? (
                  <img 
                    src={currentUser.profilePictureUrl} 
                    alt={currentUser.fullName} 
                    className="h-8 w-8 rounded-full object-cover mr-2"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-fairway-500 flex items-center justify-center mr-2">
                    {currentUser.firstName[0]}{currentUser.lastName[0]}
                  </div>
                )}
                <span className="hidden md:block">{currentUser.fullName}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
                <Link to={`/profile/${currentUser.id}`} className="block px-4 py-2 text-fairway-800 hover:bg-fairway-100">
                  My Profile
                </Link>
                <button 
                  onClick={onLogout} 
                  className="block w-full text-left px-4 py-2 text-fairway-800 hover:bg-fairway-100"
                >
                  Log Out
                </button>
              </div>
            </div>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button className="mobile-menu-button focus:outline-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div className="mobile-menu hidden md:hidden">
        <Link to="/" className="block py-2 px-4 text-sm hover:bg-fairway-600">Feed</Link>
        <Link to={`/profile/${currentUser.id}`} className="block py-2 px-4 text-sm hover:bg-fairway-600">My Profile</Link>
        <Link to="/messages" className="block py-2 px-4 text-sm hover:bg-fairway-600">
          Messages
          {currentUser.unreadMessagesCount > 0 && (
            <span className="ml-1 bg-flag-500 text-white text-xs rounded-full h-5 w-5 inline-flex items-center justify-center">
              {currentUser.unreadMessagesCount}
            </span>
          )}
        </Link>
        <button onClick={onLogout} className="block w-full text-left py-2 px-4 text-sm hover:bg-fairway-600">
          Log Out
        </button>
      </div>
    </nav>
  );
};

export default TopNavbar;
