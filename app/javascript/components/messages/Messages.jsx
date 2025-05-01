import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useApolloClient } from '@apollo/client';
import { GET_BUDDIES, GET_MESSAGES_WITH_USER, CURRENT_USER_QUERY } from '../../graphql/queries';
import { SEND_MESSAGE_MUTATION } from '../../graphql/mutations';
import { MARK_ALL_MESSAGES_AS_READ_MUTATION } from '../../graphql/mutations/markAllMessagesAsRead';
import MessageSubscription from '../MessageSubscription';
import MessageItem from './MessageItem';

const Messages = ({ currentUser }) => {
  const [selectedBuddy, setSelectedBuddy] = useState(null);
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef(null);
  const messagesRefetchTimeout = useRef(null);
  const client = useApolloClient();
  
  // Mutations
  const [sendMessage] = useMutation(SEND_MESSAGE_MUTATION, {
    onCompleted: (data) => {
      console.log('Message sent:', data);
      setMessageText('');
      
      // No need to refetch since the subscription will handle real-time updates
      // and we'll update the cache optimistically below
    },
    onError: (error) => {
      console.error('Error sending message:', error);
    },
    update(cache, { data }) {
      if (data?.sendMessage?.message) {
        try {
          // Get current messages from cache
          const existingData = cache.readQuery({
            query: GET_MESSAGES_WITH_USER,
            variables: { userId: selectedBuddy?.id || '0' }
          });
          
          if (existingData?.messagesWithUser) {
            // Update the cache with the new message
            cache.writeQuery({
              query: GET_MESSAGES_WITH_USER,
              variables: { userId: selectedBuddy?.id || '0' },
              data: {
                messagesWithUser: [...existingData.messagesWithUser, data.sendMessage.message]
              }
            });
          }
        } catch (error) {
          console.error('Error updating cache with new message:', error);
        }
      }
    }
  });
  
  // We've removed the individual message marking system
  // and are only using the markAllMessagesAsRead functionality
  
  const [markAllMessagesAsRead] = useMutation(MARK_ALL_MESSAGES_AS_READ_MUTATION);

  // Ref to track last mark-all request timestamp by buddy ID
  const lastMarkAllRequest = useRef({});
  
  // Custom handler for selecting a buddy that marks all messages as read at once
  const handleSelectBuddy = async (buddy) => {
    // Only send the request if the buddy is changing
    if (selectedBuddy?.id === buddy.id) {
      return;
    }
    
    setSelectedBuddy(buddy);
    
    // Always mark all as read when selecting a buddy
    if (buddy) {
      try {
        // Check if there are unread messages for this buddy
        const unreadCount = getUnreadCountForBuddy(buddy.id);
        
        // Always update the UI optimistically
        updateUnreadCountsInCache(buddy.id, unreadCount);
        
        if (unreadCount > 0) {
          // Check if we recently made this request (custom debounce by buddyId)
          const now = Date.now();
          const lastRequest = lastMarkAllRequest.current[buddy.id] || 0;
          
          // Don't send if it's been less than 5 seconds since last request
          if (now - lastRequest < 5000) {
            console.log(`Skipping markAllMessagesAsRead - throttled (last request: ${new Date(lastRequest).toLocaleTimeString()})`);
            return;
          }
          
          // Track this request time
          lastMarkAllRequest.current[buddy.id] = now;
          
          console.log(`Marking all messages as read for buddy ${buddy.id} (${unreadCount} unread messages)`);
          
          // Actually make the API call
          await markAllMessagesAsRead({ variables: { buddyId: buddy.id } });
          
          // Re-fetch messages and relevant queries to get updated read statuses
          await client.refetchQueries({ 
            include: [GET_MESSAGES_WITH_USER, GET_BUDDIES, CURRENT_USER_QUERY],
            variables: { userId: buddy.id }
          });
        }
      } catch (e) {
        console.error('Failed to mark all messages as read:', e);
      }
    }
  };
  
  // Helper function to update unread counts in Apollo cache
  const updateUnreadCountsInCache = (buddyId, unreadCount) => {
    // First update the CURRENT_USER_QUERY cache which contains the total counts
    const userData = client.readQuery({ query: CURRENT_USER_QUERY });
    
    if (userData?.me) {
      // Update cache immediately for responsive UI
      const updatedCountByBuddy = {
        ...userData.me.unreadMessagesCountByBuddy
      };
      updatedCountByBuddy[buddyId] = 0;
      
      const newTotalCount = Math.max(0, userData.me.unreadMessagesCount - unreadCount);
      
      client.writeQuery({
        query: CURRENT_USER_QUERY,
        data: {
          me: {
            ...userData.me,
            unreadMessagesCount: newTotalCount,
            unreadMessagesCountByBuddy: updatedCountByBuddy
          }
        }
      });
    }
    
    // Also update the GET_BUDDIES cache to ensure the badge count is removed
    try {
      const buddiesData = client.readQuery({ query: GET_BUDDIES });
      
      if (buddiesData?.me) {
        // Update the unreadMessagesCountByBuddy in the GET_BUDDIES cache as well
        const updatedBuddiesCountByBuddy = {
          ...buddiesData.me.unreadMessagesCountByBuddy
        };
        updatedBuddiesCountByBuddy[buddyId] = 0;
        
        client.writeQuery({
          query: GET_BUDDIES,
          data: {
            ...buddiesData,
            me: {
              ...buddiesData.me,
              unreadMessagesCountByBuddy: updatedBuddiesCountByBuddy
            }
          }
        });
        
        console.log(`Updated unread count for buddy ${buddyId} to 0 in cache`);
      }
    } catch (e) {
      console.error('Error updating buddies cache:', e);
    }
  };
  
  // Fetch buddies list
  const { 
    loading: loadingBuddies, 
    error: buddiesError, 
    data: buddiesData 
  } = useQuery(GET_BUDDIES);

  // Helper to get unread count for a buddy from the new backend field
  const getUnreadCountForBuddy = (buddyId) => {
    // Try to get the count from buddiesData first
    if (buddiesData?.me?.unreadMessagesCountByBuddy?.[buddyId] !== undefined) {
      return buddiesData.me.unreadMessagesCountByBuddy[buddyId];
    }
    
    // Fallback to reading directly from cache if needed
    try {
      const userData = client.readQuery({ query: CURRENT_USER_QUERY });
      return userData?.me?.unreadMessagesCountByBuddy?.[buddyId] || 0;
    } catch (e) {
      return 0;
    }
  };
  
  // Fetch messages with selected buddy - no polling since we're using subscriptions
  const { 
    loading: loadingMessages, 
    error: messagesError, 
    data: messagesData,
    refetch: refetchMessages
  } = useQuery(GET_MESSAGES_WITH_USER, {
    variables: { userId: selectedBuddy?.id || '0' },
    skip: !selectedBuddy,
    // No pollInterval - we'll use subscriptions instead for real-time updates
    fetchPolicy: 'cache-and-network',
  });
  
  // Reference to the messages container
  const messagesContainerRef = useRef(null);
  
  // Scroll to bottom of messages when new messages arrive or when switching buddies
  useEffect(() => {
    // Function to scroll to bottom
    const scrollToBottom = () => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        console.log('Scrolling to bottom, height:', messagesContainerRef.current.scrollHeight);
      } else {
        console.log('Messages container ref not available');
      }
    };
    
    // Execute scrolling right away and at intervals
    scrollToBottom();
    
    // Create multiple attempts with different timeouts
    const timers = [];
    for (let i = 0; i < 10; i++) {
      timers.push(setTimeout(scrollToBottom, 100 * (i + 1)));
    }
    
    return () => {
      // Clean up all timeouts
      timers.forEach(timer => clearTimeout(timer));
      // Also clean up the message refetch timeout if it exists
      if (messagesRefetchTimeout.current) {
        clearTimeout(messagesRefetchTimeout.current);
        messagesRefetchTimeout.current = null;
      }
    };
  }, [messagesData, selectedBuddy, loadingMessages]);
  
  // We've removed all the mark-as-read queue functionality
  
  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!messageText.trim() || !selectedBuddy) return;
    
    // Log the buddy information for debugging
    console.log('Sending message to buddy:', selectedBuddy);
    
    sendMessage({
      variables: {
        receiverId: selectedBuddy.id,
        content: messageText
      }
    });
  };
  
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  // Group messages by date
  const groupMessagesByDate = (messages) => {
    if (!messages) return {};
    
    const grouped = {};
    
    messages.forEach(message => {
      const date = formatDate(message.createdAt);
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(message);
    });
    
    return grouped;
  };
  
  const groupedMessages = groupMessagesByDate(messagesData?.messagesWithUser || []);
  
  return (
    <div className="max-w-6xl mx-auto">
      {/* Add subscription component for real-time updates with enhanced debounce */}
      {currentUser && (
        <MessageSubscription 
          userId={currentUser.id} 
          onNewMessage={(newMessage) => {
            // Only refetch if the message is from the currently selected buddy
            // or if it's a message sent to the current user from someone else
            if (selectedBuddy && (
              (newMessage.sender.id === selectedBuddy.id && newMessage.receiver.id === currentUser.id) || 
              (newMessage.sender.id === currentUser.id && newMessage.receiver.id === selectedBuddy.id)
            )) {
              // Use a stronger debounce mechanism
              const now = Date.now();
              const lastDebounceKey = `${newMessage.sender.id}-${newMessage.receiver.id}`;
              const lastRefetch = lastMarkAllRequest.current[lastDebounceKey] || 0;
              
              // Don't refetch if we recently did (within 2 seconds)
              if (now - lastRefetch < 2000) {
                console.log('Skipping message refetch - debounced');
                return;
              }
              
              // Clear any existing timeout
              if (messagesRefetchTimeout.current) {
                clearTimeout(messagesRefetchTimeout.current);
              }
              
              // Set new timeout and track this refetch
              messagesRefetchTimeout.current = setTimeout(() => {
                console.log('Refetching messages after subscription update');
                refetchMessages();
                lastMarkAllRequest.current[lastDebounceKey] = Date.now();
                messagesRefetchTimeout.current = null;
              }, 500); // Increased from 300ms to 500ms
            }
          }} 
        />
      )}
      
      <h1 className="text-2xl font-bold text-fairway-800 mb-6">Messages</h1>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="grid grid-cols-12" style={{ height: "calc(80vh - 100px)" }}>
          {/* Buddies sidebar */}
          <div className="col-span-3 border-r border-gray-200 overflow-y-auto" style={{ height: "100%" }}>
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-bold text-fairway-700">Your Buddies</h2>
            </div>
            
            {loadingBuddies ? (
              <div className="p-4 text-center text-gray-500">Loading buddies...</div>
            ) : buddiesError ? (
              <div className="p-4 text-center text-flag-600">Error loading buddies</div>
            ) : buddiesData?.buddies.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                You don't have any buddies yet. 
                <br />
                Add buddies to start chatting!
              </div>
            ) : (
              <ul>
                {[...buddiesData.buddies] // Create a new array to prevent modifying a frozen array
                  .sort((a, b) => {
                    // Sort buddies with unread messages first
                    if (getUnreadCountForBuddy(a.id) > 0 && getUnreadCountForBuddy(b.id) === 0) return -1;
                    if (getUnreadCountForBuddy(a.id) === 0 && getUnreadCountForBuddy(b.id) > 0) return 1;
                    // If both have or don't have unread messages, sort alphabetically
                    return a.fullName.localeCompare(b.fullName);
                  })
                  .map(buddy => (
                  <li 
                    key={buddy.id}
                    onClick={() => handleSelectBuddy(buddy)}
                    className={`p-4 flex items-center cursor-pointer hover:bg-fairway-50 ${
                      selectedBuddy?.id === buddy.id ? 'bg-fairway-100' : ''
                    }`}
                  >
                    <div className="relative">
                      {buddy.profilePictureUrl ? (
                        <img 
                          src={buddy.profilePictureUrl} 
                          alt={buddy.fullName}
                          className="h-10 w-10 rounded-full mr-3 object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-fairway-500 text-white flex items-center justify-center mr-3">
                          {buddy.fullName.split(' ').map(name => name[0]).join('')}
                        </div>
                      )}
                      {/* Only show indicator if unreadMessagesCount > 0 and not cleared by user click */}
                      {getUnreadCountForBuddy(buddy.id) > 0 && (
                        <div className="absolute -top-1 -right-1 bg-flag-600 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold">
                          {getUnreadCountForBuddy(buddy.id)}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-fairway-800">{buddy.fullName}</p>
                      <p className="text-xs text-gray-500">
                        {buddy.handicap !== null && `Handicap: ${buddy.handicap}`}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          {/* Messages area */}
          <div className="col-span-9 flex flex-col min-h-0 h-full" style={{ height: "100%" }}>
            {!selectedBuddy ? (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div className="text-center text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-fairway-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-lg font-medium">Select a buddy to start chatting</p>
                </div>
              </div>
            ) : (
              <>
                {/* Message header */}
                <div className="p-4 border-b border-gray-200 flex items-center bg-white flex-shrink-0">
                  {selectedBuddy.profilePictureUrl ? (
                    <img 
                      src={selectedBuddy.profilePictureUrl} 
                      alt={selectedBuddy.fullName}
                      className="h-10 w-10 rounded-full mr-3 object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-fairway-500 text-white flex items-center justify-center mr-3">
                      {selectedBuddy.fullName.split(' ').map(name => name[0]).join('')}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-fairway-800">{selectedBuddy.fullName}</p>
                    <p className="text-xs text-gray-500">
                      {selectedBuddy.playingStyle && (
                        <span className="capitalize">{selectedBuddy.playingStyle} player</span>
                      )}
                    </p>
                  </div>
                </div>
                
                {/* Messages list */}
                <div 
                  ref={messagesContainerRef} 
                  className="p-4 overflow-y-auto bg-gray-50 flex-1 min-h-0"
                >
                  {loadingMessages ? (
                    <div className="text-center text-gray-500">Loading messages...</div>
                  ) : messagesError ? (
                    <div className="text-center text-flag-600">Error loading messages</div>
                  ) : Object.keys(groupedMessages).length === 0 ? (
                    <div className="text-center text-gray-500 my-8">
                      No messages yet. Start the conversation!
                    </div>
                  ) : (
                    Object.entries(groupedMessages).map(([date, messages]) => (
                      <div key={date} className="mb-6">
                        <div className="text-center mb-4">
                          <span className="inline-block px-3 py-1 bg-gray-200 rounded-full text-xs font-medium text-gray-700">
                            {date}
                          </span>
                        </div>
                        
                        {messages.map(message => (
                          <MessageItem 
                            key={message.id}
                            message={message}
                            currentUser={currentUser}
                            formatTime={formatTime}
                          />
                        ))}
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
                
                {/* Message input - Fixed position at the bottom */}
                <div className="p-4 border-t border-gray-200 bg-white flex-shrink-0">
                  <form onSubmit={handleSendMessage} className="flex">
                    <input
                      type="text"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-grow p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-fairway-500"
                      autoComplete="off"
                    />
                    <button
                      type="submit"
                      disabled={!messageText.trim()}
                      className="bg-fairway-600 text-white p-2 rounded-r-md hover:bg-fairway-700 focus:outline-none focus:ring-2 focus:ring-fairway-500 disabled:opacity-50"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
