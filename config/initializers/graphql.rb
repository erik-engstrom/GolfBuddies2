# Add the mutation type to the schema after it's loaded
Rails.application.config.after_initialize do
  # Only run this if the schema exists and isn't already configured for mutations
  if defined?(GolfBuddies2Schema) && !GolfBuddies2Schema.mutation
    begin
      GolfBuddies2Schema.mutation(Types::MutationType)
    rescue => e
      Rails.logger.error "Failed to configure schema for mutations: #{e.message}"
    end
  end
end