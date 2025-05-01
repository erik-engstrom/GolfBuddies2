import React, { useRef } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { CURRENT_USER_QUERY } from '../../graphql/queries';
import { UPDATE_PROFILE_PICTURE_MUTATION } from '../../graphql/mutations';
import BuddyRequestTable from './BuddyRequestTable';
import BuddiesTable from './BuddiesTable';

const ProfilePage = () => {
  const { data, loading, error, refetch } = useQuery(CURRENT_USER_QUERY);
  const [updateProfilePicture, { loading: uploading }] = useMutation(UPDATE_PROFILE_PICTURE_MUTATION, {
    onCompleted: () => refetch(),
  });
  const fileInputRef = useRef();

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-600">Error loading profile.</div>;

  const user = data?.me;
  if (!user) return <div className="p-8 text-center">User not found.</div>;
  
  // Debug output for profile picture
  console.log("User data:", user);
  console.log("Profile picture URL:", user.profilePictureUrl);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      // Ensure file is being passed correctly for GraphQL Upload type
      await updateProfilePicture({ 
        variables: { 
          profilePicture: file 
        }
      });
      console.log("Profile picture upload completed successfully");
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      alert('Failed to upload profile picture: ' + error.message);
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white rounded-lg shadow-md p-8 mt-8">
      <h2 className="text-2xl font-bold text-fairway-800 mb-6">My Profile</h2>
      <div className="flex items-center mb-6">
        {user.profilePictureUrl ? (
          <img src={user.profilePictureUrl} alt="Profile" className="w-24 h-24 rounded-full object-cover mr-6 border-2 border-fairway-500" />
        ) : (
          <div className="w-24 h-24 rounded-full bg-fairway-200 flex items-center justify-center text-4xl font-bold text-fairway-700 mr-6">
            {user.firstName.charAt(0)}
          </div>
        )}
        <div>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileChange}
            disabled={uploading}
          />
          <button
            className="px-4 py-2 bg-fairway-600 text-white rounded hover:bg-fairway-700 font-medium"
            onClick={() => fileInputRef.current.click()}
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Change Photo'}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="text-gray-500 text-sm">First Name</div>
          <div className="font-semibold text-fairway-800">{user.firstName}</div>
        </div>
        <div>
          <div className="text-gray-500 text-sm">Last Name</div>
          <div className="font-semibold text-fairway-800">{user.lastName}</div>
        </div>
        <div>
          <div className="text-gray-500 text-sm">Handicap</div>
          <div className="font-semibold text-fairway-800">{user.handicap ?? 'N/A'}</div>
        </div>
        <div>
          <div className="text-gray-500 text-sm">Playing Style</div>
          <div className="font-semibold text-fairway-800">{user.playingStyle || 'N/A'}</div>
        </div>
      </div>
      {/* Buddy Request Tables */}
      <div className="max-w-xl mx-auto bg-white rounded-lg shadow-md p-8 mt-8">
        <h2 className="text-2xl font-bold text-fairway-800 mb-6">Buddy Connections</h2>
        
        {/* Your Buddies Table - shows only accepted buddy connections */}
        <BuddiesTable buddies={user.buddies} />
        
        {/* Received Requests Table - shows only pending requests */}
        <BuddyRequestTable 
          title="Received Buddy Requests" 
          requests={user.receivedBuddyRequests?.filter(req => req.status === 'pending')} 
          type="received" 
          refetch={refetch}
        />
        
        {/* Sent Requests Table - shows only pending requests */}
        <BuddyRequestTable 
          title="Sent Buddy Requests" 
          requests={user.sentBuddyRequests?.filter(req => req.status === 'pending')} 
          type="sent" 
          refetch={refetch}
        />
      </div>
    </div>
  );
};

export default ProfilePage;
