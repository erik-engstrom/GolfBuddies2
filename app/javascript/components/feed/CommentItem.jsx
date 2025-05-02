// filepath: /Users/erikengstrom/Desktop/GolfBuddies2/app/javascript/components/feed/CommentItem.jsx.backup
import React, { useEffect, useRef } from 'react';
import { useMutation } from '@apollo/client';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { TOGGLE_LIKE_MUTATION } from '../../graphql/mutations';

const CommentItem = ({ comment, refetchPosts, isTargetComment = false }) => {
  const commentRef = useRef(null);
  
  const [toggleLike, { loading: likeLoading }] = useMutation(TOGGLE_LIKE_MUTATION, {
    onCompleted: () => {
      refetchPosts();
    },
    onError: (error) => {
      console.error("Error toggling like on comment:", error);
    }
  });

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
            <button 
              onClick={handleLikeToggle}
              disabled={likeLoading}
              className="flex items-center text-xs text-gray-500 hover:text-fairway-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill={comment.likesCount > 0 ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>{comment.likesCount || 0} {comment.likesCount === 1 ? 'Like' : 'Likes'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentItem;
