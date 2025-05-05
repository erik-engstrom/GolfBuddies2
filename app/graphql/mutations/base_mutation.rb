module Mutations
  class BaseMutation < GraphQL::Schema::RelayClassicMutation
    argument_class Types::BaseArgument
    field_class Types::BaseField
    input_object_class Types::BaseInputObject
    object_class Types::BaseObject
    
    # Add common mutation methods here
    
    # Helper method to check if the user is authenticated
    # and handle token expiration
    def authenticate_user!
      if context[:token_expired]
        return {
          success: false,
          errors: ["Token expired, please refresh or login again"],
          token_expired: true
        }
      end
      
      unless context[:current_user]
        return {
          success: false,
          errors: ["You need to be logged in to perform this action"],
          token_expired: false
        }
      end
      
      true
    end
  end
end
