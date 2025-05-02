class LogRequestHeaders
  def initialize(app)
    @app = app
  end

  def call(env)
    # Only log GraphQL requests
    if env["PATH_INFO"] == "/graphql"
      Rails.logger.info("============= GraphQL Request =============")
      Rails.logger.info("Authorization header: #{env["HTTP_AUTHORIZATION"]}")
      Rails.logger.info("Content-Type: #{env["CONTENT_TYPE"]}")
      Rails.logger.info("============================================")
    end
    @app.call(env)
  end
end
