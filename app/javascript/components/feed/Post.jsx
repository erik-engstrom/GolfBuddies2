// filepath: /Users/erikengstrom/Desktop/GolfBuddies2/app/javascript/components/feed/Post.jsx
import React, { useState, useContext, useEffect, memo, useRef } from 'react';
import { useMutation } from '@apollo/client';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  TOGGLE_LIKE_MUTATION,
  UPDATE_POST_MUTATION,
  DELETE_POST_MUTATION
} from '../../graphql/mutations';
import { CurrentUserContext } from '../../app/CurrentUserContext';
import CommentsSection from './CommentsSection';
import EditPostModal from './EditPostModal';
import DeletePostConfirmation from './DeletePostConfirmation';
import { FaMapMarkerAlt } from 'react-icons/fa';

const LocationInfo = memo(({ post }) => {
  if (!post.latitude && !post.longitude && !post.city && !post.zipCode) {
    return null; // No location info to display
  }
  
  const hasCoordinates = post.latitude && post.longitude;
  const hasAddress = post.city || post.zipCode;
  
  // Generate location display
  let locationDisplay = '';
  
  if (post.city && post.state) {
    locationDisplay = `${post.city}, ${post.state}`;
  } else if (post.city) {
    locationDisplay = post.city;
  } else if (post.zipCode) {
    locationDisplay = `ZIP: ${post.zipCode}`;
  }
  
  // Include country if it's provided and not local
  if (post.country && post.country !== 'United States') {
    locationDisplay = locationDisplay ? `${locationDisplay}, ${post.country}` : post.country;
  }
  
  // Format distance display if present
  const distanceDisplay = post.distance !== null && post.distance !== undefined 
    ? `${Number(post.distance).toFixed(1)} miles away`
    : '';
    
  // Create Google Maps link for coordinates
  const mapsUrl = hasCoordinates
    ? `https://www.google.com/maps/search/?api=1&query=${post.latitude},${post.longitude}`
    : hasAddress ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationDisplay)}` : null;
  
  return (
    <div className="mt-2 flex items-center text-xs text-gray-600">
      <FaMapMarkerAlt className="mr-1 text-red-500" />
      {mapsUrl ? (
        <a 
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline"
        >
          {locationDisplay}
          {distanceDisplay && ` (${distanceDisplay})`}
        </a>
      ) : (
        <span>
          {locationDisplay}
          {distanceDisplay && ` (${distanceDisplay})`}
        </span>
      )}
    </div>
  );
});

LocationInfo.displayName = 'LocationInfo';

const Post = ({ post, refetchPosts, isTargetPost = false, targetCommentId = null }) => {
  const { currentUser } = useContext(CurrentUserContext);
  const [showComments, setShowComments] = useState(false);
  const [error, setError] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [showLikesTooltip, setShowLikesTooltip] = useState(false);
  
  // Cache post data in localStorage for restricted post messages
  useEffect(() => {
    if (post?.id) {
      try {
        // Get existing cached posts
        const cachedPostsString = localStorage.getItem('cachedPosts');
        let cachedPosts = cachedPostsString ? JSON.parse(cachedPostsString) : [];
        
        // Find if this post is already cached
        const existingIndex = cachedPosts.findIndex(p => p.id === post.id);
        
        // Create a minimal version of the post to cache
        const postToCache = {
          id: post.id,
          user: {
            id: post.user.id,
            fullName: post.user.fullName
          },
          buddyOnly: post.buddyOnly
        };
        
        // Update or add the post
        if (existingIndex >= 0) {
          cachedPosts[existingIndex] = postToCache;
        } else {
          // Add to beginning, limit to 50 posts
          cachedPosts.unshift(postToCache);
          if (cachedPosts.length > 50) {
            cachedPosts = cachedPosts.slice(0, 50);
          }
        }
        
        // Save back to localStorage
        localStorage.setItem('cachedPosts', JSON.stringify(cachedPosts));
      } catch (e) {
        console.error('Error caching post data:', e);
      }
    }
  }, [post]);
  
  // Auto-show comments when there's a target comment ID
  useEffect(() => {
    if (targetCommentId) {
      setShowComments(true);
    }
  }, [targetCommentId]);
  const [showPostOptions, setShowPostOptions] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Create a reference for the post element for scrolling
  const postRef = useRef(null);
  
  // Check if the current user is the author of this post
  const isPostAuthor = currentUser && post.user.id === currentUser.id;

  // Track the previous image URL to detect changes
  const [prevImageUrl, setPrevImageUrl] = useState(post.imageUrl || '');
  
  const [toggleLike, { loading: likeLoading }] = useMutation(TOGGLE_LIKE_MUTATION, {
    onCompleted: () => {
      refetchPosts();
    },
    onError: (error) => {
      setError(error.message);
    }
  });

  // Handle like toggle
  const handleLikeToggle = () => {
    toggleLike({
      variables: {
        likeableId: post.id,
        likeableType: "Post"
      }
    });
  };

  // Effect to detect image URL changes
  useEffect(() => {
    // Check if the image URL has changed
    if (post.imageUrl !== prevImageUrl) {
      console.log(`Image URL changed for post ${post.id}:`, { 
        previous: prevImageUrl, 
        current: post.imageUrl 
      });
      setPrevImageUrl(post.imageUrl || '');
      setImageLoaded(false); // Reset loading state on URL change
    }
  }, [post.imageUrl, prevImageUrl, post.id]);

  // Effect to handle image loading
  useEffect(() => {
    if (!post.imageUrl) return;
      
    // Add a cache-busting parameter to force a fresh fetch
    const cacheBuster = Date.now();
    const imgSrc = post.imageUrl.includes('?') 
      ? `${post.imageUrl}&t=${cacheBuster}` 
      : `${post.imageUrl}?t=${cacheBuster}`;
    
    console.log(`Loading image for post ${post.id}: ${imgSrc}`);
    
    // Preload the image
    const img = new Image();
    img.onload = () => {
      console.log(`Image loaded for post ${post.id}`);
      setImageLoaded(true);
    };
    img.onerror = (e) => {
      console.error(`Error loading image for post ${post.id}:`, e);
    };
    img.src = imgSrc;
    
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [post.imageUrl, post.id]);

  // Effect for handling target posts and comments
  useEffect(() => {
    if (isTargetPost) {
      // Auto-scroll to this post with a smooth animation
      if (postRef.current) {
        setTimeout(() => {
          postRef.current.scrollIntoView({ 
            behavior: 'smooth',
            block: 'center'
          });
          
          // Highlight effect
          postRef.current.classList.add('bg-fairway-50');
          setTimeout(() => {
            postRef.current.classList.remove('bg-fairway-50');
            postRef.current.classList.add('bg-white');
          }, 2000);
        }, 300);
      }

      // If we have a target comment, show the comments section
      if (targetCommentId) {
        setShowComments(true);
      }
    }
  }, [isTargetPost, targetCommentId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if the click is outside of the dropdown
      const dropdown = document.getElementById(`post-options-${post.id}`);
      if (showPostOptions && dropdown && !dropdown.contains(event.target)) {
        setShowPostOptions(false);
      }
    };

    // Add event listener when dropdown is open
    if (showPostOptions) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    // Clean up event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPostOptions, post.id]);
  
  // Use a ref for the tooltip container
  const likesTooltipRef = useRef(null);

  // Effect to handle click outside tooltip to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showLikesTooltip && likesTooltipRef.current && !likesTooltipRef.current.contains(event.target)) {
        setShowLikesTooltip(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLikesTooltip]);

  return (
    <div 
      id={`post-${post.id}`}
      ref={postRef} 
      className={`bg-white rounded-lg shadow-md p-6 mb-6 transition-colors duration-500 ${isTargetPost ? 'ring-2 ring-fairway-500' : ''}`}
    >
      {error && (
        <div className="bg-flag-100 border border-flag-400 text-flag-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="flex items-start mb-4">
        <div className="flex-shrink-0 mr-3">
          <Link to={`/users/${post.user.id}`} className="block">
            {post.user.profilePictureUrl ? (
              <img 
                src={post.user.profilePictureUrl} 
                alt={post.user.fullName} 
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-fairway-300 flex items-center justify-center">
                <span className="text-fairway-800 font-semibold">
                  {post.user.fullName.charAt(0)}
                </span>
              </div>
            )}
          </Link>
        </div>
        
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center">
                <Link to={`/users/${post.user.id}`} className="hover:underline">
                  <h3 className="font-bold text-fairway-800">{post.user.fullName}</h3>
                </Link>
                {post.buddyOnly && (
                  <span className="ml-2 px-2 py-0.5 bg-fairway-100 text-fairway-700 text-xs rounded-full border border-fairway-300">
                    Buddy Only
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </p>
            </div>
            
            {isPostAuthor && (
              <div className="relative">
                <button 
                  onClick={() => setShowPostOptions(prev => !prev)} 
                  className="text-gray-500 hover:text-fairway-600 p-1"
                  aria-label="Post options"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
                
                {showPostOptions && (
                  <div 
                    id={`post-options-${post.id}`}
                    className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                    <button 
                      onClick={() => {
                        setIsEditModalOpen(true);
                        setShowPostOptions(false);
                      }} 
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Post
                    </button>
                    
                    <button 
                      onClick={() => {
                        setIsDeleteConfirmOpen(true);
                        setShowPostOptions(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-flag-700 hover:bg-gray-100 flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete Post
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="mb-4">
        <p className="text-gray-800">{post.content}</p>
        {post.imageUrl && (
          <div className="mt-3 overflow-hidden rounded-lg bg-gray-100 relative">
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-fairway-600"></div>
              </div>
            )}
            <img 
              key={`${post.id}-image-${Date.now()}`} // Dynamic key to force re-render
              src={`${post.imageUrl}${post.imageUrl.includes('?') ? '&' : '?'}nocache=${Date.now()}`} // Strong cache buster
              alt="Post attachment" 
              className={`w-full max-h-96 object-contain transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              loading="eager"
              onLoad={() => setImageLoaded(true)}
              onError={(e) => {
                console.error(`Image failed to load for post ${post.id}:`, e);
                // Attempt to reload after a short delay
                setTimeout(() => {
                  e.target.src = `${post.imageUrl}${post.imageUrl.includes('?') ? '&' : '?'}retry=${Date.now()}`;
                }, 500);
              }}
            />
          </div>
        )}
        <LocationInfo post={post} />
      </div>
      
      <div className="flex border-t border-b py-2 mb-3">
        <div className="relative pt-1 pb-2">
          <button 
            onClick={handleLikeToggle}
            disabled={likeLoading}
            className="flex items-center mr-4 text-gray-500 hover:text-fairway-600"
            onMouseEnter={() => post.likesCount > 0 && setShowLikesTooltip(true)}
            onMouseLeave={() => setShowLikesTooltip(false)}
            ref={likesTooltipRef}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill={post.likesCount > 0 ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span>{post.likesCount || 0} {post.likesCount === 1 ? 'Like' : 'Likes'}</span>
          </button>
          
          {showLikesTooltip && post.likes && post.likes.length > 0 && (
            <div className="absolute transform-gpu -translate-x-1/4 top-full mt-2 bg-white shadow-lg rounded-md py-2 px-3 w-48 z-10 text-sm border border-gray-200 transform transition-opacity duration-200 opacity-100 animate-fadein">
              <div className="absolute -top-2 left-6 w-4 h-4 bg-white border-t border-l border-gray-200 transform rotate-45"></div>
              <h4 className="font-medium text-fairway-700 mb-2 border-b pb-1">Liked by:</h4>
              <ul className="max-h-32 overflow-y-auto">
                {post.likes.map(like => (
                  <li key={like.id} className="mb-1">
                    <Link
                      to={`/users/${like.user.id}`}
                      className="flex items-center hover:bg-fairway-50 p-1 rounded transition duration-150"
                    >
                      {like.user.profilePictureUrl ? (
                        <img
                          src={like.user.profilePictureUrl}
                          alt={like.user.fullName}
                          className="w-5 h-5 rounded-full mr-2 object-cover"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-fairway-300 flex items-center justify-center mr-2 text-xs">
                          {like.user.fullName.charAt(0)}
                        </div>
                      )}
                      <span className="text-fairway-800">{like.user.fullName}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        <button 
          onClick={() => setShowComments(!showComments)}
          className="flex items-center mr-4 text-gray-500 hover:text-fairway-600"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span>{post.commentsCount || 0} {post.commentsCount === 1 ? 'Comment' : 'Comments'}</span>
        </button>
        
        <Link
          to={`/posts/${post.id}`}
          className="flex items-center text-gray-500 hover:text-fairway-600"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          <span>Share</span>
        </Link>
      </div>
      
      {/* Comments section */}
      {showComments && (
        <CommentsSection 
          post={post} 
          refetchPosts={refetchPosts}
          targetCommentId={targetCommentId}
        />
      )}
      
      {/* Edit Post Modal */}
      {isEditModalOpen && (
        <EditPostModal 
          post={post} 
          isOpen={isEditModalOpen} 
          onClose={() => setIsEditModalOpen(false)} 
          refetchPosts={refetchPosts}
        />
      )}
      
      {/* Delete Post Confirmation */}
      {isDeleteConfirmOpen && (
        <DeletePostConfirmation 
          post={post} 
          isOpen={isDeleteConfirmOpen} 
          onClose={() => setIsDeleteConfirmOpen(false)} 
          refetchPosts={refetchPosts}
        />
      )}
      
      {/* Likes Tooltip */}
      {showLikesTooltip && post.likes && post.likes.length > 0 && (
        <div 
          ref={likesTooltipRef}
          className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200"
        >
          <div className="p-2 text-sm text-gray-700">
            {post.likes.map((like, index) => (
              <div key={like.id} className="flex items-center py-1">
                {like.user.profilePictureUrl ? (
                  <img 
                    src={like.user.profilePictureUrl} 
                    alt={like.user.fullName} 
                    className="w-8 h-8 rounded-full mr-2"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-fairway-300 flex items-center justify-center mr-2">
                    <span className="text-fairway-800 font-semibold">
                      {like.user.fullName.charAt(0)}
                    </span>
                  </div>
                )}
                <span className="text-gray-800">{like.user.fullName}</span>
                {index < post.likes.length - 1 && (
                  <div className="w-full h-px bg-gray-200 mx-2"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Use React.memo to prevent unnecessary re-renders
export default memo(Post, (prevProps, nextProps) => {
  // Re-render when post data changes, or when target state changes
  if (prevProps.isTargetPost !== nextProps.isTargetPost || 
      prevProps.targetCommentId !== nextProps.targetCommentId) {
    return false;
  }
  
  // For other cases, only re-render when post data changes
  // This prevents re-renders when typing in the comment field
  return JSON.stringify(prevProps.post) === JSON.stringify(nextProps.post);
});
