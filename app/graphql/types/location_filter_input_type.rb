module Types
  class LocationFilterInputType < Types::BaseInputObject
    description "Input parameters for filtering posts by location"
    
    # Filter modes
    # - coordinate: Filter posts by distance to a specific coordinate point (lat/lng)
    # - city: Filter posts by city name
    # - zip_code: Filter posts by zip code
    argument :filter_mode, String, required: true, 
      description: "Filtering mode: 'coordinate', 'city', or 'zip_code'"
    
    # Coordinate-based filtering parameters
    argument :latitude, Float, required: false, 
      description: "Latitude for coordinate-based filtering (required when filter_mode is 'coordinate')"
    argument :longitude, Float, required: false,
      description: "Longitude for coordinate-based filtering (required when filter_mode is 'coordinate')"
    argument :distance_in_miles, Float, required: false, default_value: 10.0,
      description: "Maximum distance in miles for coordinate-based filtering"
    
    # City-based filtering parameters
    argument :city, String, required: false,
      description: "City name for city-based filtering (required when filter_mode is 'city')"
    
    # Zip-code-based filtering parameters
    argument :zip_code, String, required: false,
      description: "Zip/postal code for zip-based filtering (required when filter_mode is 'zip_code')"
    
    # Additional filtering parameters
    argument :state, String, required: false, description: "State to filter by"
  end
end
