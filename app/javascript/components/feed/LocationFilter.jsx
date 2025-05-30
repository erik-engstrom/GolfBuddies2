import React, { useState, useEffect, useContext } from 'react';
import { CurrentUserContext } from '../../app/CurrentUserContext';

const LocationFilter = ({ onFilterChange }) => {
  const { currentUser } = useContext(CurrentUserContext);
  const [filterType, setFilterType] = useState('none');
  const [distance, setDistance] = useState(25);
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState('');

  // Initialize with user's location if available
  useEffect(() => {
    if (currentUser?.latitude && currentUser?.longitude) {
      setUserLocation({
        latitude: currentUser.latitude,
        longitude: currentUser.longitude
      });
    }
  }, [currentUser]);

  // Handle filter changes
  useEffect(() => {
    if (!onFilterChange || typeof onFilterChange !== 'function') {
      console.error("LocationFilter: onFilterChange prop is not a function");
      return;
    }
    
    if (filterType === 'none') {
      onFilterChange(null);
      return;
    }

    let locationFilter = {};

    switch (filterType) {
      case 'near_me':
        if (userLocation) {
          locationFilter = {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            distance: distance
          };
        } else {
          // Try to get user's location
          getUserLocation();
          return; // Don't update filter until we have location
        }
        break;
      
      case 'city':
        if (city) {
          locationFilter = { city };
        } else {
          return; // Don't update filter if no city
        }
        break;
      
      case 'zip':
        if (zipCode) {
          locationFilter = { zip_code: zipCode };
        } else {
          return; // Don't update filter if no zip
        }
        break;
        
      default:
        return;
    }

    onFilterChange(locationFilter);
  }, [filterType, distance, city, zipCode, userLocation, onFilterChange]);

  // Get user's current location
  const getUserLocation = () => {
    setLocationError('');
    
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        console.error("Error getting location:", error);
        let errorMessage = "Unable to get your location";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "You denied permission to access your location";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Your location information is unavailable";
            break;
          case error.TIMEOUT:
            errorMessage = "Request to get your location timed out";
            break;
          default:
            errorMessage = "An unknown error occurred";
        }
        
        setLocationError(errorMessage);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  // Clear filters
  const clearFilter = () => {
    setFilterType('none');
    setDistance(25);
    setCity('');
    setZipCode('');
    onFilterChange(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <h3 className="font-bold text-fairway-700 mb-3">Filter Posts by Location</h3>
      
      <div className="mb-3">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
        >
          <option value="none">No Location Filter</option>
          <option value="near_me">Posts Near Me</option>
          <option value="city">By City</option>
          <option value="zip">By ZIP Code</option>
        </select>
      </div>

      {filterType === 'near_me' && (
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Distance (miles)
          </label>
          <div className="flex items-center">
            <input
              type="range"
              min="1"
              max="100"
              value={distance}
              onChange={(e) => setDistance(parseInt(e.target.value))}
              className="flex-grow mr-2"
            />
            <span className="w-12 text-center">{distance}</span>
          </div>
          {locationError && (
            <p className="text-flag-600 text-sm mt-1">{locationError}</p>
          )}
          {!userLocation && !locationError && (
            <p className="text-gray-500 text-sm mt-1">Getting your location...</p>
          )}
        </div>
      )}

      {filterType === 'city' && (
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-600 mb-1">
            City Name
          </label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Enter city name"
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
      )}

      {filterType === 'zip' && (
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-600 mb-1">
            ZIP Code
          </label>
          <input
            type="text"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
            placeholder="Enter ZIP code"
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
      )}

      {filterType !== 'none' && (
        <button
          onClick={clearFilter}
          className="text-sm text-flag-600 hover:text-flag-800"
        >
          Clear filter
        </button>
      )}
    </div>
  );
};

// Default props
LocationFilter.defaultProps = {
  onFilterChange: () => {} // Provide a no-op function as default
};

export default LocationFilter;
