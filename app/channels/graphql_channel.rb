# frozen_string_literal: true

class GraphqlChannel < ApplicationCable::Channel
  def subscribed
    @subscription_ids = []
    Rails.logger.info "Client #{connection.current_user_id} subscribed to GraphQL channel"
  end

  def execute(data)
    result = execute_query(data)

    payload = {
      result: result.to_h,
      more: result.subscription?
    }

    # Track the subscription here so we can remove it
    # on unsubscribe.
    if result.context[:subscription_id]
      @subscription_ids << result.context[:subscription_id]
      Rails.logger.debug "Added subscription ID #{result.context[:subscription_id]} for user #{connection.current_user_id}"
    end

    transmit(payload)
  end
  
  # Support ping/pong for keeping connections alive
  def ping(data = {})
    Rails.logger.debug "Ping received from client #{connection.current_user_id}"
    transmit({ pong: true, time: Time.now.to_i })
  end
  
  # Handle pong response from client
  def pong(data = {})
    Rails.logger.debug "Pong received from client #{connection.current_user_id}"
    # Nothing to do here, just acknowledging we got the pong
  end

  def unsubscribed
    Rails.logger.info "Client #{connection.current_user_id} unsubscribed from GraphQL channel"
    cleanup_subscriptions
  end

  private

  def cleanup_subscriptions
    return if @subscription_ids.blank?
    
    @subscription_ids.each do |sid|
      Rails.logger.debug "Removing subscription #{sid} for user #{connection.current_user_id}"
      GolfBuddies2Schema.subscriptions.delete_subscription(sid)
    end
  end

  def execute_query(data)
    GolfBuddies2Schema.execute(
      data["query"],
      variables: ensure_hash(data["variables"]),
      context: {
        current_user: current_user,
        channel: self
      },
      operation_name: data["operationName"]
    )
  rescue => e
    Rails.logger.error "Error executing GraphQL query: #{e.message}"
    Rails.logger.error e.backtrace.join("\n")
    { errors: [{ message: e.message }] }
  end

  def current_user
    @current_user ||= User.find(connection.current_user_id) if connection.current_user_id
  end

  def ensure_hash(ambiguous_param)
    case ambiguous_param
    when String
      if ambiguous_param.present?
        ensure_hash(JSON.parse(ambiguous_param))
      else
        {}
      end
    when Hash, ActionController::Parameters
      ambiguous_param
    when nil
      {}
    else
      raise ArgumentError, "Unexpected parameter: #{ambiguous_param}"
    end
  end
end
