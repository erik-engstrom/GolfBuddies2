# frozen_string_literal: true

class JsonWebToken
  # Secret key used for encoding and decoding JWT tokens
  SECRET_KEY = Rails.application.secret_key_base
  
  # Encode a payload into a JWT token
  def self.encode(payload, exp = 24.hours.from_now)
    # Set an expiration time for the token
    payload[:exp] = exp.to_i
    
    # Return the encoded JWT token
    JWT.encode(payload, SECRET_KEY)
  end
  
  # Decode a JWT token into its payload
  def self.decode(token)
    # Decode the token and extract the payload
    decoded = JWT.decode(token, SECRET_KEY)[0]
    
    # Return the payload as a HashWithIndifferentAccess
    ActiveSupport::HashWithIndifferentAccess.new(decoded)
  rescue JWT::ExpiredSignature
    # Handle expired token error
    raise JWT::ExpiredSignature, "Token has expired"
  rescue JWT::DecodeError
    # Handle generic decode errors
    raise JWT::DecodeError, "Invalid token"
  end
end
