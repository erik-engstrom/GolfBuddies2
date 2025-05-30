module Types
  class PostType < Types::BaseObject
    field :id, ID, null: false
    field :user_id, Integer, null: false
    field :content, String, null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
    field :updated_at, GraphQL::Types::ISO8601DateTime, null: false
    field :buddy_only, Boolean, null: true
    
    # Location fields
    field :latitude, Float, null: true
    field :longitude, Float, null: true
    field :address, String, null: true
    field :city, String, null: true
    field :state, String, null: true
    field :zip_code, String, null: true, camelize: false
    field :country, String, null: true
    field :distance, Float, null: true, description: "Distance from the search coordinates (only present when searching by location)"
    
    # Image field
    field :image_url, String, null: true
    
    # Computed fields
    field :likes_count, Integer, null: false
    field :comments_count, Integer, null: false
    
    # Associations
    field :user, Types::UserType, null: false
    field :likes, [Types::LikeType], null: false
    field :comments, Types::CommentType.connection_type, null: false do
      argument :order_by, String, required: false, default_value: "newest"
    end
    
    def likes_count
      object.likes.count
    end
    
    def comments_count
      object.comments.count
    end
    
    def comments(order_by:)
      case order_by
      when "oldest"
        object.comments.order(created_at: :asc)
      else # "newest"
        object.comments.order(created_at: :desc)
      end
    end
    
    def distance
      # Distance will be populated in resolver when doing location-based queries
      # Return a fallback value of nil for regular queries
      object.respond_to?(:distance) ? object.distance : nil
    end
    
    # Use a single method that will be properly camelized by GraphQL
    def zip_code
      object.zip_code
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
