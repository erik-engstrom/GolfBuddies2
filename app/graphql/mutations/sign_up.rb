module Mutations
  class SignUp < BaseMutation
    # Define what our mutation returns
    field :token, String, null: true
    field :user, Types::UserType, null: true
    field :errors, [String], null: false

    # Define the arguments this mutation accepts
    argument :email, String, required: true
    argument :password, String, required: true
    argument :password_confirmation, String, required: true
    argument :first_name, String, required: true
    argument :last_name, String, required: true
    argument :handicap, Float, required: false
    argument :playing_style, String, required: false

    # Define the mutation's behavior
    def resolve(email:, password:, password_confirmation:, first_name:, last_name:, handicap: nil, playing_style: nil)
      return { user: nil, token: nil, errors: ["Passwords don't match"] } if password != password_confirmation

      user = User.new(
        email: email,
        password: password,
        password_confirmation: password_confirmation,
        first_name: first_name,
        last_name: last_name,
        handicap: handicap,
        playing_style: playing_style
      )

      if user.save
        # Generate JWT token
        token = generate_token(user)
        
        # Return the token and user
        { user: user, token: token, errors: [] }
      else
        # Return validation errors
        { user: nil, token: nil, errors: user.errors.full_messages }
      end
    end

    private

    def generate_token(user)
      payload = { user_id: user.id }
      JWT.encode(payload, Rails.application.credentials.secret_key_base, 'HS256')
    end
  end
end
