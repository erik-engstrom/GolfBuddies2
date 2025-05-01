module Mutations
  class AddPostImage < BaseMutation
    # Use nested input for consistency with other mutations
    argument :post_id, ID, required: true, as: :post_id
    argument :image, ApolloUploadServer::Upload, required: true
    
    field :post, Types::PostType, null: true
    field :errors, [String], null: false

    def resolve(post_id:, image:)
      # Enhanced debug logging
      Rails.logger.info("AddPostImage mutation called with post_id: #{post_id}")
      Rails.logger.info("Image class: #{image.class.name}") if image
      
      # Log detailed image information
      if image
        if image.respond_to?(:content_type)
          Rails.logger.info("Image content_type: #{image.content_type}")
        end
        if image.respond_to?(:original_filename)
          Rails.logger.info("Image original_filename: #{image.original_filename}")
        end
        if image.respond_to?(:tempfile)
          Rails.logger.info("Image tempfile: #{image.tempfile.path} exists: #{File.exist?(image.tempfile.path)}")
          Rails.logger.info("Image tempfile size: #{File.size(image.tempfile.path) rescue 'unknown'}")
        end
      end
      
      Rails.logger.info("Current user: #{context[:current_user].inspect}")
      
      post = Post.find_by(id: post_id)
      
      if post.nil?
        Rails.logger.error("Post not found with ID: #{post_id}")
        return {
          post: nil,
          errors: ["Post not found"]
        }
      end
      
      # Check authorization
      unless context[:current_user] == post.user
        Rails.logger.error("User not authorized to update post")
        return {
          post: nil,
          errors: ["You are not authorized to update this post"]
        }
      end
      
      begin
        # Make sure we're properly handling the file upload
        Rails.logger.info("Attempting to attach image to post #{post_id}")
        
        if image.respond_to?(:tempfile)
          # Handle the file from apollo-upload-server middleware
          Rails.logger.info("Using tempfile method to attach image")
          begin
            post.image.attach(
              io: image.tempfile,
              filename: image.original_filename || "upload.jpg",
              content_type: image.content_type || "image/jpeg"
            )
          rescue => e
            Rails.logger.error("Error attaching image via tempfile: #{e.message}")
            Rails.logger.error(e.backtrace.join("\n"))
            raise e
          end
        else
          # Fall back to direct attachment if already in the right format
          Rails.logger.info("Using direct attachment method")
          begin
            post.image.attach(image)
          rescue => e
            Rails.logger.error("Error direct attaching image: #{e.message}")
            Rails.logger.error(e.backtrace.join("\n"))
            raise e
          end
        end
        
        Rails.logger.info("Image attached, attempting to save post")
        
        if post.save
          Rails.logger.info("Image successfully attached to post #{post_id}")
          {
            post: post,
            errors: []
          }
        else
          Rails.logger.error("Failed to save post: #{post.errors.full_messages.join(', ')}")
          {
            post: nil,
            errors: post.errors.full_messages
          }
        end
      rescue => e
        Rails.logger.error("Exception while attaching image: #{e.message}")
        Rails.logger.error(e.backtrace.join("\n"))
        
        error_message = "Error processing image: #{e.message}"
        
        # Check specifically for ActiveStorage errors
        if e.is_a?(ActiveStorage::Error) || e.message.include?('ActiveStorage')
          Rails.logger.error("ActiveStorage error detected!")
          error_message = "Storage configuration error: #{e.message}. Please check server storage configuration."
        end
        
        # Check for permission issues
        if e.message.include?('Permission') || e.message.include?('permission')
          Rails.logger.error("Possible file permission error!")
          error_message = "File permission error: #{e.message}. Please check directory permissions."
        end
        
        # Check for file type issues
        if e.message.include?('content type')
          error_message = "Invalid file format: #{e.message}"
        end
        
        # Check for storage service issues
        if e.message.include?('service')
          error_message = "Storage service error: #{e.message}. Please verify storage service configuration."
        end
        
        {
          post: nil,
          errors: [error_message]
        }
      end
    end
  end
end
