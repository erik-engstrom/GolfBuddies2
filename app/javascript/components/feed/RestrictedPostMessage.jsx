import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { GET_USER_INFO } from '../../graphql/queries';
import { SEND_BUDDY_REQUEST_MUTATION } from '../../graphql/mutations';

const RestrictedPostMessage = () => {
  const { postId } = useParams();
  const [authorId, setAuthorId] = useState(null);
  const [authorName, setAuthorName] = useState('');
  const [requestSent, setRequestSent] = useState(false);
  const [error, setError] = useState('');
  
  // Try to fetch information about the post's author
  const { data: userData } = useQuery(GET_USER_INFO, {
    variables: { id: authorId },
    skip: !authorId,
  });
  
  // Mutation for sending a buddy request
  const [sendBuddyRequest, { loading: sendingRequest }] = useMutation(SEND_BUDDY_REQUEST_MUTATION, {
    onCompleted: () => {
      setRequestSent(true);
    },
    onError: (error) => {
      setError(error.message);
    }
  });
  
  // Effect to attempt to get the post author's ID from local storage
  // This is a fallback mechanism in case we have the post data cached
  useEffect(() => {
    try {
      const cachedPosts = localStorage.getItem('cachedPosts');
      if (cachedPosts) {
        const posts = JSON.parse(cachedPosts);
        const post = posts.find(p => p.id === postId);
        if (post && post.user) {
          setAuthorId(post.user.id);
          setAuthorName(post.user.fullName);
        }
      }
    } catch (error) {
      console.error('Error reading cached posts:', error);
    }
  }, [postId]);
  
  // Function to handle sending a buddy request
  const handleSendBuddyRequest = () => {
    if (!authorId) return;
    
    sendBuddyRequest({
      variables: {
        receiverId: authorId
      }
    });
  };
  
  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-flag-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-6V7m0 0V5m0 2h2m-2 0H9m9 2a4 4 0 00-4.564-3.97A4 4 0 003 6v1a3 3 0 000 6h15.59a1 1 0 01.7 1.7l-2 2a1 1 0 01-.7.3H9l3 3m3-12h1a2 2 0 012 2v1" />
          </svg>
          
          <h1 className="text-2xl font-bold text-fairway-800 mb-2">Buddy-Only Post</h1>
          <p className="text-gray-600 mb-6">
            This post is only visible to the author's golf buddies. To view this post, you need to be buddies with the author.
          </p>
          
          {error && (
            <div className="bg-flag-100 border border-flag-400 text-flag-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <div className="flex flex-col items-center space-y-3">
            {authorId && !requestSent && userData?.user && !userData.user.isBuddy && !userData.user.outgoingBuddyRequest && (
              <button
                onClick={handleSendBuddyRequest}
                disabled={sendingRequest}
                className="px-6 py-3 bg-fairway-600 text-white font-medium rounded-md hover:bg-fairway-700 transition-colors duration-150 w-full md:w-auto"
              >
                {sendingRequest ? 'Sending...' : `Send Buddy Request to ${authorName}`}
              </button>
            )}
            
            {requestSent && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
                Buddy request sent successfully!
              </div>
            )}
            
            {authorId && userData?.user?.outgoingBuddyRequest && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded mb-4">
                You already have a pending buddy request with this user.
              </div>
            )}
            
            <Link
              to="/"
              className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-md hover:bg-gray-300 transition-colors duration-150 w-full md:w-auto"
            >
              Return to Feed
            </Link>
          </div>
        </div>
      </div>
      
      <div className="bg-fairway-50 border border-fairway-200 rounded-lg p-4">
        <h2 className="font-medium text-fairway-800 mb-2">About Buddy-Only Posts</h2>
        <p className="text-gray-600">
          Golf Buddies allows users to create posts that are only visible to their confirmed buddies. 
          This helps create more personal connections and share private golf experiences with your closest golf friends.
        </p>
      </div>
    </div>
  );
};

export default RestrictedPostMessage;
