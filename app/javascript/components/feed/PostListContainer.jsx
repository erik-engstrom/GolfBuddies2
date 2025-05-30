import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { GET_FEED_POSTS } from '../../graphql/queries';
import PostForm from './PostForm';
import Post from './Post';
import LocationFilter from './LocationFilter';
import { useLocation } from 'react-router-dom';

const PostListContainer = () => {
  const location = useLocation();
  const [targetPostId, setTargetPostId] = useState(null);
  const [targetCommentId, setTargetCommentId] = useState(null);
  const [buddyOnly, setBuddyOnly] = useState(false);
  const [locationFilter, setLocationFilter] = useState(null);
  const [filteredPosts, setFilteredPosts] = useState(null);
  
  const { loading, error, data, refetch } = useQuery(GET_FEED_POSTS, {
    variables: { buddyOnly, locationFilter },
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
    console.log("Refreshing posts with buddyOnly:", buddyOnly, "locationFilter:", locationFilter);
    refetch({ buddyOnly, locationFilter }); // Pass the current filters in the refetch
  };
  
  // Toggle between all posts and buddy-only posts
  const toggleBuddyFeed = () => {
    setBuddyOnly(prevState => !prevState);
  };
  
  // Handler for location filter results
  const handleLocationFilteredPosts = (posts) => {
    setFilteredPosts(posts);
    
    // If null is passed, clear the location filter
    if (posts === null) {
      setLocationFilter(null);
      refreshPosts();
    }
  };

  return (
    <>
      <PostForm refetchPosts={refreshPosts} />
      
      {/* Location Filter */}
      <LocationFilter onPostsLoaded={handleLocationFilteredPosts} buddyOnly={buddyOnly} />
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-fairway-800 mb-4">
            Feed View
            {locationFilter && <span className="ml-2 text-sm font-normal text-gray-600">(Location Filtered)</span>}
          </h2>
          <div className="flex flex-col items-center">
            <div className="inline-flex rounded-md shadow-sm" role="group">
              <button
                className={`px-6 py-3 rounded-l-lg font-medium text-base ${
                  !buddyOnly 
                    ? 'bg-fairway-600 text-white hover:bg-fairway-700' 
                    : 'bg-white text-fairway-600 border border-fairway-300 hover:bg-fairway-50'
                } transition-colors duration-200`}
                onClick={() => setBuddyOnly(false)}
              >
                Public Posts
              </button>
              <button
                className={`px-6 py-3 rounded-r-lg font-medium text-base ${
                  buddyOnly 
                    ? 'bg-fairway-600 text-white hover:bg-fairway-700' 
                    : 'bg-white text-fairway-600 border border-fairway-300 hover:bg-fairway-50'
                } transition-colors duration-200`}
                onClick={() => setBuddyOnly(true)}
              >
                👥 Buddy-Only Posts
              </button>
            </div>
            <p className="mt-3 text-gray-600">
              {buddyOnly 
                ? 'Viewing private buddy-only posts from your golf buddies' 
                : 'Viewing public posts only (no buddy-only posts)'}
            </p>
          </div>
        </div>
      </div>
      {/* Feed title banner */}
      {buddyOnly && (
        <div className="bg-fairway-50 border border-fairway-200 rounded-lg p-4 mb-6 text-center">
          <div className="flex items-center justify-center mb-2">
            <span className="text-2xl mr-2">👥</span>
            <h2 className="text-xl font-semibold text-fairway-800">
              Buddy Feed: Private posts from your golf buddies
            </h2>
          </div>
          <p className="text-sm text-gray-600">
            The Buddy Feed shows only the private buddy-only posts from your golf buddies. 
            These are exclusive posts that are only visible to confirmed buddies.
          </p>
        </div>
      )}
      
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
          {/* Use filtered posts if available, otherwise use query data */}
          {(() => {
            const postsToRender = filteredPosts !== null ? filteredPosts : (data?.posts?.edges?.map(edge => edge.node) || []);
            
            if (postsToRender.length === 0) {
              return (
                <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
                  {locationFilter ? 
                    "No posts found with the current location filter. Try adjusting your filter settings." : 
                    "No posts yet. Be the first to share your golf experience!"}
                </div>
              );
            } else {
              return (
                <div>
                  {postsToRender.map(post => (
                    <Post 
                      key={post.id} 
                      post={post} 
                      refetchPosts={refreshPosts} 
                      isTargetPost={post.id === targetPostId}
                      targetCommentId={post.id === targetPostId ? targetCommentId : null}
                    />
                  ))}
                </div>
              );
            }
          })()}
        </div>
      )}
    </>
  );
};

export default PostListContainer;
