module Types
  class LikeType < Types::BaseObject
    field :id, ID, null: false
    field :user_id, Integer, null: false
    field :likeable_type, String, null: false
    field :likeable_id, Integer, null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
    field :updated_at, GraphQL::Types::ISO8601DateTime, null: false
    
    # Associations
    field :user, Types::UserType, null: false
  end
end
