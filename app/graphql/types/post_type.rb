module Types
  class PostType < Types::BaseObject
    field :id, ID, null: false
    field :user_id, Integer, null: false
    field :content, String, null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
    field :updated_at, GraphQL::Types::ISO8601DateTime, null: false
    field :buddy_only, Boolean, null: true
    
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
          # Get image key to generate unique URLs and prevent caching
          image_key = object.image.key
          timestamp = Time.now.to_i

          # Force Image URL to be fresh every time
          Rails.application.routes.url_helpers.rails_blob_url(
            object.image,
            host: Rails.application.config.active_storage.default_url_options[:host] || "localhost",
            port: Rails.application.config.active_storage.default_url_options[:port] || 3000,
            # Add cache-busting query parameters
            v: timestamp,
            key: image_key
          )
        rescue => e
          Rails.logger.error("Error generating image URL: #{e.message}")
          nil
        end
      end
    end
  end
end
