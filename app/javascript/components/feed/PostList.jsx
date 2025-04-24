import React from 'react';
import { useQuery } from '@apollo/client';
import { GET_FEED_POSTS } from '../../graphql/queries';
import Post from './Post';

const PostList = () => {
  const { loading, error, data, refetch } = useQuery(GET_FEED_POSTS);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-fairway-600"></div>
    </div>
  );

  if (error) return (
    <div className="bg-flag-100 border border-flag-400 text-flag-700 px-4 py-3 rounded mb-4">
      Error loading posts: {error.message}
    </div>
  );

  const posts = data?.posts || [];

  if (posts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
        No posts yet. Be the first to share your golf experience!
      </div>
    );
  }

  return (
    <div>
      {posts.map(post => (
        <Post key={post.id} post={post} refetchPosts={refetch} />
      ))}
    </div>
  );
};

export default PostList;
