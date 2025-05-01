# frozen_string_literal: true

module ApplicationCable
  class Connection < ActionCable::Connection::Base
    identified_by :current_user_id

    def connect
      self.current_user_id = find_verified_user
    end

    private

    def find_verified_user
      if verified_user = env['warden']&.user
        verified_user.id
      else
        nil
      end
    end
  end
end
