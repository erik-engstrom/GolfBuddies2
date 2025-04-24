module Mutations
  class SendMessage < BaseMutation
    # Define what our mutation returns
    field :message, Types::MessageType, null: true
    field :errors, [String], null: false

    # Define the arguments this mutation accepts
    argument :receiver_id, ID, required: true
    argument :content, String, required: true

    def resolve(receiver_id:, content:)
      # Check if user is authenticated
      unless context[:current_user]
        return {
          message: nil,
          errors: ["You need to be logged in to send messages"]
        }
      end

      # Find the receiver
      receiver = User.find_by(id: receiver_id)
      
      unless receiver
        return {
          message: nil,
          errors: ["User not found"]
        }
      end

      # Create the message
      message = Message.new(
        sender: context[:current_user],
        receiver: receiver,
        content: content,
        read: false
      )

      # The validation in the Message model will check if users are buddies

      if message.save
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
