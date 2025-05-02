import { gql } from '@apollo/client';

export const CURRENT_USER_WITH_NOTIFICATIONS = gql`
  query CurrentUserWithNotifications {
    me {
      id
      email
      firstName
      lastName
      fullName
      handicap
      playingStyle
      profilePictureUrl
      unreadMessagesCount
      unreadMessagesCountByBuddy
      unreadNotificationsCount
      notifications {
        id
        action
        read
        createdAt
        message
        notifiableType
        notifiableId
        notifiable {
          ... on Comment {
            id
            postId
            content
          }
          ... on Like {
            id
            likeableType
            likeableId
          }
          ... on BuddyRequest {
            id
            status
          }
        }
      }
      buddies {
        id
        fullName
        handicap
        playingStyle
        profilePictureUrl
      }
      sentBuddyRequests {
        id
        status
        createdAt
        receiver {
          id
          fullName
          profilePictureUrl
        }
      }
      receivedBuddyRequests {
        id
        status
        createdAt
        sender {
          id
          fullName
          profilePictureUrl
        }
      }
    }
  }
`;

export const MARK_NOTIFICATION_AS_READ = gql`
  mutation MarkNotificationAsRead($id: ID!) {
    markNotificationAsRead(input: {id: $id}) {
      success
      errors
    }
  }
`;

export const MARK_ALL_NOTIFICATIONS_AS_READ = gql`
  mutation MarkAllNotificationsAsRead {
    markAllNotificationsAsRead(input: {}) {
      success
      errors
    }
  }
`;
