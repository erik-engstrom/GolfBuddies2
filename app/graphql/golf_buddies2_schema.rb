# frozen_string_literal: true

class GolfBuddies2Schema < GraphQL::Schema
  # Define query, mutation, and subscription types
  mutation(Types::MutationType)
  query(Types::QueryType)
  subscription(Types::SubscriptionType)

  # For batch-loading (see https://graphql-ruby.org/dataloader/overview.html)
  use GraphQL::Dataloader
  
  # Add subscriptions support
  use GraphQL::Subscriptions::ActionCableSubscriptions

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
