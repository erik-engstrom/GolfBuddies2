module Mutations
  class SignIn < BaseMutation
    # Define what our mutation returns
    field :token, String, null: true
    field :user, Types::UserType, null: true
    field :errors, [String], null: false

    # Define the arguments this mutation accepts
    argument :email, String, required: true
    argument :password, String, required: true

    # Define the mutation's behavior
    def resolve(email:, password:)
      user = User.find_by(email: email)

      # Check if user exists and password is correct
      if user && user.authenticate(password)
        # Generate JWT token
        token = generate_token(user)
        
        # Return the token and user
        { user: user, token: token, errors: [] }
      else
        # Return authentication error
        { user: nil, token: nil, errors: ["Invalid email or password"] }
      end
    end

    private

    def generate_token(user)
      payload = { user_id: user.id }
      JWT.encode(payload, Rails.application.credentials.secret_key_base, 'HS256')
    end
  end
end
