module ActiveStorage
  class NoCacheMiddleware
    def initialize(app)
      @app = app
    end

    def call(env)
      # Check if this is a request for an active storage blob
      if env["PATH_INFO"] =~ /\/rails\/active_storage\/blobs\//
        Rails.logger.info "Setting no-cache headers for Active Storage blob: #{env["PATH_INFO"]}"
        status, headers, response = @app.call(env)
        
        # Add no-cache headers
        headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
        headers["Pragma"] = "no-cache"
        headers["Expires"] = "Fri, 01 Jan 1990 00:00:00 GMT"
        
        [status, headers, response]
      else
        @app.call(env)
      end
    end
  end
end
