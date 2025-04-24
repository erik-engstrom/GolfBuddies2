module Mutations
  class MarkMessageAsRead < BaseMutation
    # Define what our mutation returns
    field :message, Types::MessageType, null: true
    field :errors, [String], null: false

    # Define the arguments this mutation accepts
    argument :message_id, ID, required: true

    def resolve(message_id:)
      # Check if user is authenticated
      unless context[:current_user]
        return {
          message: nil,
          errors: ["You need to be logged in to mark messages as read"]
        }
      end

      # Find the message
      message = Message.find_by(id: message_id)
      
      unless message
        return {
          message: nil,
          errors: ["Message not found"]
        }
      end

      # Ensure user is the receiver of this message
      unless message.receiver_id == context[:current_user].id
        return {
          message: nil,
          errors: ["You can only mark messages sent to you as read"]
        }
      end

      # Mark the message as read
      if message.update(read: true)
        {
          message: message,
          errors: []
        }
      else
        {
          message: nil,
          errors: message.errors.full_messages
        }
      end
    end
  end
end
