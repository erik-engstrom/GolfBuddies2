# frozen_string_literal: true

# Note: This file is now obsolete and should not be used.
# We are using ApolloUploadServer::Upload directly instead of our own UploadType.
# This file is kept for reference but the type has been renamed to avoid conflicts.

module Types
  class CustomUploadType < GraphQL::Schema::Scalar
    graphql_name "CustomUpload" # Changed to avoid conflict with ApolloUploadServer::Upload
    description "Represents a file upload (DEPRECATED - use ApolloUploadServer::Upload instead)"
    
    def self.coerce_input(value, _context)
      # The apollo-upload-server middleware processes the file and delivers
      # it as an ActionDispatch::Http::UploadedFile
      value
    end

    def self.coerce_result(value, _context)
      value
    end
  end
end
