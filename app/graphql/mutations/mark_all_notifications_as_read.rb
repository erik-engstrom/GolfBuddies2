module Mutations
  class MarkAllNotificationsAsRead < BaseMutation
    field :success, Boolean, null: false
    field :errors, [String], null: false

    def resolve
      unless context[:current_user]
        return {
          success: false,
          errors: ["Not authenticated"]
        }
      end

      notifications = Notification.where(user_id: context[:current_user].id, read: false)
      if notifications.update_all(read: true)
        {
          success: true,
          errors: []
        }
      else
        {
          success: false,
          errors: ["Failed to mark all notifications as read"]
        }
      end
    end
  end
end
