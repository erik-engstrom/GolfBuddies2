module Mutations
  class UpdatePost < BaseMutation
    # Fields that the mutation will return
    field :post, Types::PostType, null: true
    field :errors, [String], null: false

    # Arguments that the mutation accepts
    argument :id, ID, required: true
    argument :content, String, required: true

    def resolve(id:, content:)
      # Check if user is authenticated
      unless context[:current_user]
        return {
          post: nil,
          errors: ["You need to be logged in to update a post"]
        }
      end

      # Find the post
      post = Post.find_by(id: id)
      
      # Check if post exists
      unless post
        return {
          post: nil,
          errors: ["Post not found"]
        }
      end
      
      # Check if current user is the author of the post
      unless post.user_id == context[:current_user].id
        return {
          post: nil,
          errors: ["You can only update your own posts"]
        }
      end
      
      # Update the post content
      post.content = content
      
      # Save the post
      if post.save
        {
          post: post,
          errors: []
        }
      else
        {
          post: nil,
          errors: post.errors.full_messages
        }
      end
    end
  end
end
