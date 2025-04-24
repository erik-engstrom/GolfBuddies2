module Mutations
  class AddPostImage < BaseMutation
    # Remove the incorrect include statement
    
    # Define what our mutation returns
    field :post, Types::PostType, null: true
    field :errors, [String], null: false

    # Define the arguments this mutation accepts
    argument :post_id, ID, required: true
    argument :image, ApolloUploadServer::Upload, required: true

    def resolve(post_id:, image:)
      # Check if user is authenticated
      unless context[:current_user]
        return {
          post: nil,
          errors: ["You need to be logged in to add an image to a post"]
        }
      end

      post = Post.find_by(id: post_id)
      
      unless post
        return {
          post: nil,
          errors: ["Post not found"]
        }
      end
      
      # Ensure the user owns this post
      unless post.user_id == context[:current_user].id
        return {
          post: nil,
          errors: ["You can only add images to your own posts"]
        }
      end
      
      # Attach the uploaded file
      begin
        post.image.attach(image)
        
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
      rescue => e
        {
          post: nil,
          errors: [e.message]
        }
      end
    end
  end
end
