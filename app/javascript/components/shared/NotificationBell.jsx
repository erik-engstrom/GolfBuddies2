import React from 'react';
import { useMutation } from '@apollo/client';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { MARK_NOTIFICATION_AS_READ, MARK_ALL_NOTIFICATIONS_AS_READ, CURRENT_USER_WITH_NOTIFICATIONS } from '../../graphql/notifications';

const NotificationBell = ({ currentUser, isOpen, toggleOpen, notificationRef }) => {
  const navigate = useNavigate();
  const unreadNotificationsCount = currentUser?.unreadNotificationsCount || 0;
  const notifications = currentUser?.notifications || [];

  const [markAsRead] = useMutation(MARK_NOTIFICATION_AS_READ, {
    refetchQueries: [{ query: CURRENT_USER_WITH_NOTIFICATIONS }],
    optimisticResponse: (vars) => ({
      markNotificationAsRead: {
        success: true,
        errors: [],
        __typename: 'MarkNotificationAsReadPayload'
      }
    }),
    update: (cache, { variables }) => {
      try {
        const cachedData = cache.readQuery({ query: CURRENT_USER_WITH_NOTIFICATIONS });
        if (cachedData && cachedData.me && variables && variables.id) {
          const updatedNotifications = cachedData.me.notifications.map(notification => {
            if (notification.id === variables.id) {
              return { ...notification, read: true };
            }
            return notification;
          });

          const unreadCount = updatedNotifications.filter(n => !n.read).length;

          cache.writeQuery({
            query: CURRENT_USER_WITH_NOTIFICATIONS,
            data: {
              me: {
                ...cachedData.me,
                notifications: updatedNotifications,
                unreadNotificationsCount: unreadCount
              }
            }
          });
        }
      } catch (err) {
        console.error("Error updating cache:", err);
      }
    }
  });

  const [markAllAsRead] = useMutation(MARK_ALL_NOTIFICATIONS_AS_READ, {
    refetchQueries: [{ query: CURRENT_USER_WITH_NOTIFICATIONS }],
    optimisticResponse: {
      markAllNotificationsAsRead: {
        success: true,
        errors: [],
        __typename: 'MarkAllNotificationsAsReadPayload'
      }
    },
    update: (cache) => {
      try {
        const cachedData = cache.readQuery({ query: CURRENT_USER_WITH_NOTIFICATIONS });
        if (cachedData && cachedData.me) {
          const updatedNotifications = cachedData.me.notifications.map(notification => {
            return { ...notification, read: true };
          });

          cache.writeQuery({
            query: CURRENT_USER_WITH_NOTIFICATIONS,
            data: {
              me: {
                ...cachedData.me,
                notifications: updatedNotifications,
                unreadNotificationsCount: 0
              }
            }
          });
        }
      } catch (err) {
        console.error("Error updating cache:", err);
      }
    },
    onCompleted: () => {
      toggleOpen();
    }
  });

  const handleMarkAsRead = async (notification) => {
    if (!notification || !notification.id) {
      console.error("No notification ID provided");
      return;
    }
    
    try {
      // Optimistically update UI before server response
      // Add a local class to mark as read visually and update state locally
      const notificationElement = document.getElementById(`notification-${notification.id}`);
      if (notificationElement) {
        notificationElement.classList.remove('bg-fairway-50');
        notificationElement.classList.add('bg-white', 'text-gray-600');
      }
      
      // Track where we need to navigate
      let navigationTarget = null;
      
      // Determine where to navigate based on notification type before running the mutation
      if (notification.notifiableType && notification.notifiableId) {
        if (notification.notifiableType === "Comment") {
          // For comment notifications, navigate to the post containing the comment
          const comment = notification.notifiable;
          // Check for both snake_case and camelCase field names for compatibility
          const postId = comment?.postId || comment?.post_id;
          if (comment && postId) {
            navigationTarget = `/?post=${postId}&comment=${notification.notifiableId}`;
          }
        } else if (notification.notifiableType === "Like") {
          const like = notification.notifiable;
          if (like) {
            // Check for both snake_case and camelCase field names for compatibility
            const likeableType = like?.likeableType || like?.likeable_type;
            const likeableId = like?.likeableId || like?.likeable_id;
            
            if (likeableType === "Post") {
              navigationTarget = `/?post=${likeableId}`;
            } else if (likeableType === "Comment") {
              // Find the post containing this comment
              const comment = like.likeable;
              // Check for both snake_case and camelCase field names for compatibility
              const postId = comment?.postId || comment?.post_id;
              if (comment && postId) {
                navigationTarget = `/?post=${postId}&comment=${likeableId}`;
              }
            }
          }
        } else if (notification.notifiableType === "BuddyRequest") {
          navigationTarget = '/profile';
        }
      }
      
      // Execute the mutation - the server will handle validation
      console.log(`Marking notification ${notification.id} as read...`);
      const result = await markAsRead({
        variables: { id: notification.id },
      });
      
      if (!result.data?.markNotificationAsRead?.success) {
        console.error("Server returned error when marking notification as read:", 
          result.data?.markNotificationAsRead?.errors);
        return;
      }
      
      console.log(`Successfully marked notification ${notification.id} as read`);
      
      // After a successful mutation, navigate if needed
      if (navigationTarget) {
        toggleOpen(); // Close the dropdown before navigation
        navigate(navigationTarget);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      // First check if there are any unread notifications to process
      if (unreadNotificationsCount === 0) {
        console.log("No unread notifications to mark as read");
        return;
      }
      
      console.log(`Marking ${unreadNotificationsCount} notifications as read...`);
      
      // Optimistically update UI before server response
      const notificationElements = document.querySelectorAll('.notification-item');
      notificationElements.forEach(el => {
        el.classList.remove('bg-fairway-50');
        el.classList.add('bg-white', 'text-gray-600');
      });
      
      // Add visual feedback that we're processing
      const markAllButton = document.getElementById('mark-all-read-button');
      if (markAllButton) {
        const originalText = markAllButton.innerText;
        markAllButton.innerText = "Processing...";
        markAllButton.disabled = true;
        
        // Restore after processing
        setTimeout(() => {
          if (markAllButton) {
            markAllButton.innerText = originalText;
            markAllButton.disabled = false;
          }
        }, 1500);
      }
      
      // Execute the mutation
      const result = await markAllAsRead();
      
      if (!result.data?.markAllNotificationsAsRead?.success) {
        console.error("Server returned error when marking all notifications as read:", 
          result.data?.markAllNotificationsAsRead?.errors);
        return;
      }
      
      console.log("Successfully marked all notifications as read");
      
      // Close the dropdown after a short delay to allow the user to see the updates
      setTimeout(() => toggleOpen(), 800);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Add debug logging
  console.log('NotificationBell rendering with count:', unreadNotificationsCount);
  
  return (
    <div className="relative" ref={notificationRef}>
      <button 
        onClick={toggleOpen}
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
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-10 py-1 max-h-96 overflow-y-auto">
          <div className="flex justify-between items-center p-3 border-b">
            <h3 className="text-gray-700 font-medium">Notifications</h3>
            {notifications.length > 0 && (
              <button
                id="mark-all-read-button"
                onClick={handleMarkAllAsRead}
                className="text-sm text-fairway-500 hover:text-fairway-700 transition-colors duration-200"
              >
                Mark all as read
              </button>
            )}
          </div>
          
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No notifications
            </div>
          ) : (
            <div>
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  id={`notification-${notification.id}`}
                  className={`notification-item p-3 border-b hover:bg-gray-50 cursor-pointer flex transition-all duration-300 ${
                    !notification.read ? 'bg-fairway-50' : 'bg-white text-gray-600'
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (notification) {
                      handleMarkAsRead(notification);
                    }
                  }}
                >
                  <div className={`mr-2 mt-1 transition-colors ${!notification.read ? 'text-fairway-500' : 'text-gray-400'}`}>
                    {notification.action === 'like' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                      </svg>
                    ) : notification.action === 'comment' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                      </svg>
                    ) : notification.action === 'buddy_request' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm ${notification.read ? 'text-gray-600' : 'text-gray-800 font-medium'}`}>
                      {notification.message}
                    </p>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-gray-500">
                        {format(new Date(notification.createdAt), 'MMM d, h:mm a')}
                      </p>
                      {notification.read && 
                        <span className="text-xs text-gray-500">Read</span>
                      }
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
