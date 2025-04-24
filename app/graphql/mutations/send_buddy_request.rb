module Mutations
  class SendBuddyRequest < BaseMutation
    # Define what our mutation returns
    field :buddy_request, Types::BuddyRequestType, null: true
    field :errors, [String], null: false

    # Define the arguments this mutation accepts
    argument :receiver_id, ID, required: true

    def resolve(receiver_id:)
      # Check if user is authenticated
      unless context[:current_user]
        return {
          buddy_request: nil,
          errors: ["You need to be logged in to send a buddy request"]
        }
      end

      # Find the receiver
      receiver = User.find_by(id: receiver_id)
      
      unless receiver
        return {
          buddy_request: nil,
          errors: ["User not found"]
        }
      end

      # Check if user is trying to add themselves
      if context[:current_user].id == receiver.id
        return {
          buddy_request: nil,
          errors: ["You cannot send a buddy request to yourself"]
        }
      end

      # Check if a buddy request already exists
      existing_request = BuddyRequest.find_by(
        sender_id: context[:current_user].id,
        receiver_id: receiver.id
      )

      if existing_request
        return {
          buddy_request: existing_request,
          errors: ["Buddy request already exists"]
        }
      end

      # Check if the receiver has already sent a request to the current user
      reverse_request = BuddyRequest.find_by(
        sender_id: receiver.id,
        receiver_id: context[:current_user].id
      )

      if reverse_request
        return {
          buddy_request: reverse_request,
          errors: ["This user has already sent you a buddy request"]
        }
      end

      # Create the buddy request
      buddy_request = BuddyRequest.new(
        sender: context[:current_user],
        receiver: receiver,
        status: 'pending'
      )

      if buddy_request.save
        {
          buddy_request: buddy_request,
          errors: []
        }
      else
        {
          buddy_request: nil,
          errors: buddy_request.errors.full_messages
        }
      end
    end
  end
end
