# Ensure proper GraphQL type loading for notifications
Rails.application.config.to_prepare do
  # Force load notification types
  require_dependency Rails.root.join('app/graphql/types/notification_type.rb').to_s
  require_dependency Rails.root.join('app/graphql/types/notifiable_union_type.rb').to_s
  require_dependency Rails.root.join('app/graphql/types/notification_extension.rb').to_s
  
  # Ensure notification mutations are loaded
  require_dependency Rails.root.join('app/graphql/mutations/mark_notification_as_read.rb').to_s
  require_dependency Rails.root.join('app/graphql/mutations/mark_all_notifications_as_read.rb').to_s
end
