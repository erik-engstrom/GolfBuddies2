module Mutations
  class RefreshToken < BaseMutation
    # Define what our mutation returns
    field :token, String, null: true
    field :errors, [String], null: false
    field :token_expired, Boolean, null: false

    def resolve
      # Special handling for this mutation - we want to allow token refresh 
      # even if the token is expired, as long as we can identify the user
      if context[:token_expired]
        # Extract user ID from expired token
        request_obj = context[:request]
        token = request_obj.headers['Authorization']&.split(' ')&.last || 
                request_obj.params[:token] || 
                request_obj.params[:graphql]&.dig(:token)
        
        begin
          decoded = JWT.decode(token, Rails.application.credentials.secret_key_base, false).first
          user_id = decoded['user_id']
          
          if user_id
            user = User.find_by(id: user_id)
            if user
              # Generate a new token for the user
              new_token = JsonWebToken.encode({ user_id: user.id })
              
              return {
                token: new_token,
                errors: [],
                token_expired: true
              }
            end
          end
        rescue => e
          Rails.logger.error("Error decoding expired token: #{e.message}")
        end
      end

      # Normal flow for valid token
      unless context[:current_user]
        return {
          token: nil,
          errors: ["Not authenticated"],
          token_expired: context[:token_expired] || false
        }
      end

      # Get the current user
      user = context[:current_user]
      
      # Generate a new token for the user
      token = JsonWebToken.encode({ user_id: user.id })
      
      {
        token: token,
        errors: [],
        token_expired: false
      }
    end
  end
end
