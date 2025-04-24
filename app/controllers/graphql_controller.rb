# frozen_string_literal: true

class GraphqlController < ApplicationController
  # Temporarily skip CSRF protection during development
  skip_before_action :verify_authenticity_token

  def execute
    variables = prepare_variables(params[:variables])
    query = params[:query]
    operation_name = params[:operationName]
    context = {
      # Set current_user based on JWT token
      current_user: current_user,
    }
    result = GolfBuddies2Schema.execute(query, variables: variables, context: context, operation_name: operation_name)
    render json: result
  rescue StandardError => e
    raise e unless Rails.env.development?
    handle_error_in_development(e)
  end

  private

  # Handle variables in form data, JSON body, or a blank value
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
      variables_param.to_unsafe_hash # GraphQL-Ruby will validate name and type of incoming variables.
    when nil
      {}
    else
      raise ArgumentError, "Unexpected parameter: #{variables_param}"
    end
  end

  # Get current user from token
  def current_user
    return nil unless request.headers['Authorization']
    
    token = request.headers['Authorization'].split(' ').last
    return nil unless token
    
    begin
      decoded_token = JWT.decode(token, Rails.application.credentials.secret_key_base, true, { algorithm: 'HS256' })
      user_id = decoded_token.first['user_id']
      User.find_by(id: user_id)
    rescue JWT::DecodeError
      nil
    end
  end
  
  # Check if request is authenticated with JWT
  def authenticated_request?
    # Skip CSRF for requests with valid JWT token
    request.headers['Authorization'].present? && current_user.present?
  end

  def handle_error_in_development(e)
    logger.error e.message
    logger.error e.backtrace.join("\n")

    render json: { errors: [{ message: e.message, backtrace: e.backtrace }], data: {} }, status: 500
  end
end
