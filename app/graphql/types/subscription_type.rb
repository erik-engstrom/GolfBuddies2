# frozen_string_literal: true

module Types
  class SubscriptionType < Types::BaseObject
    field :message_received, Types::MessageType, null: false do
      argument :user_id, ID, required: true
      description "Called when a message is received"
    end

    def message_received(user_id:)
      object
    end
  end
end
