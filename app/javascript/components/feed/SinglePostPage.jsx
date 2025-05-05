import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { GET_SINGLE_POST } from '../../graphql/queries';
import Post from './Post';
import RestrictedPostMessage from './RestrictedPostMessage';

const SinglePostPage = () => {
  // Get the post ID from the URL parameters
  const { postId } = useParams();
  
  // Fetch the post data
  const { loading, error, data, refetch } = useQuery(GET_SINGLE_POST, {
    variables: { id: postId },
    fetchPolicy: 'network-only' // Always get fresh data
  });

  // Function to refresh the post data
  const refreshPost = () => {
    refetch();
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-fairway-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-flag-100 border border-flag-400 text-flag-700 px-4 py-3 rounded mb-4">
          Error loading post: {error.message}
        </div>
        <div className="text-center mt-4">
          <Link
            to="/"
            className="px-6 py-3 bg-fairway-600 text-white font-medium rounded-md hover:bg-fairway-700 transition-colors duration-150"
          >
            Return to Feed
          </Link>
        </div>
      </div>
    );
  }

  // If the post couldn't be found or is a buddy-only post that the user doesn't have access to
  if (!data?.post) {
    return <RestrictedPostMessage />;
  }

  // If we have a valid post, display it
  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center text-fairway-600 hover:text-fairway-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Feed
        </Link>
      </div>

      <Post
        post={data.post}
        refetchPosts={refreshPost}
        isTargetPost={false}
      />
    </div>
  );
};

export default SinglePostPage;
