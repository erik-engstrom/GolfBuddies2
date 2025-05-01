import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLazyQuery } from '@apollo/client';
import { SEARCH_USERS } from '../../graphql/queries';

const UserSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  
  const [searchUsers, { loading, data }] = useLazyQuery(SEARCH_USERS, {
    variables: { query: searchTerm },
    fetchPolicy: 'network-only'
  });
  
  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          inputRef.current && !inputRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);
  
  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (value.trim().length > 0) {
      searchUsers();
      setIsDropdownOpen(true);
    } else {
      setIsDropdownOpen(false);
    }
  };
  
  const handleUserSelect = () => {
    setSearchTerm('');
    setIsDropdownOpen(false);
  };
  
  const searchResults = data?.searchUsers || [];
  
  return (
    <div className="relative mx-2">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search users..."
          className="bg-fairway-600 text-white placeholder-gray-300 pl-10 pr-4 py-2 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-white focus:bg-fairway-500 w-48 transition-all duration-200"
          value={searchTerm}
          onChange={handleSearchChange}
          onFocus={() => {
            if (searchTerm.trim().length > 0) {
              setIsDropdownOpen(true);
            }
          }}
        />
      </div>
      
      {/* Search Results Dropdown */}
      {isDropdownOpen && (
        <div 
          ref={dropdownRef}
          className="absolute left-0 mt-2 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10"
        >
          <div className="py-1 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-3 text-sm text-gray-700">Loading...</div>
            ) : searchResults.length > 0 ? (
              searchResults.map(user => (
                <Link
                  key={user.id}
                  to={`/users/${user.id}`}
                  className="block px-4 py-2 hover:bg-gray-100 transition"
                  onClick={handleUserSelect}
                >
                  <div className="flex items-center">
                    {user.profilePictureUrl ? (
                      <img 
                        src={user.profilePictureUrl} 
                        alt={user.fullName} 
                        className="h-8 w-8 rounded-full mr-3"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-fairway-100 flex items-center justify-center mr-3">
                        <span className="text-fairway-800 font-semibold">
                          {user.firstName.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
                    </div>
                  </div>
                </Link>
              ))
            ) : searchTerm.trim().length > 0 ? (
              <div className="px-4 py-3 text-sm text-gray-700">No users found</div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSearch;
