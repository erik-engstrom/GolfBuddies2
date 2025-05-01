import { gql } from '@apollo/client';

export const MARK_ALL_MESSAGES_AS_READ_MUTATION = gql`
  mutation MarkAllMessagesAsRead($buddyId: ID!) {
    markAllMessagesAsRead(input: { buddyId: $buddyId }) {
      success
      errors
    }
  }
`;
