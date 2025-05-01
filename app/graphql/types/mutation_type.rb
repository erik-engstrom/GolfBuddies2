# frozen_string_literal: true

module Types
  class MutationType < Types::BaseObject
    # Authentication mutations
    field :sign_up, mutation: Mutations::SignUp
    field :sign_in, mutation: Mutations::SignIn
    field :logout, mutation: Mutations::Logout
    
    # Post mutations
    field :create_post, mutation: Mutations::CreatePost
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
  end
end
