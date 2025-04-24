import React, { useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { GET_USER_PROFILE } from '../../graphql/queries';
import { SEND_BUDDY_REQUEST_MUTATION, RESPOND_TO_BUDDY_REQUEST_MUTATION, UPDATE_PROFILE_PICTURE_MUTATION } from '../../graphql/mutations';

const Profile = ({ currentUser }) => {
  const { userId } = useParams();
  const isOwnProfile = currentUser?.id === userId;
  const fileInputRef = useRef(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  const { loading, error, data, refetch } = useQuery(GET_USER_PROFILE, {
    variables: { id: userId }
  });
  
  const [sendBuddyRequest, { loading: sendingRequest }] = useMutation(SEND_BUDDY_REQUEST_MUTATION, {
    refetchQueries: [{ query: GET_USER_PROFILE, variables: { id: userId } }]
  });
  
  const [respondToBuddyRequest, { loading: respondingToRequest }] = useMutation(RESPOND_TO_BUDDY_REQUEST_MUTATION, {
    refetchQueries: [{ query: GET_USER_PROFILE, variables: { id: userId } }]
  });
  
  const [updateProfilePicture] = useMutation(UPDATE_PROFILE_PICTURE_MUTATION, {
    onCompleted: () => {
      setUploadingPhoto(false);
      refetch(); // Refetch the profile to update the UI with the new photo
    },
    onError: (error) => {
      console.error("Error uploading profile picture:", error);
      setUploadingPhoto(false);
    }
  });
  
  const handleSendBuddyRequest = () => {
    sendBuddyRequest({
      variables: {
        receiverId: userId
      }
    });
  };
  
  const handleRespondToBuddyRequest = (buddyRequestId, accept) => {
    respondToBuddyRequest({
      variables: {
        buddyRequestId,
        accept
      }
    });
  };

  const handleProfilePictureClick = () => {
    if (isOwnProfile && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingPhoto(true);
    updateProfilePicture({ 
      variables: { 
        profilePicture: file 
      } 
    });
  };
  
  if (loading) return <div className="text-center py-10">Loading profile...</div>;
  if (error) return <div className="text-center py-10 text-flag-600">Error loading profile: {error.message}</div>;
  
  const user = data.user;
  if (!user) return <div className="text-center py-10 text-flag-600">User not found</div>;
  
  return (
    <div className="max-w-4xl mx-auto">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        {/* Cover photo - golf course background */}
        <div className="h-48 bg-gradient-to-r from-fairway-400 to-fairway-600 relative">
          {/* Profile picture */}
          <div className="absolute bottom-0 left-8 transform translate-y-1/2">
            <div
              onClick={handleProfilePictureClick}
              className={`relative ${isOwnProfile ? 'cursor-pointer group' : ''}`}
            >
              {user.profilePictureUrl ? (
                <img 
                  src={user.profilePictureUrl} 
                  alt={user.fullName}
                  className="h-32 w-32 rounded-full border-4 border-white object-cover"
                />
              ) : (
                <div className="h-32 w-32 rounded-full border-4 border-white bg-fairway-500 text-white flex items-center justify-center text-3xl">
                  {user.firstName[0]}{user.lastName[0]}
                </div>
              )}
              
              {/* Overlay for own profile */}
              {isOwnProfile && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full border-4 border-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              )}
              
              {/* Loading indicator */}
              {uploadingPhoto && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full border-4 border-white flex items-center justify-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white"></div>
                </div>
              )}
            </div>
            
            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>
        </div>
        
        <div className="pt-20 pb-6 px-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-fairway-800">{user.fullName}</h1>
              <p className="text-gray-600">
                {user.handicap !== null && (
                  <span className="mr-3">Handicap: <span className="font-medium">{user.handicap}</span></span>
                )}
                {user.playingStyle && (
                  <span>Style: <span className="font-medium capitalize">{user.playingStyle}</span></span>
                )}
              </p>
            </div>
            
            {!isOwnProfile && (
              <div>
                {/* Show appropriate button based on buddy status */}
                <button
                  onClick={handleSendBuddyRequest}
                  className="bg-fairway-600 text-white py-2 px-4 rounded-md hover:bg-fairway-700 focus:outline-none focus:ring-2 focus:ring-fairway-500 focus:ring-offset-2 disabled:opacity-50"
                  disabled={sendingRequest}
                >
                  {sendingRequest ? 'Processing...' : 'Add as Buddy'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* User's Posts */}
      <div>
        <h2 className="text-xl font-bold text-fairway-800 mb-4">{isOwnProfile ? 'Your Posts' : `${user.firstName}'s Posts`}</h2>
        
        {user.posts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-gray-600">
              {isOwnProfile ? "You haven't posted anything yet." : "This user hasn't posted anything yet."}
            </p>
            {isOwnProfile && (
              <Link to="/" className="mt-3 inline-block text-fairway-600 hover:text-fairway-800">
                Go to feed to create your first post
              </Link>
            )}
          </div>
        ) : (
          user.posts.map(post => (
            <div key={post.id} className="bg-white rounded-lg shadow-md mb-6 p-4">
              <div className="flex items-center mb-3">
                {user.profilePictureUrl ? (
                  <img 
                    src={user.profilePictureUrl} 
                    alt={user.fullName}
                    className="h-10 w-10 rounded-full mr-3 object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-fairway-500 text-white flex items-center justify-center mr-3">
                    {user.firstName[0]}{user.lastName[0]}
                  </div>
                )}
                <div>
                  <p className="font-medium text-fairway-800">{user.fullName}</p>
                  <p className="text-gray-500 text-sm">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <p className="text-gray-800 mb-4">{post.content}</p>
              
              {post.imageUrl && (
                <div className="mb-4">
                  <img 
                    src={post.imageUrl} 
                    alt="Post image"
                    className="rounded-lg w-full object-cover max-h-96"
                  />
                </div>
              )}
              
              <div className="flex items-center text-sm text-gray-500 mt-2">
                <div className="mr-6">
                  <span className="font-medium text-fairway-700">{post.likesCount}</span> likes
                </div>
                <div>
                  <span className="font-medium text-fairway-700">{post.commentsCount}</span> comments
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Profile;
