module Mutations
  class RespondToBuddyRequest < BaseMutation
    # Define what our mutation returns
    field :buddy_request, Types::BuddyRequestType, null: true
    field :errors, [String], null: false

    # Define the arguments this mutation accepts
    argument :buddy_request_id, ID, required: true
    argument :accept, Boolean, required: true

    def resolve(buddy_request_id:, accept:)
      # Check if user is authenticated
      unless context[:current_user]
        return {
          buddy_request: nil,
          errors: ["You need to be logged in to respond to a buddy request"]
        }
      end

      # Find the buddy request
      buddy_request = BuddyRequest.find_by(id: buddy_request_id)
      
      unless buddy_request
        return {
          buddy_request: nil,
          errors: ["Buddy request not found"]
        }
      end

      # Check if the current user is the receiver of this request
      unless buddy_request.receiver_id == context[:current_user].id
        return {
          buddy_request: nil,
          errors: ["You can only respond to buddy requests sent to you"]
        }
      end

      # Check if the request is already accepted or declined
      unless buddy_request.status == 'pending'
        return {
          buddy_request: buddy_request,
          errors: ["This buddy request has already been #{buddy_request.status}"]
        }
      end

      # Update the status based on the response
      new_status = accept ? 'accepted' : 'declined'
      
      if buddy_request.update(status: new_status)
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
