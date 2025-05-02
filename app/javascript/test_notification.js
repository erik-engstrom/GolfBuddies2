// Simple notification test script
import { ApolloClient, InMemoryCache, gql } from '@apollo/client';
import { MARK_NOTIFICATION_AS_READ, MARK_ALL_NOTIFICATIONS_AS_READ } from './graphql/notifications';

// For testing in the browser console
window.testNotifications = async () => {
  try {
    // Get the Apollo client instance from your React app
    const client = window.__APOLLO_CLIENT__;
    
    if (!client) {
      console.error("Apollo client not found on window.__APOLLO_CLIENT__");
      return;
    }
    
    // Test mark single notification as read
    const notificationId = prompt("Enter notification ID to mark as read (or cancel for all)");
    
    if (notificationId) {
      console.log(`Testing marking notification ${notificationId} as read...`);
      const result = await client.mutate({
        mutation: MARK_NOTIFICATION_AS_READ,
        variables: { id: notificationId }
      });
      
      console.log("Result:", result);
      
      if (result.data?.markNotificationAsRead?.success) {
        console.log("✅ Successfully marked notification as read");
      } else {
        console.error("❌ Failed to mark notification as read:", result.data?.markNotificationAsRead?.errors);
      }
    } else {
      console.log("Testing marking all notifications as read...");
      const result = await client.mutate({
        mutation: MARK_ALL_NOTIFICATIONS_AS_READ
      });
      
      console.log("Result:", result);
      
      if (result.data?.markAllNotificationsAsRead?.success) {
        console.log("✅ Successfully marked all notifications as read");
      } else {
        console.error("❌ Failed to mark all notifications as read:", result.data?.markAllNotificationsAsRead?.errors);
      }
    }
  } catch (error) {
    console.error("Error testing notifications:", error);
  }
};

// For testing through the application
export const testNotificationSystem = () => {
  console.log("Notification testing utility loaded");
  console.log("Call window.testNotifications() to run tests");
  
  // Make the test function available globally
  window.testNotifications = window.testNotifications || testNotifications;
};
