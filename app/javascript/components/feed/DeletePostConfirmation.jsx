import React, { useState } from 'react';
import { useMutation, gql } from '@apollo/client';
// Define the mutation directly in the component to avoid caching issues
const DELETE_POST_MUTATION = gql`
  mutation DeletePost($id: ID!) {
    deletePost(input: {id: $id}) {
      success
      errors
    }
  }
`;

const DeletePostConfirmation = ({ post, isOpen, onClose, refetchPosts }) => {
  const [error, setError] = useState('');
  
  const [deletePost, { loading }] = useMutation(DELETE_POST_MUTATION, {
    onCompleted: () => {
      refetchPosts();
      onClose();
    },
    onError: (error) => {
      setError(error.message);
    }
  });
  
  const handleDelete = () => {
    // Clear any previous errors
    setError('');
    
    deletePost({ 
      variables: { id: post.id }
    });
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-fairway-800">Delete Post</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {error && (
          <div className="bg-flag-100 border border-flag-400 text-flag-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <p className="text-gray-700 mb-2">Are you sure you want to delete this post?</p>
        <p className="text-gray-500 mb-4 text-sm">This action cannot be undone.</p>
        
        <div className="bg-gray-50 p-3 rounded-lg mb-4">
          <p className="text-gray-800 line-clamp-3">
            {post.content}
          </p>
          
          {post.imageUrl && (
            <div className="mt-2 flex justify-center">
              <img 
                src={post.imageUrl} 
                alt="Post attachment" 
                className="h-20 rounded object-contain"
              />
            </div>
          )}
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className={`px-4 py-2 rounded-md ${
              loading ? 'bg-gray-400' : 'bg-flag-600 hover:bg-flag-700'
            } text-white font-medium`}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeletePostConfirmation;
