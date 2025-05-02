namespace :notifications do
  desc "Creates a test notification for a user"
  task create_test: :environment do
    # Find a user
    user = User.first
    
    if user.nil?
      puts "No users found. Please run db:seed first."
      exit
    end
    
    # Create a test notification
    notification = Notification.create!(
      user: user,
      notifiable_type: 'BuddyRequest',  # Using buddy request as a simple example
      notifiable_id: 1,                 # This is just a dummy ID
      action: 'test',
      read: false
    )
    
    puts "Created test notification with ID: #{notification.id} for user: #{user.full_name}"
    puts "To view this notification, log in as #{user.email} with password 'password123'"
  end
end
