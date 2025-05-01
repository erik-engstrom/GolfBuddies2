// Message subscription component for real-time updates
import React, { useEffect } from 'react';
import { useSubscription, gql, useApolloClient } from '@apollo/client';
import { CURRENT_USER_QUERY, GET_BUDDIES } from '../graphql/queries';

// GraphQL subscription for new messages
const MESSAGE_RECEIVED_SUBSCRIPTION = gql`
  subscription MessageReceived($userId: ID!) {
    messageReceived(userId: $userId) {
      id
      content
      read
      sender {
        id
        username
        fullName
      }
      receiver {
        id
        username
        fullName
      }
      createdAt
    }
  }
`;

const MessageSubscription = ({ userId, onNewMessage }) => {
  const client = useApolloClient();
  
  const { data, loading, error } = useSubscription(
    MESSAGE_RECEIVED_SUBSCRIPTION,
    {
      variables: { userId },
      skip: !userId, // Skip subscription if no userId
      onSubscriptionData: ({ subscriptionData }) => {
        try {
          const newMessage = subscriptionData?.data?.messageReceived;
          
          // If this is a new message TO the current user that's not read
          // we need to update the unread count
          if (newMessage && newMessage.receiver && newMessage.receiver.id === userId && !newMessage.read) {
            // Update the badge counts in cache for both NavBar and Messages component
            updateUnreadCountsInCache(newMessage.sender.id);
          }
          
          // Pass the message to parent component for any additional handling
          if (newMessage && onNewMessage) {
            onNewMessage(newMessage);
          }
        } catch (err) {
          console.error('Error processing subscription data:', err);
        }
      },
      onError: (err) => {
        console.log('Subscription encountered an error:', err);
        // We'll handle this in useEffect, but this stops error propagation
      }
    }
  );

  // Helper function to update the unread counts in Apollo cache
  const updateUnreadCountsInCache = (senderId) => {
    try {
      // Check for CURRENT_USER_QUERY cache to update navbar badge
      const userData = client.readQuery({ query: CURRENT_USER_QUERY });
      
      if (userData?.me) {
        // Create a new unread count by buddy
        const updatedCountByBuddy = {
          ...userData.me.unreadMessagesCountByBuddy
        };
        
        // Increment the count for this sender
        updatedCountByBuddy[senderId] = (updatedCountByBuddy[senderId] || 0) + 1;
        
        // Calculate new total
        const newTotalCount = userData.me.unreadMessagesCount + 1;
        
        console.log('Updating unread counts in cache', { 
          sender: senderId, 
          newTotal: newTotalCount, 
          byBuddy: updatedCountByBuddy 
        });
        
        // Update the cache with new counts
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
      
      // Also update GET_BUDDIES query if it exists in cache
      try {
        const buddiesData = client.readQuery({ query: GET_BUDDIES });
        
        if (buddiesData?.me) {
          const updatedBuddiesCountByBuddy = {
            ...buddiesData.me.unreadMessagesCountByBuddy
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

  useEffect(() => {
    if (error) {
      console.error('Subscription error:', error);
      // Don't crash the app on subscription errors, just log them
    }
  }, [error]);

  // Continue rendering the app even if the subscription fails
  // This is a non-visible component
  return null;
};

export default MessageSubscription;
