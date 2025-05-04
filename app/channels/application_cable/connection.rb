# frozen_string_literal: true

module ApplicationCable
  class Connection < ActionCable::Connection::Base
    identified_by :current_user_id

    def connect
      self.current_user_id = find_verified_user
      logger.add_tags 'ActionCable', current_user_id
    end

    private

    def find_verified_user
      # Try to get user from Warden (Devise)
      if verified_user = env['warden']&.user
        return verified_user.id
      end

      # Otherwise try to authenticate with JWT token
      if token = request.headers[:HTTP_AUTHORIZATION]&.to_s&.split(' ')&.last || 
                cookies[:golfBuddiesToken] || 
                request.params[:token]
        begin
          user_id = JsonWebToken.decode(token)['user_id']
          return user_id if User.find_by(id: user_id)
        rescue JWT::DecodeError => e
          logger.error "JWT decode error: #{e.message}"
        end
      end

      # Reject the connection if no valid authentication found
      logger.error "No valid authentication found for WebSocket connection"
      nil
    end
  end
end
