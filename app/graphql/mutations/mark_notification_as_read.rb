module Mutations
  class MarkNotificationAsRead < BaseMutation
    argument :id, ID, required: true

    field :success, Boolean, null: false
    field :errors, [String], null: false

    def resolve(id:)
      # Ensure user is authenticated
      unless context[:current_user]
        return {
          success: false,
          errors: ["Not authenticated"]
        }
      end

      notification = Notification.find_by(id: id)

      if !notification
        return {
          success: false,
          errors: ["Notification not found"]
        }
      end

      # Ensure user can only mark their own notifications as read
      if notification.user_id != context[:current_user].id
        return {
          success: false,
          errors: ["You can only mark your own notifications as read"]
        }
      end

      if notification.update(read: true)
        {
          success: true,
          errors: []
        }
      else
        {
          success: false,
          errors: notification.errors.full_messages
        }
      end
    end
  end
end
