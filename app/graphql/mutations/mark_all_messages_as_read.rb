module Mutations
  class MarkAllMessagesAsRead < BaseMutation
    field :success, Boolean, null: false
    field :errors, [String], null: false

    argument :buddy_id, ID, required: true

    def resolve(buddy_id:)
      user = context[:current_user]
      return { success: false, errors: ["Not authenticated"] } unless user

      buddy = User.find_by(id: buddy_id)
      return { success: false, errors: ["Buddy not found"] } unless buddy

      # Mark all messages from buddy to current user as read
      messages = Message.where(sender_id: buddy.id, receiver_id: user.id, read: false)
      updated = messages.update_all(read: true)

      { success: true, errors: [] }
    rescue => e
      { success: false, errors: [e.message] }
    end
  end
end
