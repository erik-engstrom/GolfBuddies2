# frozen_string_literal: true

# Load all mutation classes
require_relative "mutations"

class GolfBuddies2Schema < GraphQL::Schema
  # Define query, mutation, and subscription types
  mutation(Types::MutationType)
  query(Types::QueryType)
  subscription(Types::SubscriptionType)
  
  # Explicitly register object types that might not be reached through the root types
  orphan_types [Types::NotificationType]
  
  # Union types are automatically picked up when referenced in object types

  # For batch-loading (see https://graphql-ruby.org/dataloader/overview.html)
  use GraphQL::Dataloader
  
  # Add subscriptions support
  use GraphQL::Subscriptions::ActionCableSubscriptions
  
  # Configure field name handling for better JavaScript compatibility
  # This ensures that Ruby snake_case field names are converted to camelCase in GraphQL responses
  # Different GraphQL gem versions have different ways to configure this
  if respond_to?(:default_camelize)
    self.default_camelize = true
  else
    # For older versions, monkey patch the field name behavior
    def self.camelize_field_name(field_name)
      field_name.to_s.camelize(:lower)
    end
  end

  # GraphQL-Ruby calls this when something goes wrong while running a query:
  def self.type_error(err, context)
    # if err.is_a?(GraphQL::InvalidNullError)
    #   # report to your bug tracker here
    #   return nil
    # end
    super
  end

  # Union and Interface Resolution
  def self.resolve_type(abstract_type, obj, ctx)
    # Implement class-based resolution
    case obj
    when Post
      Types::PostType
    when User
      Types::UserType
    when Comment
      Types::CommentType
    when Like
      Types::LikeType
    when Message
      Types::MessageType
    when BuddyRequest
      Types::BuddyRequestType
    when Notification
      Types::NotificationType
    else
      # Fall back to letting each type decide
      if abstract_type.respond_to?(:resolve_type)
        abstract_type.resolve_type(obj, ctx)
      else
        raise "Unexpected object: #{obj}"
      end
    end
  end

  # Stop validating when it encounters a validation error.
  # This is normal and expected for most GraphQL queries.
  # It's only used by Relay for certain advanced features.
  # validate_max_errors(100)

  # Relay-style Object Identification:

  # Return a string UUID for `object`
  def self.id_from_object(object, type_definition, query_ctx)
    # For example, use Rails' GlobalID library (https://github.com/rails/globalid):
    object.to_gid_param
  end

  # Given a string UUID, find the object
  def self.object_from_id(global_id, query_ctx)
    # For example, use Rails' GlobalID library (https://github.com/rails/globalid):
    GlobalID.find(global_id)
  end
end
