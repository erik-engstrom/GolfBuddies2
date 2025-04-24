import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { formatDistanceToNow } from 'date-fns';
import { TOGGLE_LIKE_MUTATION, CREATE_COMMENT_MUTATION } from '../../graphql/mutations';
import CommentItem from './CommentItem';

const Post = ({ post, refetchPosts }) => {
  const [showComments, setShowComments] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [error, setError] = useState('');

  // Toggle like mutation
  const [toggleLike, { loading: likeLoading }] = useMutation(TOGGLE_LIKE_MUTATION, {
    onCompleted: () => {
      refetchPosts();
    },
    onError: (error) => {
      setError(error.message);
    }
  });

  // Create comment mutation
  const [createComment, { loading: commentLoading }] = useMutation(CREATE_COMMENT_MUTATION, {
    onCompleted: () => {
      setCommentContent('');
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

  // Handle comment submission
  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!commentContent.trim()) {
      setError('Comment cannot be empty');
      return;
    }

    createComment({
      variables: {
        postId: post.id,
        content: commentContent
      }
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      {error && (
        <div className="bg-flag-100 border border-flag-400 text-flag-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="flex items-start mb-4">
        <div className="flex-shrink-0 mr-3">
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
        </div>
        
        <div className="flex-1">
          <h3 className="font-bold text-fairway-800">{post.user.fullName}</h3>
          <p className="text-sm text-gray-500">
            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
          </p>
        </div>
      </div>
      
      <div className="mb-4">
        <p className="text-gray-800">{post.content}</p>
        {post.imageUrl && (
          <img 
            src={post.imageUrl} 
            alt="Post attachment" 
            className="mt-3 rounded-lg max-h-96 w-auto"
          />
        )}
      </div>
      
      <div className="flex border-t border-b py-2 mb-3">
        <button 
          onClick={handleLikeToggle}
          disabled={likeLoading}
          className="flex items-center mr-4 text-gray-500 hover:text-fairway-600"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span>{post.likesCount || 0} {post.likesCount === 1 ? 'Like' : 'Likes'}</span>
        </button>
        
        <button 
          onClick={() => setShowComments(!showComments)}
          className="flex items-center text-gray-500 hover:text-fairway-600"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span>{post.commentsCount || 0} {post.commentsCount === 1 ? 'Comment' : 'Comments'}</span>
        </button>
      </div>
      
      {/* Comments section */}
      {showComments && (
        <div className="mt-4">
          <form onSubmit={handleCommentSubmit} className="mb-4">
            <div className="flex">
              <input
                type="text"
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-fairway-500"
              />
              <button
                type="submit"
                disabled={commentLoading}
                className={`px-4 py-2 rounded-r-md ${
                  commentLoading ? 'bg-gray-400' : 'bg-fairway-600 hover:bg-fairway-700'
                } text-white`}
              >
                {commentLoading ? 'Posting...' : 'Post'}
              </button>
            </div>
          </form>
          
          {post.comments && post.comments.length > 0 ? (
            <div className="space-y-3">
              {post.comments.map(comment => (
                <CommentItem 
                  key={comment.id} 
                  comment={comment} 
                  refetchPosts={refetchPosts} 
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center">No comments yet. Be the first to comment!</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Post;
