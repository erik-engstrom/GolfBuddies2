module Mutations
  class UpdateProfilePicture < BaseMutation
    # Define what our mutation returns
    field :user, Types::UserType, null: true
    field :errors, [String], null: false

    # Define the arguments this mutation accepts
    argument :profile_picture, ApolloUploadServer::Upload, required: true

    def resolve(profile_picture:)
      # Check if user is authenticated
      unless context[:current_user]
        return {
          user: nil,
          errors: ["You need to be logged in to update your profile picture"]
        }
      end

      user = context[:current_user]
      
      # Attach the uploaded file
      begin
        # Convert the uploaded file to an attachable format
        if profile_picture.respond_to?(:tempfile)
          # Handle the file properly based on its format
          user.profile_picture.attach(io: profile_picture.tempfile, 
                                      filename: profile_picture.original_filename,
                                      content_type: profile_picture.content_type)
        else
          user.profile_picture.attach(profile_picture)
        end
        
        if user.save
          {
            user: user,
            errors: []
          }
        else
          {
            user: nil,
            errors: user.errors.full_messages
          }
        end
      rescue => e
        {
          user: nil,
          errors: [e.message]
        }
      end
    end
  end
end
