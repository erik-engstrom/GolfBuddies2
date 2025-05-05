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
        likes {
          id
          user {
            id
            fullName
            profilePictureUrl
          }
        }
      }
    }
  }
`;

export const GET_USER_INFO = gql`
  query GetUserInfo($id: ID!) {
    user(id: $id) {
      id
      fullName
      profilePictureUrl
      isBuddy
      outgoingBuddyRequest {
        id
        status
      }
      incomingBuddyRequest {
        id
        status
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
  query GetFeedPosts($buddyOnly: Boolean) {
    posts(buddyOnly: $buddyOnly) {
      id
      content
      createdAt
      imageUrl
      likesCount
      commentsCount
      buddyOnly
      user {
        id
        fullName
        profilePictureUrl
      }
      likes {
        id
        user {
          id
          fullName
          profilePictureUrl
        }
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
        likes {
          id
          user {
            id
            fullName
            profilePictureUrl
          }
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

// Get single post by ID
export const GET_SINGLE_POST = gql`
  query GetSinglePost($id: ID!) {
    post(id: $id) {
      id
      content
      createdAt
      imageUrl
      likesCount
      commentsCount
      buddyOnly
      user {
        id
        fullName
        profilePictureUrl
      }
      likes {
        id
        user {
          id
          fullName
          profilePictureUrl
        }
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
        likes {
          id
          user {
            id
            fullName
            profilePictureUrl
          }
        }
      }
    }
  }
`;
