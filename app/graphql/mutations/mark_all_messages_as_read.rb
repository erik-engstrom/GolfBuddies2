module Mutations
  class MarkAllMessagesAsRead < BaseMutation
    field :success, Boolean, null: false
    field :errors, [String], null: false
    field :updated_count, Integer, null: false

    argument :buddy_id, ID, required: true

    def resolve(buddy_id:)
      user = context[:current_user]
      return { success: false, errors: ["Not authenticated"], updated_count: 0 } unless user

      buddy = User.find_by(id: buddy_id)
      return { success: false, errors: ["Buddy not found"], updated_count: 0 } unless buddy

      # Mark all messages from buddy to current user as read
      messages = Message.where(sender_id: buddy.id, receiver_id: user.id, read: false)
      
      # Get the messages before updating them all
      messages_to_update = messages.to_a
      
      # Update them all at once for efficiency
      updated_count = messages.update_all(read: true)
      
      if updated_count > 0
        # Trigger subscriptions for each updated message
        messages_to_update.each do |message|
          # Refresh the message to get updated attributes
          message.reload
          
          # Trigger subscription for message read status update
          GolfBuddies2Schema.subscriptions.trigger(
            :message_read_status_updated,
            { user_id: user.id },
            message
          )
          
          # Also trigger for the sender so they can see the message was read
          GolfBuddies2Schema.subscriptions.trigger(
            :message_read_status_updated,
            { user_id: buddy.id },
            message
          )
        end
      end

      { success: true, errors: [], updated_count: updated_count }
    rescue => e
      { success: false, errors: [e.message], updated_count: 0 }
    end
  end
end
