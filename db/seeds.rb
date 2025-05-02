# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).

# Clear existing data
puts "Clearing existing data..."
Message.destroy_all
Notification.destroy_all # Clear notifications
BuddyRequest.destroy_all
Like.destroy_all
Comment.destroy_all
Post.destroy_all
User.destroy_all

# Create users
puts "Creating users..."
users = [
  {
    email: 'john.doe@example.com',
    password: 'password123',
    first_name: 'John',
    last_name: 'Doe',
    handicap: 12.5,
    playing_style: 'competitive'
  },
  {
    email: 'jane.smith@example.com',
    password: 'password123',
    first_name: 'Jane',
    last_name: 'Smith',
    handicap: 8.2,
    playing_style: 'fun'
  },
  {
    email: 'mike.johnson@example.com',
    password: 'password123',
    first_name: 'Mike',
    last_name: 'Johnson',
    handicap: 15.7,
    playing_style: 'social'
  },
  {
    email: 'sarah.williams@example.com',
    password: 'password123',
    first_name: 'Sarah',
    last_name: 'Williams',
    handicap: 10.3,
    playing_style: 'competitive'
  },
  {
    email: 'david.brown@example.com',
    password: 'password123',
    first_name: 'David',
    last_name: 'Brown',
    handicap: 18.9,
    playing_style: 'fun'
  }
]

created_users = users.map do |user_data|
  User.create!(user_data)
end

# Create posts
puts "Creating posts..."
posts_data = [
  {
    user: created_users[0],
    content: "Just hit my best round ever at Pebble Beach! Shot a 79 and couldn't be happier."
  },
  {
    user: created_users[1],
    content: "Any recommendations for golf courses in the San Diego area? Planning a trip next month."
  },
  {
    user: created_users[2],
    content: "Finally upgraded my driver! The new TaylorMade Stealth Plus is amazing."
  },
  {
    user: created_users[3],
    content: "Working on my short game today. Putting practice is key to lowering your score!"
  },
  {
    user: created_users[4],
    content: "Beautiful day at the course. Couldn't ask for better weather."
  },
  {
    user: created_users[0],
    content: "Pro tip: Always keep extra golf balls in your bag. You never know when you might need them!"
  },
  {
    user: created_users[2],
    content: "Who's watching the Masters this weekend? Can't wait to see who takes the green jacket."
  }
]

created_posts = posts_data.map do |post_data|
  Post.create!(post_data)
end

# Create comments
puts "Creating comments..."
comments_data = [
  {
    user: created_users[1],
    post: created_posts[0],
    content: "Congratulations! That's an amazing score!"
  },
  {
    user: created_users[2],
    post: created_posts[0],
    content: "I'm jealous! Pebble Beach is on my bucket list."
  },
  {
    user: created_users[0],
    post: created_posts[1],
    content: "Torrey Pines is a must-play. Try to get on the South Course if you can."
  },
  {
    user: created_users[4],
    post: created_posts[1],
    content: "Maderas Golf Club is amazing too. Great conditions year-round."
  },
  {
    user: created_users[3],
    post: created_posts[2],
    content: "I've been thinking about getting that driver too. How's the forgiveness?"
  },
  {
    user: created_users[0],
    post: created_posts[3],
    content: "So true! Putting is where strokes are saved."
  },
  {
    user: created_users[1],
    post: created_posts[6],
    content: "Can't wait! I'm rooting for Rory McIlroy this year."
  }
]

created_comments = comments_data.map do |comment_data|
  Comment.create!(comment_data)
end

# Create likes
puts "Creating likes..."
# Likes for posts
Post.all.each do |post|
  # Random selection of users who will like this post (between 1-3 users)
  liking_users = created_users.sample(rand(1..3))
  
  liking_users.each do |user|
    # Skip if user is the post author (to make it more realistic)
    next if user.id == post.user_id
    
    Like.create!(user: user, likeable: post)
  end
end

# Likes for comments
Comment.all.each do |comment|
  # Random selection of users who will like this comment (between 0-2 users)
  liking_users = created_users.sample(rand(0..2))
  
  liking_users.each do |user|
    # Skip if user is the comment author (to make it more realistic)
    next if user.id == comment.user_id
    
    Like.create!(user: user, likeable: comment)
  end
end

# Create buddy requests
puts "Creating buddy relationships..."
buddy_data = [
  { sender: created_users[0], receiver: created_users[1], status: 'accepted' },
  { sender: created_users[0], receiver: created_users[2], status: 'accepted' },
  { sender: created_users[1], receiver: created_users[3], status: 'accepted' },
  { sender: created_users[2], receiver: created_users[4], status: 'accepted' },
  { sender: created_users[3], receiver: created_users[0], status: 'pending' },
  { sender: created_users[4], receiver: created_users[1], status: 'pending' }
]

created_buddy_requests = buddy_data.map do |buddy_data|
  BuddyRequest.create!(buddy_data)
end

# Helper method to check if two users are buddies (have an accepted buddy request)
def are_buddies?(user1, user2)
  BuddyRequest.exists?(
    [
      { sender_id: user1.id, receiver_id: user2.id, status: 'accepted' },
      { sender_id: user2.id, receiver_id: user1.id, status: 'accepted' }
    ]
  )
end

# Create messages between buddies - only between confirmed buddies
puts "Creating messages..."
# Define message pairs that should exist between buddies
buddy_messages = [
  # Messages between user 0 and user 1 (John and Jane)
  { 
    sender: created_users[0], 
    receiver: created_users[1], 
    content: "Hey Jane, want to play a round this weekend?",
    read: true 
  },
  { 
    sender: created_users[1], 
    receiver: created_users[0], 
    content: "Sure! How about Saturday morning at City Golf Club?",
    read: true 
  },
  { 
    sender: created_users[0], 
    receiver: created_users[1], 
    content: "Perfect! Let's meet at 8am.",
    read: false 
  },
  # Messages between user 0 and user 2 (John and Mike)
  { 
    sender: created_users[0], 
    receiver: created_users[2], 
    content: "Mike, did you see the new TaylorMade irons?",
    read: true 
  },
  { 
    sender: created_users[2], 
    receiver: created_users[0], 
    content: "Yes! They look amazing. Are you thinking of getting them?",
    read: true 
  },
  # Messages between user 1 and user 3 (Jane and Sarah)
  { 
    sender: created_users[1], 
    receiver: created_users[3], 
    content: "Hey Sarah, do you have any tips for improving my driver distance?",
    read: true 
  },
  { 
    sender: created_users[3], 
    receiver: created_users[1], 
    content: "Focus on your hip rotation and weight transfer. Want to meet up for a practice session?",
    read: false 
  }
]

# Filter and create messages only between confirmed buddies
messages_created = 0
buddy_messages.each do |message_data|
  # Check if the users are buddies before creating the message
  if are_buddies?(message_data[:sender], message_data[:receiver])
    Message.create!(message_data)
    messages_created += 1
  else
    puts "Skipped message from #{message_data[:sender].full_name} to #{message_data[:receiver].full_name} - not buddies"
  end
end

puts "Created #{messages_created} messages between buddies"
puts "Seeding completed successfully!"
