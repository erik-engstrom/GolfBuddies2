import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { GET_FEED_POSTS } from '../../graphql/queries';
import PostForm from './PostForm';
import Post from './Post';
import { useLocation } from 'react-router-dom';

const PostListContainer = () => {
  const location = useLocation();
  const [targetPostId, setTargetPostId] = useState(null);
  const [targetCommentId, setTargetCommentId] = useState(null);
  
  const { loading, error, data, refetch } = useQuery(GET_FEED_POSTS, {
    fetchPolicy: 'network-only', // Always get fresh data
  });

  // Extract post and comment IDs from URL query parameters
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const postId = queryParams.get('post');
    const commentId = queryParams.get('comment');
    
    if (postId) {
      setTargetPostId(postId);
      if (commentId) {
        setTargetCommentId(commentId);
      }
    }
  }, [location]);
  
  // This function will be passed to both PostForm and PostList
  const refreshPosts = () => {
    console.log("Refreshing posts...");
    refetch();
  };

  return (
    <>
      <PostForm refetchPosts={refreshPosts} />
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-fairway-600"></div>
        </div>
      ) : error ? (
        <div className="bg-flag-100 border border-flag-400 text-flag-700 px-4 py-3 rounded mb-4">
          Error loading posts: {error.message}
        </div>
      ) : (
        <div>
          {(data?.posts || []).length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
              No posts yet. Be the first to share your golf experience!
            </div>
          ) : (
            <div>
              {data.posts.map(post => (
                <Post 
                  key={post.id} 
                  post={post} 
                  refetchPosts={refreshPosts} 
                  isTargetPost={post.id === targetPostId}
                  targetCommentId={post.id === targetPostId ? targetCommentId : null}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default PostListContainer;
