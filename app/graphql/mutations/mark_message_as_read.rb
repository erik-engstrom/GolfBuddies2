module Mutations
  class MarkMessageAsRead < BaseMutation
    # Define what our mutation returns
    field :message, Types::MessageType, null: true
    field :errors, [String], null: false

    # Define the arguments this mutation accepts
    argument :message_id, ID, required: true
    
    # Class variable to track recent requests and implement rate limiting
    # Key: user_id, Value: Hash with message_id => timestamp
    @@recent_requests = {}
    
    # Throttle period in seconds - don't allow duplicate requests within this window
    THROTTLE_PERIOD = 5

    def resolve(message_id:)
      # Check if user is authenticated
      unless context[:current_user]
        return {
          message: nil,
          errors: ["You need to be logged in to mark messages as read"]
        }
      end
      
      # Get user ID for tracking request frequency
      user_id = context[:current_user].id
      
      # Initialize user's request tracking if it doesn't exist
      @@recent_requests[user_id] ||= {}
      
      # Check if this is a duplicate request within the throttle period
      if @@recent_requests[user_id][message_id] && 
         Time.now.to_i - @@recent_requests[user_id][message_id] < THROTTLE_PERIOD
        
        # Return success without actually doing the DB query since we recently did this
        message = Message.find_by(id: message_id)
        return {
          message: message,
          errors: []
        }
      end
      
      # Track this request
      @@recent_requests[user_id][message_id] = Time.now.to_i
      
      # Clean up old entries occasionally to prevent memory leaks
      if rand < 0.1 # ~10% chance on each request
        cleanup_old_entries
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
      unless message.receiver_id == user_id
        return {
          message: nil,
          errors: ["You can only mark messages sent to you as read"]
        }
      end

      # Skip update if message is already read
      if message.read
        return {
          message: message,
          errors: []
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
    
    private
    
    # Clean up entries older than the throttle period
    def cleanup_old_entries
      now = Time.now.to_i
      @@recent_requests.each do |user_id, messages|
        messages.delete_if { |_, timestamp| now - timestamp > THROTTLE_PERIOD }
      end
      
      # Remove users with no messages
      @@recent_requests.delete_if { |_, messages| messages.empty? }
    end
  end
end
