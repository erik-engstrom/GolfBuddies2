module Mutations
  class UpdateUserLocation < Mutations::BaseMutation
    graphql_name 'UpdateUserLocation'
    description 'Updates the current user\'s location information'

    # Arguments for different location update modes
    argument :update_mode, String, required: true, 
      description: 'How to update the location: "coordinate" (using lat/lng), "address" (using address fields)'

    # Coordinate-based update arguments
    argument :latitude, Float, required: false,
      description: 'Latitude coordinate (required when update_mode is "coordinate")'
    argument :longitude, Float, required: false,
      description: 'Longitude coordinate (required when update_mode is "coordinate")'
      
    # Address-based update arguments
    argument :address, String, required: false,
      description: 'Street address (used when update_mode is "address")'
    argument :city, String, required: false,
      description: 'City (used when update_mode is "address")'
    argument :state, String, required: false,
      description: 'State/Province (used when update_mode is "address")'
    argument :zip_code, String, required: false,
      description: 'Zip/Postal code (used when update_mode is "address")'
    argument :country, String, required: false,
      description: 'Country (used when update_mode is "address")'
      
    # Return fields
    field :user, Types::UserType, null: true
    field :errors, [String], null: false

    def resolve(update_mode:, **args)
      # Authentication check
      unless context[:current_user]
        return { user: nil, errors: ['You must be logged in to update your location'] }
      end

      user = context[:current_user]
      
      case update_mode
      when 'coordinate'
        # For coordinate updates, require both latitude and longitude
        unless args[:latitude] && args[:longitude]
          return { user: nil, errors: ['Both latitude and longitude are required for coordinate updates'] }
        end
        
        # Update via coordinates - geocoder will reverse lookup the address
        user.latitude = args[:latitude]
        user.longitude = args[:longitude]
        
      when 'address'
        # For address updates, require at minimum a city or zip code
        if args[:city].blank? && args[:zip_code].blank?
          return { user: nil, errors: ['Either city or zip code is required for address updates'] }
        end
        
        # Update address fields - geocoder will lookup coordinates
        user.address = args[:address] if args[:address]
        user.city = args[:city] if args[:city]
        user.state = args[:state] if args[:state]
        user.zip_code = args[:zip_code] if args[:zip_code]
        user.country = args[:country] if args[:country]
        
      else
        return { user: nil, errors: ['Invalid update mode. Use "coordinate" or "address"'] }
      end
      
      # Try to save the user with the new location data
      if user.save
        { user: user, errors: [] }
      else
        { user: nil, errors: user.errors.full_messages }
      end
    end
  end
end
