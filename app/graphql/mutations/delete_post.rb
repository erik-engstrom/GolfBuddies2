module Mutations
  class DeletePost < BaseMutation
    # Fields that the mutation will return
    field :success, Boolean, null: false
    field :errors, [String], null: false

    # Arguments that the mutation accepts
    argument :id, ID, required: true

    def resolve(id:)
      # Check if user is authenticated
      unless context[:current_user]
        return {
          success: false,
          errors: ["You need to be logged in to delete a post"]
        }
      end

      # Find the post
      post = Post.find_by(id: id)
      
      # Check if post exists
      unless post
        return {
          success: false,
          errors: ["Post not found"]
        }
      end
      
      # Check if current user is the author of the post
      unless post.user_id == context[:current_user].id
        return {
          success: false,
          errors: ["You can only delete your own posts"]
        }
      end
      
      # Try to delete the post
      if post.destroy
        {
          success: true,
          errors: []
        }
      else
        {
          success: false,
          errors: post.errors.full_messages
        }
      end
    end
  end
end
