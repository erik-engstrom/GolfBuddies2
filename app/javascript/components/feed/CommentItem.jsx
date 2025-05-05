// filepath: /Users/erikengstrom/Desktop/GolfBuddies2/app/javascript/components/feed/CommentItem.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useMutation } from '@apollo/client';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { TOGGLE_LIKE_MUTATION } from '../../graphql/mutations';

const CommentItem = ({ comment, refetchPosts, isTargetComment = false }) => {
  const commentRef = useRef(null);
  const likesTooltipRef = useRef(null);
  const [showLikesTooltip, setShowLikesTooltip] = useState(false);
  
  const [toggleLike, { loading: likeLoading }] = useMutation(TOGGLE_LIKE_MUTATION, {
    onCompleted: () => {
      refetchPosts();
    },
    onError: (error) => {
      console.error("Error toggling like on comment:", error);
    }
  });

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

  // Effect for scrolling to this comment if it's the target
  useEffect(() => {
    if (isTargetComment && commentRef.current) {
      setTimeout(() => {
        commentRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'center'
        });
        
        // Add a highlight effect
        commentRef.current.classList.add('bg-fairway-100');
        setTimeout(() => {
          commentRef.current.classList.remove('bg-fairway-100');
          commentRef.current.classList.add('bg-gray-50');
        }, 2000);
      }, 600); // Wait a bit longer than post scrolling to ensure comments are rendered
    }
  }, [isTargetComment]);

  const handleLikeToggle = () => {
    toggleLike({
      variables: {
        likeableId: comment.id,
        likeableType: "Comment"
      }
    });
  };

  return (
    <div 
      id={`comment-${comment.id}`}
      ref={commentRef} 
      className={`bg-gray-50 p-3 rounded-lg transition-colors duration-500 ${isTargetComment ? 'ring-2 ring-fairway-500' : ''}`}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-2">
          <Link to={`/users/${comment.user.id}`}>
            {comment.user.profilePictureUrl ? (
              <img 
                src={comment.user.profilePictureUrl}
                alt={comment.user.fullName}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-fairway-300 flex items-center justify-center">
                <span className="text-fairway-800 font-semibold text-sm">
                  {comment.user.fullName.charAt(0)}
                </span>
              </div>
            )}
          </Link>
        </div>
        
        <div className="flex-1">
          <Link to={`/users/${comment.user.id}`} className="hover:underline">
            <h4 className="font-semibold text-fairway-800 text-sm">{comment.user.fullName}</h4>
          </Link>
          <p className="text-gray-800">{comment.content}</p>
          <div className="flex items-center mt-1">
            <p className="text-xs text-gray-500 mr-4">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </p>
            <div className="relative pt-1 pb-2">
              <button 
                onClick={handleLikeToggle}
                disabled={likeLoading}
                className="flex items-center text-xs text-gray-500 hover:text-fairway-600"
                onMouseEnter={() => comment.likesCount > 0 && setShowLikesTooltip(true)}
                onMouseLeave={() => setShowLikesTooltip(false)}
                ref={likesTooltipRef}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill={comment.likesCount > 0 ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span>{comment.likesCount || 0} {comment.likesCount === 1 ? 'Like' : 'Likes'}</span>
              </button>
              
              {showLikesTooltip && comment.likes && comment.likes.length > 0 && (
                <div className="absolute transform-gpu -translate-x-1/4 top-full mt-2 bg-white shadow-lg rounded-md py-2 px-3 w-44 z-10 text-xs border border-gray-200 transform transition-opacity duration-200 opacity-100 animate-fadein">
                  <div className="absolute -top-2 left-6 w-3 h-3 bg-white border-t border-l border-gray-200 transform rotate-45"></div>
                  <h4 className="font-medium text-fairway-700 mb-2 border-b pb-1">Liked by:</h4>
                  <ul className="max-h-28 overflow-y-auto">
                    {comment.likes.map(like => (
                      <li key={like.id} className="mb-1">
                        <Link
                          to={`/users/${like.user.id}`}
                          className="flex items-center hover:bg-fairway-50 p-1 rounded transition duration-150"
                        >
                          {like.user.profilePictureUrl ? (
                            <img
                              src={like.user.profilePictureUrl}
                              alt={like.user.fullName}
                              className="w-4 h-4 rounded-full mr-2 object-cover"
                            />
                          ) : (
                            <div className="w-4 h-4 rounded-full bg-fairway-300 flex items-center justify-center mr-2 text-xs">
                              {like.user.fullName.charAt(0)}
                            </div>
                          )}
                          <span className="text-fairway-800 text-xs">{like.user.fullName}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentItem;
