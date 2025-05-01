import { gql } from '@apollo/client';

// User queries
export const CURRENT_USER_QUERY = gql`
  query CurrentUser {
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

export const GET_USER_PROFILE = gql`
  query GetUserProfile($id: ID!) {
    user(id: $id) {
      id
      email
      firstName
      lastName
      fullName
      handicap
      playingStyle
      profilePictureUrl
      isBuddy
      outgoingBuddyRequest {
        id
        status
        createdAt
      }
      incomingBuddyRequest {
        id
        status
        createdAt
      }
      posts {
        id
        content
        createdAt
        imageUrl
        likesCount
        commentsCount
      }
    }
  }
`;

// Post queries
export const GET_POSTS = gql`
  query GetPosts {
    posts {
      id
      content
      createdAt
      imageUrl
      likesCount
      commentsCount
      user {
        id
        fullName
        profilePictureUrl
      }
    }
  }
`;

export const GET_FEED_POSTS = gql`
  query GetFeedPosts {
    posts {
      id
      content
      createdAt
      imageUrl
      likesCount
      commentsCount
      user {
        id
        fullName
        profilePictureUrl
      }
      comments {
        id
        content
        createdAt
        likesCount
        user {
          id
          fullName
          profilePictureUrl
        }
      }
    }
  }
`;

// Buddy queries
export const GET_BUDDY_REQUESTS = gql`
  query GetBuddyRequests {
    buddyRequests {
      id
      status
      sender {
        id
        fullName
        profilePictureUrl
      }
      receiver {
        id
        fullName
        profilePictureUrl
      }
    }
  }
`;

export const GET_BUDDIES = gql`
  query GetBuddies {
    buddies {
      id
      fullName
      profilePictureUrl
      unreadMessagesCount
    }
    me {
      id
      unreadMessagesCountByBuddy
    }
  }
`;

// Message queries
export const GET_MESSAGES_WITH_USER = gql`
  query GetMessagesWithUser($userId: ID!) {
    messagesWithUser(userId: $userId) {
      id
      content
      createdAt
      read
      sender {
        id
        fullName
      }
      receiver {
        id
        fullName
      }
    }
  }
`;

// Search queries
export const SEARCH_USERS = gql`
  query SearchUsers($query: String!) {
    searchUsers(query: $query) {
      id
      firstName
      lastName
      fullName
      profilePictureUrl
    }
  }
`;
