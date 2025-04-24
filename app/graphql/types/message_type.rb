module Types
  class MessageType < Types::BaseObject
    field :id, ID, null: false
    field :sender_id, Integer, null: false
    field :receiver_id, Integer, null: false
    field :content, String, null: false
    field :read, Boolean, null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
    field :updated_at, GraphQL::Types::ISO8601DateTime, null: false
    
    # Associations
    field :sender, Types::UserType, null: false
    field :receiver, Types::UserType, null: false
  end
end
