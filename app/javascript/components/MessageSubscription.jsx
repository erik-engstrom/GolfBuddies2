// Message subscription component for real-time updates
import React, { useEffect, useState, useRef } from 'react';
import { useSubscription, gql, useApolloClient } from '@apollo/client';
import { GET_BUDDIES, GET_MESSAGES_WITH_USER } from '../graphql/queries';
import { CURRENT_USER_WITH_NOTIFICATIONS } from '../graphql/notifications';
import { MESSAGE_READ_STATUS_UPDATED_SUBSCRIPTION } from '../graphql/subscriptions/messageReadStatusSubscription';

// GraphQL subscription for new messages
const MESSAGE_RECEIVED_SUBSCRIPTION = gql`
  subscription MessageReceived($userId: ID!) {
    messageReceived(userId: $userId) {
      id
      content
      read
      sender {
        id
        fullName
      }
      receiver {
        id
        fullName
      }
      createdAt
    }
  }
`;

const MessageSubscription = ({ userId, onNewMessage }) => {
  const client = useApolloClient();
  
  // Track subscription attempts to prevent too many retries
  const subscriptionAttempts = useRef(0);
  const [subscriptionActive, setSubscriptionActive] = useState(false);
  
  // Message received subscription
  const { data: newMessageData, loading: newMessageLoading, error: newMessageError } = useSubscription(
    MESSAGE_RECEIVED_SUBSCRIPTION,
    {
      variables: { userId },
      skip: !userId, // Skip subscription if no userId
      shouldResubscribe: () => {
        // Limit resubscription attempts
        if (subscriptionAttempts.current > 5) {
          console.log('Too many subscription attempts, stopping automatic resubscription');
          return false;
        }
        subscriptionAttempts.current++;
        console.log(`Resubscribing to message updates (attempt ${subscriptionAttempts.current})`);
        return true;
      },
      onSubscriptionData: ({ subscriptionData }) => {
        try {
          // Reset attempt counter on successful data
          subscriptionAttempts.current = 0;
          setSubscriptionActive(true);
          console.log('Subscription successfully connected and receiving data');
          
          // Check for message data - could be either messageReceived or messageReadStatusUpdated
          const responseData = subscriptionData?.data;
          if (!responseData) {
            console.warn('Received empty subscription data');
            return;
          }
          
          // Check which type of subscription data we received
          let newMessage;
          
          // Check if we have valid messageReceived data
          if (responseData.messageReceived) {
            newMessage = responseData.messageReceived;
            console.log('Received new message:', newMessage.id);
          } 
          // Handle cross-subscription data (when messageReadStatusUpdated comes through messageReceived)
          else if (responseData.messageReadStatusUpdated) {
            console.log('Received message read status in message subscription:', responseData.messageReadStatusUpdated.id);
            // Process this using the read status handler
            handleMessageReadStatus(responseData.messageReadStatusUpdated);
            return;
          }
          else {
            console.warn('Received unknown subscription data structure:', responseData);
            return;
          }
          
          if (!newMessage) {
            console.warn('Received empty message data in subscription');
            return;
          }
          
          if (!newMessage.id || !newMessage.sender || !newMessage.receiver) {
            console.warn('Received incomplete message object in subscription:', newMessage);
            return;
          }
          
          // If this is a new message TO the current user that's not read
          // we need to update the unread count
          if (newMessage.receiver && newMessage.receiver.id === userId && !newMessage.read) {
            console.log('❗ New unread message received, updating counts immediately');
            
            // Update the badge counts in cache for both NavBar and Messages component
            updateUnreadCountsInCache(newMessage.sender.id);
            
            // Also update the message status in any existing conversations in the cache
            updateMessageInConversationCache(newMessage);
            
            // Directly update UI notification count with a small delay
            // This ensures the badge updates even if cache updates are slow
            setTimeout(() => {
              // Read current counts from cache
              try {
                const userData = client.readQuery({ query: CURRENT_USER_WITH_NOTIFICATIONS });
                if (userData?.me) {
                  const updatedCountByBuddy = {
                    ...userData.me.unreadMessagesCountByBuddy || {}
                  };
                  
                  // Make sure this new message is counted
                  if (!updatedCountByBuddy[newMessage.sender.id]) {
                    updatedCountByBuddy[newMessage.sender.id] = 1;
                  }
                  
                  // Calculate correct total
                  const correctTotal = Object.values(updatedCountByBuddy).reduce((sum, count) => sum + count, 0);
                  
                  console.log('Forcing UI update with current counts:', {
                    byBuddy: updatedCountByBuddy,
                    total: correctTotal
                  });
                  
                  // Force UI update for components that might not be reacting to cache changes
                  window.dispatchEvent(new CustomEvent('message-read', {
                    detail: {
                      totalCount: correctTotal,
                      byBuddy: updatedCountByBuddy,
                      forceUpdate: true
                    }
                  }));
                }
              } catch (e) {
                console.error('Error dispatching UI update for new message:', e);
              }
            }, 100);
          }
          
          // Pass the message to parent component for any additional handling
          if (onNewMessage) {
            onNewMessage(newMessage);
          }
        } catch (err) {
          console.error('Error processing subscription data:', err);
        }
      },
      onError: (err) => {
        console.log('Subscription encountered an error:', err);
        setSubscriptionActive(false);
        // We'll handle this in useEffect, but this stops error propagation
      }
    }
  );
  
  // Helper function to process message read status updates from any subscription
  const handleMessageReadStatus = (updatedMessage) => {
    try {
      // Validate we have a proper message object
      if (!updatedMessage) {
        console.warn('Empty message in handleMessageReadStatus');
        return;
      }
      
      if (!updatedMessage.id || !updatedMessage.sender || !updatedMessage.receiver) {
        console.warn('Incomplete message object in handleMessageReadStatus:', updatedMessage);
        return;
      }
      
      console.log('Processing message read status update:', updatedMessage);
      
      // Update message in conversation cache if it exists
      updateMessageReadStatusInCache(updatedMessage);
      
      // If current user is the sender of the message that was read, update notification counts
      if (updatedMessage.sender && updatedMessage.sender.id === userId && updatedMessage.read) {
        // Decrease unread count for this conversation
        decreaseUnreadCountInCache(updatedMessage.receiver.id);
      }
      
      // If the message was directed to the current user and it's now read
      // we need to update the total unread count too
      if (updatedMessage.receiver && updatedMessage.receiver.id === userId && updatedMessage.read) {
        // Update UI notification badges
        refreshUnreadCountsFromServer();
      }
    } catch (err) {
      console.error('Error in handleMessageReadStatus:', err);
    }
  };

  // Message read status subscription
  const { data: readStatusData, loading: readStatusLoading, error: readStatusError } = useSubscription(
    MESSAGE_READ_STATUS_UPDATED_SUBSCRIPTION,
    {
      variables: { userId },
      skip: !userId,
      shouldResubscribe: () => {
        // Limit resubscription attempts
        if (subscriptionAttempts.current > 5) {
          console.log('Too many read status subscription attempts, stopping automatic resubscription');
          return false;
        }
        console.log(`Resubscribing to read status updates (attempt ${subscriptionAttempts.current + 1})`);
        return true;
      },
      onSubscriptionData: ({ subscriptionData }) => {
        try {
          // Reset attempt counter on successful data
          subscriptionAttempts.current = 0;
          setSubscriptionActive(true);
          console.log('Read status subscription successfully connected and receiving data');
          
          // Check for different response structures
          const responseData = subscriptionData?.data;
          if (!responseData) {
            console.warn('Received empty read status subscription data');
            return;
          }
          
          // Check which type of subscription data we received
          let updatedMessage;
          
          if (responseData.messageReadStatusUpdated) {
            updatedMessage = responseData.messageReadStatusUpdated;
          }
          // Handle cross-subscription data (if messageReceived comes through messageReadStatusUpdated)
          else if (responseData.messageReceived) {
            console.log('Received message data in read status subscription - ignoring');
            return;
          }
          else {
            console.warn('Unknown read status subscription structure:', responseData);
            return;
          }
          
          // Process the message read status update
          handleMessageReadStatus(updatedMessage);
        } catch (err) {
          console.error('Error processing read status update:', err);
        }
      },
      onError: (err) => {
        console.log('Read status subscription encountered an error:', err);
        setSubscriptionActive(false);
        // We'll handle this in useEffect, but this stops error propagation
      }
    }
  );

  // Helper function to update the unread counts in Apollo cache
  const updateUnreadCountsInCache = (senderId) => {
    try {
      // Check for CURRENT_USER_WITH_NOTIFICATIONS cache to update navbar badge
      const userData = client.readQuery({ query: CURRENT_USER_WITH_NOTIFICATIONS });
      
      if (userData?.me) {
        // Create a new unread count by buddy
        const updatedCountByBuddy = {
          ...userData.me.unreadMessagesCountByBuddy || {}
        };
        
        // Increment the count for this sender
        updatedCountByBuddy[senderId] = (updatedCountByBuddy[senderId] || 0) + 1;
        
        // Calculate new total by summing all values in the buddy counts object
        // This ensures the total is always correct and in sync with the individual counts
        const newTotalCount = Object.values(updatedCountByBuddy).reduce((sum, count) => sum + count, 0);
        
        console.log('Updating unread counts in cache', { 
          sender: senderId, 
          newTotal: newTotalCount, 
          byBuddy: updatedCountByBuddy 
        });
        
        // Update the cache with new counts
        client.writeQuery({
          query: CURRENT_USER_WITH_NOTIFICATIONS,
          data: {
            me: {
              ...userData.me,
              unreadMessagesCount: newTotalCount,
              unreadMessagesCountByBuddy: updatedCountByBuddy
            }
          }
        });
        
        // Dispatch an event to notify other components (especially NavBar)
        window.dispatchEvent(new CustomEvent('message-read', { 
          detail: { 
            totalCount: newTotalCount, 
            byBuddy: updatedCountByBuddy 
          } 
        }));
        
        // Also store in localStorage for cross-tab communication
        try {
          localStorage.setItem('unreadMessagesCount', newTotalCount.toString());
          localStorage.setItem('unreadMessagesCountUpdated', Date.now().toString());
        } catch (e) {
          console.error('Error storing unread count in localStorage:', e);
        }
      }
      
      // Also update GET_BUDDIES query if it exists in cache
      try {
        const buddiesData = client.readQuery({ query: GET_BUDDIES });
        
        if (buddiesData?.me) {
          const updatedBuddiesCountByBuddy = {
            ...buddiesData.me.unreadMessagesCountByBuddy || {}
          };
          updatedBuddiesCountByBuddy[senderId] = (updatedBuddiesCountByBuddy[senderId] || 0) + 1;
          
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
        }
      } catch (e) {
        // It's okay if this fails - the GET_BUDDIES query might not be in cache yet
        console.log('Buddy cache not yet available, will update on next query');
      }
    } catch (e) {
      console.error('Error updating message counts in cache:', e);
    }
  };

  // Helper function to decrease unread count when messages are read
  const decreaseUnreadCountInCache = (receiverId) => {
    try {
      // Get current user data from cache
      const userData = client.readQuery({ query: CURRENT_USER_WITH_NOTIFICATIONS });
      
      if (userData?.me) {
        // Create a new unread count by buddy
        const updatedCountByBuddy = {
          ...userData.me.unreadMessagesCountByBuddy || {}
        };
        
        // Decrease the count for this receiver if it exists
        const currentCount = updatedCountByBuddy[receiverId] || 0;
        if (currentCount > 0) {
          updatedCountByBuddy[receiverId] = currentCount - 1;
          
          // Calculate new total by summing all values in the updated buddy counts object
          // This ensures the total is always correct and in sync with the individual counts
          const newTotalCount = Object.values(updatedCountByBuddy).reduce((sum, count) => sum + count, 0);
          
          console.log('Decreasing unread counts in cache', { 
            receiver: receiverId, 
            newTotal: newTotalCount, 
            byBuddy: updatedCountByBuddy 
          });
          
          // Update the cache with new counts
          client.writeQuery({
            query: CURRENT_USER_WITH_NOTIFICATIONS,
            data: {
              me: {
                ...userData.me,
                unreadMessagesCount: newTotalCount,
                unreadMessagesCountByBuddy: updatedCountByBuddy
              }
            }
          });
          
          // Also update UI notifications
          window.dispatchEvent(new CustomEvent('message-read', { 
            detail: { userId: receiverId, totalCount: newTotalCount } 
          }));
          
          try {
            localStorage.setItem('unreadMessagesCount', newTotalCount.toString());
            localStorage.setItem('unreadMessagesCountUpdated', Date.now().toString());
          } catch (e) {
            console.log('Could not store in localStorage', e);
          }
        }
      }
      
      // Also update GET_BUDDIES query if it exists in cache
      try {
        const buddiesData = client.readQuery({ query: GET_BUDDIES });
        
        if (buddiesData?.me) {
          const updatedBuddiesCountByBuddy = {
            ...buddiesData.me.unreadMessagesCountByBuddy || {}
          };
          
          const currentCount = updatedBuddiesCountByBuddy[receiverId] || 0;
          if (currentCount > 0) {
            updatedBuddiesCountByBuddy[receiverId] = currentCount - 1;
            
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
          }
        }
      } catch (e) {
        console.log('Buddy cache not available for decrementing, will update on next query');
      }
    } catch (e) {
      console.error('Error decreasing unread counts in cache:', e);
    }
  };

  // Force a refresh of unread counts from the server
  const refreshUnreadCountsFromServer = () => {
    try {
      // Track the request state
      const requestStartTime = Date.now();
      console.log('Refreshing unread counts from server...');
      
      // Update local state while waiting for the server
      window.dispatchEvent(new CustomEvent('message-read', { 
        detail: { totalCount: null, loading: true } 
      }));
      
      client.query({ 
        query: CURRENT_USER_WITH_NOTIFICATIONS,
        fetchPolicy: 'network-only'
      }).then(({ data }) => {
        const requestDuration = Date.now() - requestStartTime;
        console.log(`Unread counts refreshed in ${requestDuration}ms`);
        
        if (data?.me) {
          // Instead of using the server's unreadMessagesCount directly,
          // recalculate it from the unreadMessagesCountByBuddy to ensure consistency
          const countByBuddy = data.me.unreadMessagesCountByBuddy || {};
          const calculatedTotal = Object.values(countByBuddy).reduce((sum, count) => sum + count, 0);
          
          // If there's a mismatch between the server's total and our calculated total,
          // log it and use our calculated value for consistency
          if (calculatedTotal !== data.me.unreadMessagesCount) {
            console.warn('Mismatch between server unread count and calculated count:', {
              serverTotal: data.me.unreadMessagesCount,
              calculatedTotal,
              countByBuddy
            });
          }
          
          const totalCount = calculatedTotal;
          
          // Update the cache directly to ensure consistency
          client.writeQuery({
            query: CURRENT_USER_WITH_NOTIFICATIONS,
            data: {
              me: {
                ...data.me,
                unreadMessagesCount: totalCount
              }
            }
          });
          
          // Update UI with the fresh data from server
          window.dispatchEvent(new CustomEvent('message-read', { 
            detail: { totalCount, loading: false, byBuddy: countByBuddy } 
          }));
          
          try {
            localStorage.setItem('unreadMessagesCount', totalCount.toString());
            localStorage.setItem('unreadMessagesCountByBuddy', JSON.stringify(data.me.unreadMessagesCountByBuddy || {}));
            localStorage.setItem('unreadMessagesCountUpdated', Date.now().toString());
          } catch (e) {
            console.log('Could not store in localStorage', e);
          }
        }
      }).catch(err => {
        console.error('Error refreshing unread counts:', err);
        
        // Update UI to show error state
        window.dispatchEvent(new CustomEvent('message-read', { 
          detail: { error: true, loading: false } 
        }));
      });
    } catch (e) {
      console.error('Failed to refresh unread counts:', e);
      
      // Update UI to show error state
      window.dispatchEvent(new CustomEvent('message-read', { 
        detail: { error: true, loading: false } 
      }));
    }
  };

  // Helper function to update the message in conversation cache
  const updateMessageInConversationCache = (newMessage) => {
    try {
      // Get the sender ID - this is the buddy we're talking with
      const buddyId = newMessage.sender.id;
      
      // Try to read the conversation from cache
      const existingData = client.readQuery({
        query: GET_MESSAGES_WITH_USER,
        variables: { userId: buddyId }
      });
      
      // If we found existing conversation data, update it with the new message
      if (existingData?.messagesWithUser) {
        client.writeQuery({
          query: GET_MESSAGES_WITH_USER,
          variables: { userId: buddyId },
          data: {
            messagesWithUser: [...existingData.messagesWithUser, newMessage]
          }
        });
        console.log('Updated message conversation cache with new message');
        
        // Also log the current counts to help diagnose any issues
        try {
          const userData = client.readQuery({ query: CURRENT_USER_WITH_NOTIFICATIONS });
          if (userData?.me) {
            const countByBuddy = userData.me.unreadMessagesCountByBuddy || {};
            const calculatedTotal = Object.values(countByBuddy).reduce((sum, count) => sum + count, 0);
            console.log('Current message counts after cache update:', {
              unreadMessagesCount: userData.me.unreadMessagesCount,
              calculatedTotal,
              countByBuddy
            });
            
            // If there's a mismatch, log a warning
            if (calculatedTotal !== userData.me.unreadMessagesCount) {
              console.warn('⚠️ Message count mismatch detected!');
              
              // Fix the mismatch by forcing an update
              client.writeQuery({
                query: CURRENT_USER_WITH_NOTIFICATIONS,
                data: {
                  me: {
                    ...userData.me,
                    unreadMessagesCount: calculatedTotal
                  }
                }
              });
              
              // Notify other components of the update
              window.dispatchEvent(new CustomEvent('message-read', { 
                detail: { 
                  totalCount: calculatedTotal, 
                  byBuddy: countByBuddy 
                } 
              }));
            }
          }
        } catch (e) {
          console.log('Could not check counts after cache update:', e);
        }
      }
    } catch (e) {
      // This is expected if we don't have the conversation open
      console.log('Conversation not in cache yet, will update on next query');
    }
  };
  
  // Helper function to update the read status of a message in the conversation cache
  const updateMessageReadStatusInCache = (updatedMessage) => {
    try {
      // Validate message data
      if (!updatedMessage || !updatedMessage.id) {
        console.warn('Invalid message data for read status update:', updatedMessage);
        return;
      }

      if (!updatedMessage.sender || !updatedMessage.sender.id || 
          !updatedMessage.receiver || !updatedMessage.receiver.id) {
        console.warn('Message missing sender or receiver data:', updatedMessage);
        return;
      }
      
      // Figure out which conversation this belongs to
      // If current user is the sender, it's in the receiver's conversation
      // If current user is the receiver, it's in the sender's conversation
      const buddyId = updatedMessage.sender.id === userId 
        ? updatedMessage.receiver.id 
        : updatedMessage.sender.id;
      
      console.log(`Updating read status for message ${updatedMessage.id} in conversation with ${buddyId}`);
      
      // Try to read the conversation from cache
      let existingData;
      try {
        existingData = client.readQuery({
          query: GET_MESSAGES_WITH_USER,
          variables: { userId: buddyId }
        });
      } catch (err) {
        console.log('Cannot read conversation from cache, may not be loaded yet');
      }
      
      // If we found existing conversation data, update the message status
      if (existingData?.messagesWithUser) {
        const originalMessage = existingData.messagesWithUser.find(m => m.id === updatedMessage.id);
        
        // Only update if read status actually changed
        if (originalMessage && originalMessage.read !== updatedMessage.read) {
          console.log(`Changing read status from ${originalMessage.read} to ${updatedMessage.read}`);
          
          const updatedMessages = existingData.messagesWithUser.map(message => {
            if (message.id === updatedMessage.id) {
              return { ...message, read: updatedMessage.read };
            }
            return message;
          });
          
          try {
            client.writeQuery({
              query: GET_MESSAGES_WITH_USER,
              variables: { userId: buddyId },
              data: {
                messagesWithUser: updatedMessages
              }
            });
            
            console.log('Updated message read status in conversation cache');
          } catch (err) {
            console.error('Error writing to cache:', err);
          }
          
          // Also trigger a UI refresh for components that might be displaying this message
          try {
            window.dispatchEvent(new CustomEvent('message-status-updated', { 
              detail: { messageId: updatedMessage.id, read: updatedMessage.read }
            }));
          } catch (err) {
            console.error('Error dispatching event:', err);
          }
        } else if (!originalMessage) {
          console.log('Message not found in conversation cache');
        } else {
          console.log('Message status unchanged, no cache update needed');
        }
      } else {
        console.log('Conversation not found in cache or not loaded yet');
        
        // Even if the conversation isn't in cache, still dispatch the event
        // in case the message is being displayed elsewhere
        try {
          window.dispatchEvent(new CustomEvent('message-status-updated', { 
            detail: { messageId: updatedMessage.id, read: updatedMessage.read }
          }));
        } catch (err) {
          console.error('Error dispatching event:', err);
        }
      }
    } catch (e) {
      // This is expected if we don't have the conversation open
      console.log('Error updating conversation cache:', e);
    }
  };
  
  // Track the error recovery timeout
  const reconnectTimeoutRef = useRef(null);
  const maxReconnectDelay = 30000; // Cap at 30 seconds
  
  // Handle subscription errors from either subscription
  useEffect(() => {
    const error = newMessageError || readStatusError;
    if (error) {
      console.error('Subscription error:', error);
      
      // Update WebSocket status
      try {
        window.dispatchEvent(new CustomEvent('ws-status-change', { 
          detail: { status: 'error' } 
        }));
        
        localStorage.setItem('wsStatus', 'error');
      } catch (e) {
        console.error('Error updating WebSocket status:', e);
      }
      
      // Exponential backoff for reconnection
      const delay = Math.min(1000 * Math.pow(2, subscriptionAttempts.current), maxReconnectDelay);
      
      console.log(`Will attempt to reconnect in ${delay/1000} seconds (attempt ${subscriptionAttempts.current + 1})`);
      
      // Clear any existing timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      // Create a reconnection mechanism with exponential backoff
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('Attempting to reconnect subscription...');
        // Force Apollo to refetch the subscription by updating a state variable
        // This is handled by the parent component
        if (onNewMessage) {
          onNewMessage({ type: 'reconnect' });
        }
      }, delay);
      
      return () => {
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
      };
    }
  }, [newMessageError, readStatusError, onNewMessage, subscriptionAttempts.current]);
  
  // Report the current subscription status
  useEffect(() => {
    const messageStatus = newMessageLoading ? 'connecting' : newMessageError ? 'error' : subscriptionActive ? 'connected' : 'inactive';
    const readStatus = readStatusLoading ? 'connecting' : readStatusError ? 'error' : 'unknown';
    console.log(`MessageSubscription status: messages=${messageStatus}, readStatus=${readStatus}`);
    
    // Update global WebSocket status based on subscriptions
    let overallStatus = 'unknown';
    
    if (messageStatus === 'connecting' || readStatus === 'connecting') {
      overallStatus = 'connecting';
    } else if (messageStatus === 'error' && readStatus === 'error') {
      overallStatus = 'error';
    } else if (messageStatus === 'connected' || readStatus === 'connected') {
      overallStatus = 'connected';
    } else {
      overallStatus = 'inactive';
    }
    
    // Broadcast WebSocket status change
    try {
      window.dispatchEvent(new CustomEvent('ws-status-change', { 
        detail: { status: overallStatus } 
      }));
      
      localStorage.setItem('wsStatus', overallStatus);
    } catch (e) {
      console.error('Error updating WebSocket status:', e);
    }
  }, [newMessageLoading, newMessageError, readStatusLoading, readStatusError, subscriptionActive]);
  
  // Set up a heartbeat to keep WebSockets alive
  useEffect(() => {
    const heartbeatInterval = setInterval(() => {
      // Send heartbeat event to trigger pings in websocket connections
      try {
        window.dispatchEvent(new CustomEvent('ws-heartbeat'));
      } catch (e) {
        console.error('Error triggering heartbeat:', e);
      }
    }, 30000); // Every 30 seconds
    
    return () => {
      clearInterval(heartbeatInterval);
    };
  }, []);

  // Continue rendering the app even if the subscription fails
  // This is a non-visible component
  return null;
};

export default MessageSubscription;
