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
    field :unread_messages_count_by_buddy, GraphQL::Types::JSON, null: false
    
    # Buddy relationship fields
    field :is_buddy, Boolean, null: false
    field :outgoing_buddy_request, Types::BuddyRequestType, null: true
    field :incoming_buddy_request, Types::BuddyRequestType, null: true
    field :buddies, [Types::UserType], null: false
    
    def full_name
      "#{object.first_name} #{object.last_name}"
    end
    
    def profile_picture_url
      if object.profile_picture.attached?
        Rails.application.routes.url_helpers.rails_blob_url(
          object.profile_picture,
          host: ENV['HOST'] || 'localhost:3000'
        )
      end
    end
    
    def unread_messages_count
      object.unread_messages_count
    end
    
    def unread_messages_count_by_buddy
      object.unread_messages_count_by_buddy
    end
    
    # Buddy relationship resolvers
    def is_buddy
      current_user = context[:current_user]
      return false unless current_user
      return false if current_user.id == object.id # A user is not buddies with themselves
      
      # Check if they are buddies (accepted buddy request in either direction)
      BuddyRequest.exists?(
        status: 'accepted',
        sender_id: [current_user.id, object.id],
        receiver_id: [current_user.id, object.id]
      )
    end

    def buddies
      # Find all users who have an accepted buddy request with this user
      buddy_ids = BuddyRequest.where(
        status: 'accepted'
      ).where(
        'sender_id = :user_id OR receiver_id = :user_id', 
        user_id: object.id
      ).pluck(:sender_id, :receiver_id).flatten.uniq - [object.id]
      
      User.where(id: buddy_ids)
    end
    
    def outgoing_buddy_request
      current_user = context[:current_user]
      return nil unless current_user
      return nil if current_user.id == object.id
      
      BuddyRequest.find_by(
        sender_id: current_user.id,
        receiver_id: object.id
      )
    end
    
    def incoming_buddy_request
      current_user = context[:current_user]
      return nil unless current_user
      return nil if current_user.id == object.id
      
      BuddyRequest.find_by(
        sender_id: object.id,
        receiver_id: current_user.id
      )
    end
  end
end
