module Types
  class PostType < Types::BaseObject
    field :id, ID, null: false
    field :user_id, Integer, null: false
    field :content, String, null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
    field :updated_at, GraphQL::Types::ISO8601DateTime, null: false
    
    # Associations
    field :user, Types::UserType, null: false
    field :comments, [Types::CommentType], null: false
    field :likes, [Types::LikeType], null: false
    
    # Custom fields
    field :likes_count, Integer, null: false
    field :comments_count, Integer, null: false
    field :image_url, String, null: true
    
    def likes_count
      object.likes.count
    end
    
    def comments_count
      object.comments.count
    end
    
    def image_url
      if object.image.attached?
        Rails.application.routes.url_helpers.rails_blob_url(object.image)
      end
    end
  end
end
