module Mutations
  class CreatePost < BaseMutation
    # Define what our mutation returns
    field :post, Types::PostType, null: true
    field :errors, [String], null: false

    # Define the arguments this mutation accepts
    argument :content, String, required: true
    argument :buddy_only, Boolean, required: false, default_value: false
    # We'll handle image upload with a separate mutation for simplicity

    def resolve(content:, buddy_only: false)
      # Check if user is authenticated
      unless context[:current_user]
        return {
          post: nil,
          errors: ["You need to be logged in to create a post"]
        }
      end

      post = context[:current_user].posts.build(content: content, buddy_only: buddy_only)

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
