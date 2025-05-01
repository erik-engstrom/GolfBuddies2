class GolfBuddiesSchema < GraphQL::Schema
  mutation(Types::MutationType)
  query(Types::QueryType)
  
  # Default batch loaders
  use GraphQL::Batch

  # For batch-loading (see https://graphql-ruby.org/dataloader/overview.html)
  use GraphQL::Dataloader

  # GraphQL-Ruby calls this when something goes wrong while running a query:
  def self.type_error(err, context)
    # if err is a GraphQL::InvalidNullError
    # ...
    super
  end

  # Union and Interface Resolution
  def self.resolve_type(abstract_type, obj, ctx)
    # TODO: Implement this method
    # to return the correct object type for `obj`
    raise(GraphQL::RequiredImplementationMissingError)
  end

  # Relay-style Object Identification:

  # Return a string UUID for `object`
  def self.id_from_object(object, type_definition, query_ctx)
    # Here's a simple implementation that assumes the object responds to `id`:
    object.id.to_s
  end

  # Given a string UUID, find the object
  def self.object_from_id(id, query_ctx)
    # For example, to load by ID for ActiveRecord:
    # object_class = query_ctx[:current_user]&.admin? ? Object : NonAdminObject
    # object_class.find(id)
    type_name, item_id = GraphQL::Schema::UniqueWithinType.decode(id)
    Object.const_get(type_name).find(item_id)
  end
end