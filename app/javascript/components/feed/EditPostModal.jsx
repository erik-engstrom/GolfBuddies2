import React, { useState } from 'react';
import { useMutation, gql } from '@apollo/client';
// Define the mutation directly in the component to avoid caching issues
const UPDATE_POST_MUTATION = gql`
  mutation UpdatePost($id: ID!, $content: String!) {
    updatePost(input: {id: $id, content: $content}) {
      post {
        id
        content
        createdAt
        imageUrl
        user {
          id
          fullName
        }
      }
      errors
    }
  }
`;

const EditPostModal = ({ post, isOpen, onClose, refetchPosts }) => {
  const [content, setContent] = useState(post.content);
  const [error, setError] = useState('');

  const [updatePost, { loading }] = useMutation(UPDATE_POST_MUTATION, {
    onCompleted: () => {
      refetchPosts();
      onClose();
    },
    onError: (error) => {
      setError(error.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!content.trim()) {
      setError('Post content cannot be empty');
      return;
    }

    // Clear any previous errors
    setError('');

    // Make sure we're using the correct parameter name for the mutation
    updatePost({
      variables: {
        id: post.id,
        content
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-fairway-800">Edit Post</h2>
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

        <form onSubmit={handleSubmit}>
          <textarea
            className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-fairway-500"
            placeholder="What's happening on the course today?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            disabled={loading}
          />

          {post.imageUrl && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">Current Image:</p>
              <img
                src={post.imageUrl}
                alt="Post attachment"
                className="max-h-40 rounded-lg object-contain bg-gray-100"
              />
              <p className="text-sm text-gray-500 mt-2">
                Note: Images cannot be changed. To update with a different image, please create a new post.
              </p>
            </div>
          )}

          <div className="mt-5 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 rounded-md ${
                loading ? 'bg-gray-400' : 'bg-fairway-600 hover:bg-fairway-700'
              } text-white font-medium`}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPostModal;
