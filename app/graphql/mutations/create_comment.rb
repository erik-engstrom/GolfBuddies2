module Mutations
  class CreateComment < BaseMutation
    # Define what our mutation returns
    field :comment, Types::CommentType, null: true
    field :errors, [String], null: false

    # Define the arguments this mutation accepts
    argument :post_id, ID, required: true
    argument :content, String, required: true

    def resolve(post_id:, content:)
      # Check if user is authenticated
      unless context[:current_user]
        return {
          comment: nil,
          errors: ["You need to be logged in to comment"]
        }
      end

      post = Post.find_by(id: post_id)
      
      unless post
        return {
          comment: nil,
          errors: ["Post not found"]
        }
      end

      comment = post.comments.build(content: content, user: context[:current_user])

      if comment.save
        {
          comment: comment,
          errors: []
        }
      else
        {
          comment: nil,
          errors: comment.errors.full_messages
        }
      end
    end
  end
end
