// This component isolates the comment section from the main Post component
// to prevent the entire post from re-rendering when typing in the comments field
import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { CREATE_COMMENT_MUTATION } from '../../graphql/mutations';
import CommentItem from './CommentItem';

const CommentsSection = ({ post, refetchPosts, targetCommentId = null }) => {
  const [commentContent, setCommentContent] = useState('');
  const [error, setError] = useState('');

  const [createComment, { loading: commentLoading }] = useMutation(CREATE_COMMENT_MUTATION, {
    onCompleted: () => {
      setCommentContent('');
      refetchPosts(); // Only refetch when a comment is actually posted
    },
    onError: (error) => {
      setError(error.message);
    }
  });

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
    <div className="mt-4">
      {error && (
        <div className="bg-flag-100 border border-flag-400 text-flag-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
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
              isTargetComment={comment.id === targetCommentId}
            />
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center">No comments yet. Be the first to comment!</p>
      )}
    </div>
  );
};

export default CommentsSection;
