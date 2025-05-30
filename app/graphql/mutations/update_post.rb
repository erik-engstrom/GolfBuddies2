module Mutations
  class UpdatePost < BaseMutation
    # Fields that the mutation will return
    field :post, Types::PostType, null: true
    field :errors, [String], null: false

    # Arguments that the mutation accepts
    argument :id, ID, required: true
    argument :content, String, required: false
    argument :image, ApolloUploadServer::Upload, required: false
    argument :remove_image, Boolean, required: false, default_value: false
    argument :buddy_only, Boolean, required: false
    
    # Location arguments
    argument :latitude, Float, required: false
    argument :longitude, Float, required: false
    argument :address, String, required: false
    argument :city, String, required: false
    argument :state, String, required: false
    argument :zip_code, String, required: false
    argument :zipCode, String, required: false
    argument :country, String, required: false

    def resolve(id:, **args)
      # Ensure current user is signed in
      unless context[:current_user]
        return { post: nil, errors: ["You must be signed in to update a post"] }
      end

      # Find the post
      post = context[:current_user].posts.find_by(id: id)
      
      # Check if post exists and belongs to current user
      unless post
        return { post: nil, errors: ["Post not found or you don't have permission to update it"] }
      end
      
      # Process zipCode to zip_code conversion
      if args.key?(:zipCode) && !args.key?(:zip_code)
        args[:zip_code] = args.delete(:zipCode)
      end

      # Handle image separately
      if args[:image].present?
        begin
          # Attach the new image
          post.image.attach(io: args[:image], filename: "post_image_#{Time.now.to_i}")
          
          # Remove :image from args to prevent ActiveRecord errors
          args.delete(:image)
        rescue StandardError => e
          return { post: nil, errors: ["Error uploading image: #{e.message}"] }
        end
      elsif args[:remove_image]
        # Remove the image if requested
        post.image.purge if post.image.attached?
      end
      
      # Always remove the :remove_image flag from args
      args.delete(:remove_image)

      # Update the post
      if post.update(args)
        # Return the updated post
        { post: post, errors: [] }
      else
        # Return errors if update failed
        { post: nil, errors: post.errors.full_messages }
      end
    end
  end
end
