# frozen_string_literal: true

module Types
  class UploadType < BaseScalar
    description "A file upload"
    
    def self.coerce_input(value, _context)
      # Already handled by apollo_upload_server middleware
      value
    end
    
    def self.coerce_result(value, _context)
      value
    end
  end
end
