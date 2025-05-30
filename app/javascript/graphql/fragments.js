import { gql } from '@apollo/client';

export const POST_FRAGMENT = gql`
  fragment PostFields on Post {
    id
    content
    createdAt
    imageUrl
    latitude
    longitude
    city
    state
    zip_code
    country
    distance
    buddyOnly
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
    user {
      id
      fullName
      profilePictureUrl
      username
    }
  }
`;

export const COMMENT_FRAGMENT = gql`
  fragment CommentFields on Comment {
    id
    content
    createdAt
    likesCount
    likedByCurrentUser
    likes {
      id
      user {
        id
        fullName
        profilePictureUrl
      }
    }
    user {
      id
      fullName
      profilePictureUrl
    }
  }
`;