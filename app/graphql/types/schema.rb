module Types
  class Schema < GraphQL::Schema
    mutation(Types::MutationType)
    query(Types::QueryType)

    # Add this line to ensure Upload scalar type is recognized
    use ApolloUploadServer::Upload

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
      # to return the correct GraphQL object type for `obj`
      raise(GraphQL::RequiredImplementationMissingError)
    end

    # Stop validating when it encounters this many errors:
    validate_max_errors(100)
  end
end