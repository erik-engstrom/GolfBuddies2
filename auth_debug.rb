# This script helps debug authentication issues in the GolfBuddies2 app
require_relative 'config/environment'

puts "================ Authentication Debug Tool ================"
puts "This script will help diagnose JWT authentication issues\n\n"

# Check if secret key is available
puts "1. Checking Rails secret key availability"
if Rails.application.credentials.secret_key_base.present?
  puts "✅ Secret key is available"
else
  puts "❌ Secret key is NOT available - this is a critical issue!"
end

# Check if we have users in the database
puts "\n2. Checking users in the database"
users = User.all
if users.empty?
  puts "❌ No users found in the database!"
else
  puts "✅ Found #{users.count} users in the database:"
  users.each do |user|
    puts "   ID: #{user.id}, Email: #{user.email}"
  end
end

# Create a test JWT token
puts "\n3. Creating a test JWT token for the first user"
if users.first
  user = users.first
  payload = { user_id: user.id }
  token = JWT.encode(payload, Rails.application.credentials.secret_key_base, 'HS256')
  puts "✅ Successfully created a token for #{user.email} (ID: #{user.id})"
  puts "   Token: #{token}"
  
  # Test decoding the token
  puts "\n4. Testing token decode"
  begin
    decoded = JWT.decode(token, Rails.application.credentials.secret_key_base, true, { algorithm: 'HS256' }).first
    if decoded["user_id"] == user.id
      puts "✅ Token decoded successfully! User ID matches: #{decoded["user_id"]}"
    else
      puts "❌ Token decoded but user ID mismatch: expected #{user.id}, got #{decoded["user_id"]}"
    end
  rescue => e
    puts "❌ Error decoding token: #{e.message}"
  end
  
  # Manually recreate the current_user logic
  puts "\n5. Simulating the current_user authentication logic"
  begin
    decoded = JWT.decode(token, Rails.application.credentials.secret_key_base).first
    found_user = User.find_by(id: decoded['user_id'])
    if found_user
      puts "✅ User authentication successful: found #{found_user.email} (ID: #{found_user.id})"
    else
      puts "❌ User not found with ID #{decoded['user_id']}"
    end
  rescue JWT::DecodeError => e
    puts "❌ JWT decode error: #{e.message}"
  end
  
  puts "\n======= NEXT STEPS ========="
  puts "1. Open your browser to http://localhost:3000"
  puts "2. Open developer tools (F12 or right-click > Inspect)"
  puts "3. Go to the Console tab and paste this code:"
  puts "   localStorage.setItem('golfBuddiesToken', '#{token}')"
  puts "4. Reload the page - you should now be logged in as #{user.email}"
  puts "5. If this doesn't work, check if the correct headers are being sent in GraphQL requests"
else
  puts "❌ Cannot create a test token - no users in the database"
end
