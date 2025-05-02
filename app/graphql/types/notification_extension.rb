# Module to handle notifications - more explicit loading to fix schema issues
module Types
  module NotificationExtension
    extend ActiveSupport::Concern

    included do
      field :notifications, [Types::NotificationType], null: false, description: "User's notifications"
      field :unread_notifications_count, Integer, null: false, description: "Count of user's unread notifications"
      
      # Make sure these methods are directly implemented in the type
      def notifications
        object.notifications.order(created_at: :desc)
      end
      
      def unread_notifications_count
        object.notifications.unread.count
      end
    end
  end
end
