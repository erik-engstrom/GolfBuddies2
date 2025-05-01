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
        # Add host configuration for URL generation
        begin
          Rails.application.routes.url_helpers.rails_blob_url(
            object.image, 
            host: Rails.application.config.active_storage.default_url_options[:host] || "localhost",
            port: Rails.application.config.active_storage.default_url_options[:port] || 3000
          )
        rescue => e
          Rails.logger.error("Error generating image URL: #{e.message}")
          nil
        end
      end
    end
  end
end
