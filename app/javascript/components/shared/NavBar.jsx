import React, { useState, useEffect, useRef, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApolloClient, useMutation } from '@apollo/client';
import { LOGOUT_MUTATION } from '../../graphql/mutations';
import { CURRENT_USER_WITH_NOTIFICATIONS } from '../../graphql/notifications';
import { CurrentUserContext } from '../../app/CurrentUserContext';
import UserSearch from './UserSearch';
import NotificationBell from './NotificationBell';
import { useMessageReadListener } from '../../hooks/useMessageReadListener';
import MessageSubscription from '../MessageSubscription';

const NavBar = () => {
  const { currentUser } = useContext(CurrentUserContext);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const client = useApolloClient();
  const navigate = useNavigate();
  
  // Use the message read listener hook instead of implementing event listeners directly
  const { unreadCount: unreadMessagesCount, wsStatus } = useMessageReadListener(
    currentUser?.unreadMessagesCount || 0,
    // Add a refresh callback to force refetch current user when messages are read
    (detail) => {
      console.log('NavBar refreshing user data due to message read event with detail:', detail);
      
      // If we have full data already in the event detail, we can update immediately
      if (detail && detail.byBuddy) {
        console.log('Using provided data to update unread counts');
        // Update the cache directly with the new counts
        try {
          const userData = client.readQuery({ query: CURRENT_USER_WITH_NOTIFICATIONS });
          if (userData?.me) {
            client.writeQuery({
              query: CURRENT_USER_WITH_NOTIFICATIONS,
              data: {
                me: {
                  ...userData.me,
                  unreadMessagesCount: detail.totalCount,
                  unreadMessagesCountByBuddy: detail.byBuddy
                }
              }
            });
          }
        } catch (err) {
          console.error('Error updating cache with new counts:', err);
        }
      } else {
        // Otherwise, make a network request to get the latest data
        client.query({
          query: CURRENT_USER_WITH_NOTIFICATIONS,
          fetchPolicy: 'network-only'
        });
      }
    }
  );
  
  // Create refs for dropdown containers
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);
  
  // Track if component is mounted - helps prevent updates after unmount
  const isMounted = useRef(true);
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Watch for changes to currentUser.unreadMessagesCount and sync with our local state
  useEffect(() => {
    if (currentUser?.unreadMessagesCount !== undefined && isMounted.current) {
      console.log('NavBar detected currentUser.unreadMessagesCount changed:', currentUser.unreadMessagesCount);
      
      // Calculate the correct count from the per-buddy counts (source of truth)
      let calculatedTotal = 0;
      if (currentUser.unreadMessagesCountByBuddy) {
        calculatedTotal = Object.values(currentUser.unreadMessagesCountByBuddy).reduce(
          (sum, count) => sum + count, 
          0
        );
      }
      
      // Use the calculated total for consistency
      if (calculatedTotal !== unreadMessagesCount) {
        console.log('Syncing unread count from currentUser:', {
          current: unreadMessagesCount,
          new: calculatedTotal,
          countByBuddy: currentUser.unreadMessagesCountByBuddy
        });
        
        // Update the UI
        window.dispatchEvent(new CustomEvent('message-read', { 
          detail: { 
            totalCount: calculatedTotal,
            byBuddy: currentUser.unreadMessagesCountByBuddy,
            source: 'currentUser-changed'
          } 
        }));
      }
    }
  }, [currentUser?.unreadMessagesCount, currentUser?.unreadMessagesCountByBuddy]);

  // Log when unread count or WebSocket status changes for debugging
  useEffect(() => {
    console.log('NavBar unread messages count updated:', unreadMessagesCount);

    // Check if the unread count matches the server's data
    // This helps ensure our UI is in sync with the actual server state
    if (unreadMessagesCount !== undefined && currentUser?.unreadMessagesCount !== undefined) {
      if (unreadMessagesCount !== currentUser.unreadMessagesCount) {
        console.warn('Unread message count mismatch detected:', {
          hookCount: unreadMessagesCount,
          serverCount: currentUser.unreadMessagesCount,
          countByBuddy: currentUser.unreadMessagesCountByBuddy
        });
        
        // Calculate the correct count from the per-buddy counts (source of truth)
        let calculatedTotal = 0;
        if (currentUser.unreadMessagesCountByBuddy) {
          calculatedTotal = Object.values(currentUser.unreadMessagesCountByBuddy).reduce(
            (sum, count) => sum + count, 
            0
          );
        }
        
        // If there's a mismatch between server total count and the calculated count,
        // trigger a full refresh from server to synchronize everything
        if (calculatedTotal !== currentUser.unreadMessagesCount) {
          console.warn('Server total count doesn\'t match calculated count, refreshing:', {
            serverTotal: currentUser.unreadMessagesCount, 
            calculatedTotal
          });
          
          // Trigger a server refresh
          client.query({
            query: CURRENT_USER_WITH_NOTIFICATIONS,
            fetchPolicy: 'network-only'
          }).then(({ data }) => {
            if (data?.me) {
              // Calculate the correct count from fetched data
              const freshCountByBuddy = data.me.unreadMessagesCountByBuddy || {};
              const freshCalculatedTotal = Object.values(freshCountByBuddy).reduce(
                (sum, count) => sum + count, 
                0
              );
              
              console.log('Refreshed unread counts from server:', {
                serverTotal: data.me.unreadMessagesCount,
                calculatedTotal: freshCalculatedTotal
              });
              
              // Force update with the calculated total for consistency
              window.dispatchEvent(new CustomEvent('message-read', { 
                detail: { 
                  totalCount: freshCalculatedTotal,
                  byBuddy: freshCountByBuddy
                } 
              }));
            }
          });
        }
      }
    }
  }, [unreadMessagesCount, currentUser?.unreadMessagesCount]);
  
  // Listen for token refresh events
  useEffect(() => {
    const handleTokenRefresh = (event) => {
      console.log('Token refresh event detected in NavBar component');
      if (event.detail?.success) {
        // Force a refresh of notifications and user data
        client.query({
          query: CURRENT_USER_WITH_NOTIFICATIONS,
          fetchPolicy: 'network-only'
        });
      }
    };
    
    // Add event listener for token refresh events
    window.addEventListener('token-refreshed', handleTokenRefresh);
    
    // Clean up the event listener
    return () => {
      window.removeEventListener('token-refreshed', handleTokenRefresh);
    };
  }, [client]);
  
  useEffect(() => {
    console.log('NavBar WebSocket status updated:', wsStatus);
  }, [wsStatus]);
  
  // Handle messages from subscriptions and WebSocket reconnections
  const handleNewMessage = (message) => {
    console.log('NavBar received message:', message);
    
    if (message && message.type === 'reconnect') {
      console.log('NavBar received reconnection request for subscriptions');
      
      // Show a user-friendly indicator that we're reconnecting
      if (wsStatus !== 'connected') {
        // You could display a toast notification or indicator here
        console.log('Attempting to reconnect WebSocket...');
      }
      
      // Force a refresh of unread counts
      client.query({
        query: CURRENT_USER_WITH_NOTIFICATIONS,
        fetchPolicy: 'network-only'
      });
    } 
    // Handle new incoming message (including unread state updates)
    else if (message && message.receiver && message.receiver.id === currentUser?.id && !message.read) {
      console.log('NavBar detected new incoming message');
      
      // Dispatch a message-read event to update the UI
      const userData = client.readQuery({ query: CURRENT_USER_WITH_NOTIFICATIONS });
      if (userData?.me) {
        // Calculate new counts
        const updatedCountByBuddy = {
          ...userData.me.unreadMessagesCountByBuddy || {}
        };
        
        // Increment the count for this sender
        const senderId = message.sender.id;
        updatedCountByBuddy[senderId] = (updatedCountByBuddy[senderId] || 0) + 1;
        
        // Calculate new total
        const newTotalCount = Object.values(updatedCountByBuddy).reduce((sum, count) => sum + count, 0);
        
        // Dispatch event to update UI
        window.dispatchEvent(new CustomEvent('message-read', { 
          detail: { 
            totalCount: newTotalCount, 
            byBuddy: updatedCountByBuddy 
          } 
        }));
      }
      
      // Also force a refresh from the server
      client.query({
        query: CURRENT_USER_WITH_NOTIFICATIONS,
        fetchPolicy: 'network-only'
      });
    }
  };

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
      
      // Redirect to login page after logout
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
    // First remove the token
    localStorage.removeItem('golfBuddiesToken');
    
    // Reset Apollo Client store
    client.resetStore();
    
    // Execute the logout mutation
    logout();
    
    // Force navigation to login page
    navigate('/login');
    
    // As an additional safety measure, reload the page after a brief delay
    setTimeout(() => {
      window.location.href = '/login';
    }, 100);
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
    if (notificationsOpen) setNotificationsOpen(false);
  };

  const toggleNotifications = () => {
    setNotificationsOpen(!notificationsOpen);
    if (dropdownOpen) setDropdownOpen(false);
  };

  // Use values from hook and context for notifications
  const unreadNotificationsCount = currentUser?.unreadNotificationsCount || 0;
  const notifications = currentUser?.notifications || [];

  return (
    <nav className="bg-fairway-700 text-white shadow-md">
      {/* Add the subscription component for real-time updates */}
      {currentUser && (
        <MessageSubscription 
          userId={currentUser.id}
          onNewMessage={handleNewMessage} 
        />
      )}
      
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
                onClick={() => {
                  // When clicking messages, log current state for debugging
                  console.log('Current message state:', {
                    unreadMessagesCount,
                    fromContext: currentUser?.unreadMessagesCount,
                    countByBuddy: currentUser?.unreadMessagesCountByBuddy
                  });
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                {unreadMessagesCount > 0 ? (
                  <span 
                    key={`unread-count-${unreadMessagesCount}`}
                    className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-flag-600 rounded-full"
                  >
                    {unreadMessagesCount}
                  </span>
                ) : null}
              </Link>

              {/* Notifications */}
              <NotificationBell
                currentUser={currentUser}
                isOpen={notificationsOpen}
                toggleOpen={toggleNotifications}
                notificationRef={notificationRef}
              />
              
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
