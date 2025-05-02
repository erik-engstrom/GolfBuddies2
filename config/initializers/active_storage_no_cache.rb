require_relative '../../app/middleware/active_storage/no_cache_middleware'

# Insert the middleware to prevent caching of Active Storage blobs
Rails.application.config.middleware.insert_before Rack::Runtime, ActiveStorage::NoCacheMiddleware
