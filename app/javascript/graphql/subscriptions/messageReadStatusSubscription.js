import { gql } from '@apollo/client';

export const MESSAGE_READ_STATUS_UPDATED_SUBSCRIPTION = gql`
  subscription MessageReadStatusUpdated($userId: ID!) {
    messageReadStatusUpdated(userId: $userId) {
      id
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
