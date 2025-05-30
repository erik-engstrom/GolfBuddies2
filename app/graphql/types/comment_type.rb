module Types
  class CommentType < Types::BaseObject
    field :id, ID, null: false
    field :user_id, Integer, null: false
    field :post_id, Integer, null: false
    field :content, String, null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
    field :updated_at, GraphQL::Types::ISO8601DateTime, null: false
    
    # Associations
    field :user, Types::UserType, null: false
    field :post, Types::PostType, null: false
    field :likes, [Types::LikeType], null: false
    
    # Custom fields
    field :likes_count, Integer, null: false
    field :liked_by_current_user, Boolean, null: false

    def likes_count
      object.likes.count
    end

    def liked_by_current_user
      return false unless context[:current_user]
      object.likes.exists?(user: context[:current_user])
    end
  end
end
