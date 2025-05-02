// Simple notification test script
import { ApolloClient, InMemoryCache, gql } from '@apollo/client';
import { CURRENT_USER_WITH_NOTIFICATIONS, MARK_NOTIFICATION_AS_READ } from './graphql/notifications';

// For testing in the browser console
window.testNotificationQuery = async () => {
  try {
    // Get the Apollo client instance from your React app
    const client = window.__APOLLO_CLIENT__;
    
    if (!client) {
      console.error("Apollo client not found on window.__APOLLO_CLIENT__");
      return;
    }
    
    console.log("Testing notification query...");
    const result = await client.query({
      query: CURRENT_USER_WITH_NOTIFICATIONS,
      fetchPolicy: 'network-only'
    });
    
    console.log("Current user notifications:", result.data?.me?.notifications || []);
    
    // Log the field names to check if they match what we're expecting
    const notifications = result.data?.me?.notifications || [];
    if (notifications.length > 0) {
      console.log("First notification:", notifications[0]);
      console.log("Notification fields:", Object.keys(notifications[0]));
      
      if (notifications[0].notifiable) {
        console.log("Notifiable object:", notifications[0].notifiable);
        console.log("Field names:", Object.keys(notifications[0].notifiable));
        
        // Check for both camelCase and snake_case field names
        const comment = notifications[0].notifiableType === "Comment" ? notifications[0].notifiable : null;
        const like = notifications[0].notifiableType === "Like" ? notifications[0].notifiable : null;
        
        if (comment) {
          console.log("Comment notifiable found:", comment);
          console.log("postId exists:", comment.postId !== undefined);
          console.log("post_id exists:", comment.post_id !== undefined);
        }
        
        if (like) {
          console.log("Like notifiable found:", like);
          console.log("likeableType exists:", like.likeableType !== undefined);
          console.log("likeable_type exists:", like.likeable_type !== undefined);
          console.log("likeableId exists:", like.likeableId !== undefined);
          console.log("likeable_id exists:", like.likeable_id !== undefined);
        }
      }
    } else {
      console.log("No notifications found to test");
    }
  } catch (error) {
    console.error("Error testing notification query:", error);
  }
};

// Make the test function available globally
console.log("Notification test utility loaded");
console.log("Call window.testNotificationQuery() to test notifications");
window.testNotificationQuery = window.testNotificationQuery || testNotificationQuery;
