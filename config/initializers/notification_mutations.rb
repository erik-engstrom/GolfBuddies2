# Load notification mutation classes
Rails.application.config.after_initialize do
  # Explicitly require notification mutation files to ensure they are loaded
  begin
    require_relative "../../app/graphql/mutations/mark_notification_as_read"
    require_relative "../../app/graphql/mutations/mark_all_notifications_as_read"
    
    # Make sure the mutation type includes our notification mutations
    if defined?(Types::MutationType) && defined?(GolfBuddies2Schema)
      Rails.logger.info "Checking notification mutations registration"
      
      # Let's just check if the mutations are properly loaded
      if !GolfBuddies2Schema.mutation.fields.key?('markNotificationAsRead')
        Rails.logger.warn "markNotificationAsRead mutation is not registered in the schema!"
        Rails.logger.info "Available mutations: #{GolfBuddies2Schema.mutation.fields.keys}"
      else
        Rails.logger.info "Notification mutations are already registered"
      end
      
      # Just to ensure these classes are loaded
      Mutations::MarkNotificationAsRead
      Mutations::MarkAllNotificationsAsRead
    end
  rescue => e
    Rails.logger.error "Failed to check notification mutations: #{e.message}"
    Rails.logger.error e.backtrace.join("\n")
  end
end
