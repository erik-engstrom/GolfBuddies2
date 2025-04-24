module Types
  class UserType < Types::BaseObject
    field :id, ID, null: false
    field :email, String, null: false
    field :first_name, String, null: false
    field :last_name, String, null: false
    field :handicap, Float, null: true
    field :playing_style, String, null: true
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
    field :updated_at, GraphQL::Types::ISO8601DateTime, null: false
    
    # Add associations
    field :posts, [Types::PostType], null: false
    field :comments, [Types::CommentType], null: false
    field :sent_buddy_requests, [Types::BuddyRequestType], null: false
    field :received_buddy_requests, [Types::BuddyRequestType], null: false
    
    # Custom fields
    field :full_name, String, null: false
    field :profile_picture_url, String, null: true
    field :unread_messages_count, Integer, null: false
    
    def full_name
      "#{object.first_name} #{object.last_name}"
    end
    
    def profile_picture_url
      if object.profile_picture.attached?
        Rails.application.routes.url_helpers.rails_blob_url(object.profile_picture)
      end
    end
    
    def unread_messages_count
      object.unread_messages_count
    end
  end
end
