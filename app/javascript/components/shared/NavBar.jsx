import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApolloClient, useMutation } from '@apollo/client';
import { LOGOUT_MUTATION } from '../../graphql/mutations';
import UserSearch from './UserSearch';

const NavBar = ({ currentUser }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const client = useApolloClient();
  const navigate = useNavigate();
  
  // Create refs for dropdown containers
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);

  // Handle clicking outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close profile dropdown if clicking outside
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      
      // Close notifications dropdown if clicking outside
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };

    // Add event listener when dropdowns are open
    if (dropdownOpen || notificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    // Clean up event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen, notificationsOpen]);

  const [logout] = useMutation(LOGOUT_MUTATION, {
    onCompleted: () => {
      // Clear the auth token from localStorage
      localStorage.removeItem('golfBuddiesToken');
      
      // Reset Apollo Client store
      client.resetStore();
      
      // Redirect to login page
      navigate('/login');
    },
    onError: (error) => {
      console.error('Logout error:', error);
      // Even if the server call fails, we want to log out the user on the client side
      localStorage.removeItem('golfBuddiesToken');
      client.resetStore();
      navigate('/login');
    }
  });

  const handleLogout = () => {
    logout();
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
    if (notificationsOpen) setNotificationsOpen(false);
  };

  const toggleNotifications = () => {
    setNotificationsOpen(!notificationsOpen);
    if (dropdownOpen) setDropdownOpen(false);
  };

  // Sample notifications - you would fetch these from your backend
  const notifications = [
    { id: 1, text: 'John Smith liked your post', isRead: false },
    { id: 2, text: 'New buddy request from Sarah Jones', isRead: false },
    { id: 3, text: 'Upcoming tee time tomorrow at 9:00 AM', isRead: true }
  ];

  const unreadMessagesCount = currentUser?.unreadMessagesCount || 0;
  const unreadNotificationsCount = notifications.filter(n => !n.isRead).length;

  return (
    <nav className="bg-fairway-700 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center">
              <img 
                className="h-8 w-8 mr-2" 
                src="/icon.svg" 
                alt="Golf Buddies Logo" 
              />
              <span className="text-xl font-bold">Golf Buddies</span>
            </Link>
          </div>

          {currentUser && (
            <div className="flex items-center">
              {/* User Search Component */}
              <UserSearch />
              
              {/* Messages */}
              <Link 
                to="/messages" 
                className="relative p-2 rounded-full hover:bg-fairway-600 mx-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                {unreadMessagesCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-flag-600 rounded-full">
                    {unreadMessagesCount}
                  </span>
                )}
              </Link>

              {/* Notifications */}
              <div className="relative" ref={notificationRef}>
                <button 
                  onClick={toggleNotifications}
                  className="relative p-2 rounded-full hover:bg-fairway-600 mx-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-flag-600 rounded-full">
                      {unreadNotificationsCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {notificationsOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                    <div className="py-1">
                      <div className="px-4 py-2 border-b border-gray-200">
                        <h3 className="text-fairway-800 font-medium">Notifications</h3>
                      </div>
                      {notifications.length > 0 ? (
                        <div className="max-h-96 overflow-y-auto">
                          {notifications.map(notification => (
                            <div 
                              key={notification.id} 
                              className={`px-4 py-3 hover:bg-gray-100 border-b border-gray-100 ${notification.isRead ? 'bg-white' : 'bg-fairway-50'}`}
                            >
                              <p className="text-sm text-gray-700">{notification.text}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="px-4 py-3 text-center text-gray-500">
                          No notifications
                        </div>
                      )}
                      <div className="border-t border-gray-100 px-4 py-2">
                        <button className="text-sm text-fairway-600 hover:text-fairway-800 font-medium">
                          View all notifications
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Profile Dropdown */}
              <div className="relative ml-3" ref={dropdownRef}>
                <button
                  onClick={toggleDropdown}
                  className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-fairway-600 focus:ring-white"
                >
                  {currentUser.profilePictureUrl ? (
                    <img
                      className="h-8 w-8 rounded-full"
                      src={currentUser.profilePictureUrl}
                      alt={currentUser.fullName}
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center">
                      <span className="text-fairway-800 font-semibold">
                        {currentUser.fullName.charAt(0)}
                      </span>
                    </div>
                  )}
                </button>

                {dropdownOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                    <div className="block px-4 py-2 text-xs text-gray-400">
                      Signed in as
                    </div>
                    <div className="block px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
                      {currentUser.fullName}
                    </div>
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Your Profile
                    </Link>
                    <Link
                      to="/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-flag-700 hover:bg-gray-100"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
