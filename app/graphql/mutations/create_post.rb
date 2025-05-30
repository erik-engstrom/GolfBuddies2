module Mutations
  class CreatePost < BaseMutation
    # Define what our mutation returns
    field :post, Types::PostType, null: true
    field :errors, [String], null: false

    # Define the arguments this mutation accepts
    argument :content, String, required: true
    argument :image, ApolloUploadServer::Upload, required: false
    argument :buddy_only, Boolean, required: false, default_value: false
    argument :include_location, Boolean, required: false, default_value: false
    
    # Location arguments
    argument :latitude, Float, required: false
    argument :longitude, Float, required: false
    argument :address, String, required: false
    argument :city, String, required: false
    argument :state, String, required: false
    argument :zip_code, String, required: false
    argument :country, String, required: false

    def resolve(content:, image: nil, buddy_only: false, include_location: false, **location_args)
      # Ensure current user is signed in
      unless context[:current_user]
        return { post: nil, errors: ["You must be signed in to create a post"] }
      end
      
      # Filter location arguments based on include_location flag
      filtered_location_args = include_location ? location_args : {}
      
      # Create the post
      post = context[:current_user].posts.new(
        content: content,
        buddy_only: buddy_only,
        **filtered_location_args
      )

      # Attach image if provided
      if image
        begin
          post.image.attach(io: image, filename: "post_image_#{Time.now.to_i}")
          
          # Set the image URL after attachment
          if post.image.attached?
            # URL will be set by Active Storage
          end
        rescue StandardError => e
          return { post: nil, errors: ["Error uploading image: #{e.message}"] }
        end
      end

      # Save the post
      if post.save
        # Return the created post
        { post: post, errors: [] }
      else
        # Return errors if save failed
        { post: nil, errors: post.errors.full_messages }
      end
    end
  end
end
