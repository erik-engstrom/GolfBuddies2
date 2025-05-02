namespace :graphql do
  desc "Dumps the GraphQL schema information"
  task dump_type_info: :environment do
    puts "Checking UserType fields..."
    user_type = Types::UserType
    puts "Defined fields: #{user_type.fields.keys}"
    
    puts "\nChecking NotificationType fields..."
    notification_type = Types::NotificationType
    puts "Defined fields: #{notification_type.fields.keys}"
    
    puts "\nChecking schema..."
    schema = GolfBuddies2Schema
    puts "Schema query type: #{schema.query}"
    puts "Schema types: #{schema.types.keys}"
  end
end
