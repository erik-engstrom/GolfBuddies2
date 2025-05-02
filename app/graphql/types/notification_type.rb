module Types
  class NotificationType < Types::BaseObject
    field :id, ID, null: false
    field :user, Types::UserType, null: false
    field :notifiable_type, String, null: false
    field :notifiable_id, ID, null: false
    field :action, String, null: true
    field :read, Boolean, null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
    field :updated_at, GraphQL::Types::ISO8601DateTime, null: false

    # Add a field to get the associated entity (post, comment, buddy_request)
    field :notifiable, Types::NotifiableUnionType, null: true

    # Add a message field for displaying to the user
    field :message, String, null: false

    def message
      begin
        case object.notifiable_type
        when "Like"
          like = object.notifiable
          if like && like.user
            if like.likeable_type == "Post"
              "#{like.user.full_name} liked your post"
            elsif like.likeable_type == "Comment"
              "#{like.user.full_name} liked your comment"
            else
              "Someone liked your content"
            end
          else
            "You received a like"
          end
        when "Comment"
          comment = object.notifiable
          if comment && comment.user
            "#{comment.user.full_name} commented on your post"
          else
            "Someone commented on your post"
          end
        when "BuddyRequest"
          buddy_request = object.notifiable
          if buddy_request && buddy_request.sender
            "#{buddy_request.sender.full_name} sent you a buddy request"
          else
            "You received a buddy request"
          end
        else
          "You have a new notification"
        end
      rescue => e
        Rails.logger.error("Error generating notification message: #{e.message}")
        "You have a new notification"
      end
    end

    def notifiable
      object.notifiable
    end
  end
end
