#!/usr/bin/env ruby

require_relative 'config/environment'

# Create test data
user = User.create!(
  email: 'test@example.com',
  password: 'password123',
  password_confirmation: 'password123',
  first_name: 'Test',
  last_name: 'User'
)

post = Post.create!(
  content: 'Test post content',
  user: user
)

comment = Comment.create!(
  content: 'Test comment content',
  post: post,
  user: user
)

# Test the mutation
query = <<~GQL
  mutation ToggleLike($likeableId: ID!, $likeableType: String!) {
    toggleLike(input: {likeableId: $likeableId, likeableType: $likeableType}) {
      liked
      comment {
        id
        likesCount
        likedByCurrentUser
        likes {
          id
          user {
            id
            fullName
          }
        }
      }
      post {
        id
        likesCount
        likedByCurrentUser
      }
      errors
    }
  }
GQL

variables = { 
  likeableId: comment.id.to_s,
  likeableType: 'Comment'
}

context = { current_user: user }

result = GolfBuddies2Schema.execute(query, variables: variables, context: context)

puts "Result: #{result.to_h}"
puts "Data: #{result.to_h['data']}"
puts "Errors: #{result.to_h['errors']}"

# Clean up
user.destroy
