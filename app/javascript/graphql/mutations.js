import { gql } from '@apollo/client';

// Authentication mutations
export const SIGN_UP_MUTATION = gql`
  mutation SignUp(
    $email: String!
    $password: String!
    $passwordConfirmation: String!
    $firstName: String!
    $lastName: String!
    $handicap: Float
    $playingStyle: String
  ) {
    signUp(input: {
      email: $email
      password: $password
      passwordConfirmation: $passwordConfirmation
      firstName: $firstName
      lastName: $lastName
      handicap: $handicap
      playingStyle: $playingStyle
    }) {
      token
      user {
        id
        email
        fullName
      }
      errors
    }
  }
`;

export const SIGN_IN_MUTATION = gql`
  mutation SignIn($email: String!, $password: String!) {
    signIn(input: {email: $email, password: $password}) {
      token
      user {
        id
        email
        fullName
      }
      errors
    }
  }
`;

// Post mutations
export const CREATE_POST_MUTATION = gql`
  mutation CreatePost(
    $content: String!, 
    $buddyOnly: Boolean, 
    $includeLocation: Boolean, 
    $latitude: Float, 
    $longitude: Float
  ) {
    createPost(input: {
      content: $content, 
      buddyOnly: $buddyOnly,
      includeLocation: $includeLocation,
      latitude: $latitude,
      longitude: $longitude
    }) {
      post {
        id
        content
        createdAt
        imageUrl
        buddyOnly
        user {
          id
          fullName
        }
      }
      errors
    }
  }
`;

export const UPDATE_POST_MUTATION = gql`
  mutation UpdatePost($id: ID!, $content: String!) {
    updatePost(input: {id: $id, content: $content}) {
      post {
        id
        content
        createdAt
        imageUrl
        user {
          id
          fullName
        }
      }
      errors
    }
  }
`;

export const DELETE_POST_MUTATION = gql`
  mutation DeletePost($id: ID!) {
    deletePost(input: {id: $id}) {
      success
      errors
    }
  }
`;

export const CREATE_COMMENT_MUTATION = gql`
  mutation CreateComment($postId: ID!, $content: String!) {
    createComment(input: {postId: $postId, content: $content}) {
      comment {
        id
        content
        createdAt
        user {
          id
          fullName
          profilePictureUrl
        }
      }
      errors
    }
  }
`;

export const TOGGLE_LIKE_MUTATION = gql`
  mutation ToggleLike($likeableId: ID!, $likeableType: String!) {
    toggleLike(input: {likeableId: $likeableId, likeableType: $likeableType}) {
      likeable
      liked
      errors
    }
  }
`;

// File upload mutations
export const UPDATE_PROFILE_PICTURE_MUTATION = gql`
  mutation UpdateProfilePicture($profilePicture: Upload!) {
    updateProfilePicture(input: { profilePicture: $profilePicture }) {
      user {
        id
        profilePictureUrl
      }
      errors
    }
  }
`;

export const ADD_POST_IMAGE_MUTATION = gql`
  mutation AddPostImage($post_id: ID!, $image: Upload!) {
    addPostImage(input: {postId: $post_id, image: $image}) {
      post {
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
      errors
    }
  }
`;

// Buddy system mutations
export const SEND_BUDDY_REQUEST_MUTATION = gql`
  mutation SendBuddyRequest($receiverId: ID!) {
    sendBuddyRequest(input: {receiverId: $receiverId}) {
      buddyRequest {
        id
        status
        sender {
          id
          fullName
        }
        receiver {
          id
          fullName
        }
      }
      errors
    }
  }
`;

export const RESPOND_TO_BUDDY_REQUEST_MUTATION = gql`
  mutation RespondToBuddyRequest($buddyRequestId: ID!, $accept: Boolean!) {
    respondToBuddyRequest(input: {buddyRequestId: $buddyRequestId, accept: $accept}) {
      buddyRequest {
        id
        status
        sender {
          id
          fullName
        }
        receiver {
          id
          fullName
        }
      }
      errors
    }
  }
`;

// Messaging mutations
export const SEND_MESSAGE_MUTATION = gql`
  mutation SendMessage($receiverId: ID!, $content: String!) {
    sendMessage(input: {receiverId: $receiverId, content: $content}) {
      message {
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
      errors
    }
  }
`;

export const MARK_MESSAGE_AS_READ_MUTATION = gql`
  mutation MarkMessageAsRead($messageId: ID!) {
    markMessageAsRead(messageId: $messageId) {
      message {
        id
        read
      }
      errors
    }
  }
`;

export const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout {
      success
      errors
    }
  }
`;
