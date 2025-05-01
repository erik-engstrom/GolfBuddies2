import React, { useContext } from 'react';
import { CurrentUserContext } from '../../app/CurrentUserContext';
import PostForm from './PostForm';
import PostList from './PostList';

const Feed = () => {
  const { currentUser, loading, error } = useContext(CurrentUserContext);
  
  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-fairway-600"></div>
    </div>
  );
  
  if (error) return (
    <div className="bg-flag-100 border border-flag-400 text-flag-700 px-4 py-3 rounded mb-4">
      Error loading feed: {error.message}
    </div>
  );
  
  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-2xl font-bold text-fairway-800 mb-4">Welcome to Golf Buddies!</h1>
        
        {currentUser ? (
          <div className="bg-fairway-50 p-4 rounded-lg mb-4">
            <p className="text-lg">
              Hello, <span className="font-bold">{currentUser.fullName}</span>!
            </p>
            <p className="mt-2">
              Share your golf experiences and connect with other golfers.
            </p>
          </div>
        ) : (
          <p className="text-flag-600 mb-4">You are not authenticated. Please log in.</p>
        )}
        
        <div className="mt-4">
          <h2 className="text-xl font-semibold text-fairway-700 mb-3">Connect, Share, and Elevate Your Golf Experience</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start">
              <div className="bg-fairway-500 p-2 rounded-full text-white mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-fairway-800">Find Playing Partners</h3>
                <p className="text-sm text-gray-600">Connect with players in your area or invite others to join your next round</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-fairway-500 p-2 rounded-full text-white mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-fairway-800">Tee Time Alerts</h3>
                <p className="text-sm text-gray-600">Share or find last-minute tee time openings at local courses</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-fairway-500 p-2 rounded-full text-white mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-fairway-800">Course Conditions</h3>
                <p className="text-sm text-gray-600">Post updates on course conditions from fellow golfers</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-fairway-500 p-2 rounded-full text-white mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-fairway-800">Buy & Sell Equipment</h3>
                <p className="text-sm text-gray-600">Marketplace for golf items - sell what you don't need, find what you want</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-fairway-500 p-2 rounded-full text-white mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-fairway-800">Events & Tournaments</h3>
                <p className="text-sm text-gray-600">Discover and promote upcoming golf events in your community</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-fairway-500 p-2 rounded-full text-white mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 002 2H4a2 2 0 01-2-2V5zm3 1h6v4H5V6zm6 6H5v2h6v-2z" clipRule="evenodd" />
                  <path d="M15 7h1a2 2 0 012 2v5.5a1.5 1.5 0 01-3 0V7z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-fairway-800">Golf News & Tips</h3>
                <p className="text-sm text-gray-600">Share relevant news, tips, techniques and celebrate achievements</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {currentUser && (
        <>
          <PostForm />
          <PostList />
        </>
      )}
    </div>
  );
};

export default Feed;
