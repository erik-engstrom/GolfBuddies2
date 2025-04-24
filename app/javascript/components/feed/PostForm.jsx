import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { CREATE_POST_MUTATION } from '../../graphql/mutations';
import { GET_FEED_POSTS } from '../../graphql/queries';

const PostForm = () => {
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [error, setError] = useState('');

  const [createPost, { loading }] = useMutation(CREATE_POST_MUTATION, {
    refetchQueries: [{ query: GET_FEED_POSTS }],
    onCompleted: () => {
      setContent('');
      setImage(null);
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

    createPost({ variables: { content } });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold text-fairway-800 mb-4">Share your golf experience</h2>
      
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
          rows={3}
        />
        
        <div className="flex justify-end mt-3">
          <button
            type="submit"
            disabled={loading}
            className={`px-4 py-2 rounded-md ${
              loading ? 'bg-gray-400' : 'bg-fairway-600 hover:bg-fairway-700'
            } text-white font-medium`}
          >
            {loading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PostForm;
