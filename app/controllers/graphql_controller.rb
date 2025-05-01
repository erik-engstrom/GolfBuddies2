# frozen_string_literal: true

class GraphqlController < ApplicationController
  # If accessing from outside this domain, nullify the session
  # This allows for outside API access while preventing CSRF attacks
  # but you'll have to authenticate your user separately
  protect_from_forgery with: :null_session

  def execute
    variables = prepare_variables(params[:variables])
    query = params[:query]
    operation_name = params[:operationName]
    context = {
      current_user: current_user,
    }
    
    # Add detailed debug information for file uploads
    Rails.logger.info("GraphQL Operation: #{operation_name}")
    if variables && variables.is_a?(Hash)
      Rails.logger.info("Variables: #{variables.keys.join(', ')}")
      variables.each do |key, value|
        if value.is_a?(ActionDispatch::Http::UploadedFile)
          Rails.logger.info("File upload detected: #{key} - #{value.class.name}, content_type: #{value.content_type}, size: #{value.size}")
        end
      end
    end
    
    # Use GolfBuddies2Schema instead of GolfBuddiesSchema
    result = GolfBuddies2Schema.execute(query, variables: variables, context: context, operation_name: operation_name)
    
    # Check if there were any errors in the result
    if result && result["errors"].present?
      Rails.logger.error("GraphQL errors: #{result["errors"].inspect}")
    end
    
    render json: result
  rescue StandardError => e
    Rails.logger.error("GraphQL execution error: #{e.message}")
    Rails.logger.error(e.backtrace.join("\n"))
    raise e unless Rails.env.development?
    handle_error_in_development(e)
  end

  private

  # Handle variables in params
  def prepare_variables(variables_param)
    case variables_param
    when String
      if variables_param.present?
        JSON.parse(variables_param) || {}
      else
        {}
      end
    when Hash
      variables_param
    when ActionController::Parameters
      variables_param.to_unsafe_hash
    when nil
      {}
    end
  end

  def current_user
    # Find user by auth token
    token = request.headers['Authorization']&.split(' ')&.last || 
            params[:token] ||
            params[:graphql]&.dig(:token)
    
    return nil unless token

    begin
      decoded_token = JWT.decode(token, Rails.application.credentials.secret_key_base).first
      User.find_by(id: decoded_token['user_id'])
    rescue JWT::DecodeError
      nil
    end
  end

  def handle_error_in_development(e)
    logger.error e.message
    logger.error e.backtrace.join("\n")

    render json: { errors: [{ message: e.message, backtrace: e.backtrace }], data: {} }, status: 500
  end
end
