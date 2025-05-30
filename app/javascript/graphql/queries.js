import { gql } from '@apollo/client';
import { POST_FRAGMENT, COMMENT_FRAGMENT } from './fragments';

// User queries
export const CURRENT_USER_QUERY = gql`
  query CurrentUser {
    currentUser {
      id
      email
      fullName
      username
      profilePictureUrl
      bio
      handicap
      favoriteCourse
      city
      state
      zip_code
      latitude
      longitude
      unreadNotificationsCount
      unreadMessagesCount
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
        comments(first: 5) {
          edges {
            node {
              id
              content
              createdAt
              likesCount
              likedByCurrentUser
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
          pageInfo {
            hasNextPage
            endCursor
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
  query GetFeedPosts($cursor: String, $locationFilter: LocationFilterInput) {
    posts(first: 10, after: $cursor, locationFilter: $locationFilter) {
      edges {
        node {
          ...PostFields
          comments(first: 3) {
            edges {
              node {
                ...CommentFields
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
  ${POST_FRAGMENT}
  ${COMMENT_FRAGMENT}
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
      username
      profilePictureUrl
      handicap
      city
      state
    }
    me {
      id
      unreadMessagesCountByBuddy
    }
  }
`;

export const GET_BUDDY_SUGGESTIONS = gql`
  query GetBuddySuggestions {
    buddySuggestions(first: 5) {
      id
      fullName
      username
      profilePictureUrl
      handicap
      city
      state
      mutualBuddiesCount
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
      fullName
      username
      profilePictureUrl
      bio
      handicap
      isFollowing
    }
  }
`;

export const VALIDATE_USERNAME = gql`
  query ValidateUsername($username: String!) {
    validateUsername(username: $username) {
      valid
      message
    }
  }
`;

export const VALIDATE_EMAIL = gql`
  query ValidateEmail($email: String!) {
    validateEmail(email: $email) {
      valid
      message
    }
  }
`;

// Get single post by ID
export const GET_SINGLE_POST = gql`
  query GetSinglePost($id: ID!) {
    post(id: $id) {
      ...PostFields
      comments(first: 10) {
        edges {
          node {
            ...CommentFields
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
  ${POST_FRAGMENT}
  ${COMMENT_FRAGMENT}
`;

export const GET_NOTIFICATIONS = gql`
  query GetNotifications($cursor: String) {
    notifications(first: 20, after: $cursor) {
      edges {
        node {
          id
          notificationType
          message
          read
          targetId
          targetType
          createdAt
          actor {
            id
            fullName
            profilePictureUrl
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const GET_CONVERSATIONS = gql`
  query GetConversations {
    conversations {
      id
      updatedAt
      lastMessage {
        id
        content
        createdAt
      }
      unreadCount
      otherUser {
        id
        fullName
        profilePictureUrl
        username
      }
    }
  }
`;

export const GET_CONVERSATION = gql`
  query GetConversation($id: ID!, $cursor: String) {
    conversation(id: $id) {
      id
      messages(first: 20, after: $cursor) {
        edges {
          node {
            id
            content
            createdAt
            sender {
              id
              fullName
              profilePictureUrl
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
      otherUser {
        id
        fullName
        profilePictureUrl
        username
      }
    }
  }
`;

export const GET_USER_POSTS = gql`
  query GetUserPosts($userId: ID!, $cursor: String) {
    userPosts(userId: $userId, first: 10, after: $cursor) {
      edges {
        node {
          ...PostFields
          comments(first: 3) {
            edges {
              node {
                ...CommentFields
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
  ${POST_FRAGMENT}
  ${COMMENT_FRAGMENT}
`;

export const GET_MORE_COMMENTS = gql`
  query GetMoreComments($postId: ID!, $cursor: String) {
    post(id: $postId) {
      id
      comments(first: 10, after: $cursor) {
        edges {
          node {
            ...CommentFields
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
  ${COMMENT_FRAGMENT}
`;

export const GET_POSTS_NEAR_ME = gql`
  query GetPostsNearMe($latitude: Float!, $longitude: Float!, $distance: Float, $cursor: String) {
    postsNearMe(latitude: $latitude, longitude: $longitude, distance: $distance, first: 10, after: $cursor) {
      edges {
        node {
          ...PostFields
          comments(first: 3) {
            edges {
              node {
                ...CommentFields
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
  ${POST_FRAGMENT}
  ${COMMENT_FRAGMENT}
`;
