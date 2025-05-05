# frozen_string_literal: true

module Types
  class MutationType < Types::BaseObject
    # Explicitly require notification mutation files
    require_relative '../mutations/mark_notification_as_read'
    require_relative '../mutations/mark_all_notifications_as_read'
    
    # Authentication mutations
    field :sign_up, mutation: Mutations::SignUp
    field :sign_in, mutation: Mutations::SignIn
    field :logout, mutation: Mutations::Logout
    field :refresh_token, mutation: Mutations::RefreshToken
    
    # Post mutations
    field :create_post, mutation: Mutations::CreatePost
    field :update_post, mutation: Mutations::UpdatePost
    field :delete_post, mutation: Mutations::DeletePost
    field :create_comment, mutation: Mutations::CreateComment
    field :toggle_like, mutation: Mutations::ToggleLike
    
    # Buddy system mutations
    field :send_buddy_request, mutation: Mutations::SendBuddyRequest
    field :respond_to_buddy_request, mutation: Mutations::RespondToBuddyRequest
    
    # Messaging mutations
    field :send_message, mutation: Mutations::SendMessage
    field :mark_message_as_read, mutation: Mutations::MarkMessageAsRead
    field :mark_all_messages_as_read, mutation: Mutations::MarkAllMessagesAsRead
    
    # File upload mutations
    field :update_profile_picture, mutation: Mutations::UpdateProfilePicture
    field :add_post_image, mutation: Mutations::AddPostImage
    
    # Notification mutations
    field :mark_notification_as_read, mutation: Mutations::MarkNotificationAsRead
    field :mark_all_notifications_as_read, mutation: Mutations::MarkAllNotificationsAsRead
  end
end
