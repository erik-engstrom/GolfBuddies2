module Mutations
  class UpdateProfilePicture < BaseMutation
    # Remove the incorrect include statement
    
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
        user.profile_picture.attach(profile_picture)
        
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
