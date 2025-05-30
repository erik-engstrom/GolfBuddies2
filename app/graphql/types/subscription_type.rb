# frozen_string_literal: true

module Types
  class SubscriptionType < Types::BaseObject
    field :message_received, Types::MessageType, null: true do
      argument :user_id, ID, required: true
      description "Called when a message is received"
    end

    def message_received(user_id:)
      # Return the message object if it's valid
      # If object is nil or not a Message, this will likely cause a type error
      # Since this field is nullable (null: true), we can return nil safely
      
      # In subscriptions, object should be the Message instance being broadcasted
      if object.is_a?(Message)
        object
      else
        # Log the issue
        Rails.logger.error "Expected Message but got #{object.class.name || 'nil'} in message_received subscription"
        # Return nil instead of trying to find a fallback message
        nil
      end
    end
    
    field :message_read_status_updated, Types::MessageType, null: true do
      argument :user_id, ID, required: true
      description "Called when a message's read status is updated"
    end

    def message_read_status_updated(user_id:)
      # Return the message object if it's valid
      # If object is nil or not a Message, handle the error gracefully
      if object.is_a?(Message)
        object
      else
        # Log the issue
        Rails.logger.error "Expected Message but got #{object.class.name || 'nil'} in message_read_status_updated subscription"
        # Return nil instead of trying to find a fallback message
        nil
      end
    end
  end
end
