# frozen_string_literal: true
module Mutations
  class Logout < BaseMutation
    null true
    
    field :success, Boolean, null: false
    field :errors, [String], null: false
    
    def resolve
      # Clear the session token or authentication info
      context[:current_user] = nil
      
      # Return success
      {
        success: true,
        errors: []
      }
    end
  end
end
