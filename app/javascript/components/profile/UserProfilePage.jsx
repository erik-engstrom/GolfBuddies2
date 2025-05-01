import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { GET_USER_PROFILE } from '../../graphql/queries';
import { SEND_BUDDY_REQUEST_MUTATION, RESPOND_TO_BUDDY_REQUEST_MUTATION } from '../../graphql/mutations';

const UserProfilePage = () => {
  const { id } = useParams();
  const { data, loading, error, refetch } = useQuery(GET_USER_PROFILE, {
    variables: { id },
  });

  const [sendBuddyRequest, { loading: sendingRequest }] = useMutation(SEND_BUDDY_REQUEST_MUTATION, {
    onCompleted: () => {
      refetch();
    },
  });

  const [respondToBuddyRequest, { loading: respondingToRequest }] = useMutation(RESPOND_TO_BUDDY_REQUEST_MUTATION, {
    onCompleted: () => {
      refetch();
    },
  });

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-600">Error loading profile: {error.message}</div>;

  const user = data?.user;
  if (!user) return <div className="p-8 text-center">User not found.</div>;

  const handleSendBuddyRequest = async () => {
    try {
      await sendBuddyRequest({
        variables: {
          receiverId: user.id
        }
      });
      alert('Buddy request sent successfully!');
    } catch (error) {
      alert(`Failed to send buddy request: ${error.message}`);
    }
  };

  const handleRespondToBuddyRequest = async (requestId, accept) => {
    try {
      await respondToBuddyRequest({
        variables: {
          buddyRequestId: requestId,
          accept
        }
      });
      alert(`Buddy request ${accept ? 'accepted' : 'declined'} successfully!`);
    } catch (error) {
      alert(`Failed to respond to buddy request: ${error.message}`);
    }
  };

  // Helper function to determine buddy status
  const getBuddyStatus = () => {
    if (user.isBuddy) {
      return (
        <div className="flex flex-col space-y-2">
          <span className="text-green-600 font-medium">You are buddies</span>
          <Link 
            to={`/messages?userId=${user.id}`}
            className="px-4 py-2 bg-fairway-600 text-white rounded hover:bg-fairway-700 font-medium text-center"
          >
            Message
          </Link>
        </div>
      );
    }

    if (user.incoming_buddy_request) {
      return (
        <div className="flex space-x-2">
          <span className="text-yellow-600">Buddy request received</span>
          <button
            onClick={() => handleRespondToBuddyRequest(user.incoming_buddy_request.id, true)}
            className="px-2 py-1 bg-green-600 text-white rounded text-xs"
            disabled={respondingToRequest}
          >
            Accept
          </button>
          <button
            onClick={() => handleRespondToBuddyRequest(user.incoming_buddy_request.id, false)}
            className="px-2 py-1 bg-red-600 text-white rounded text-xs"
            disabled={respondingToRequest}
          >
            Decline
          </button>
        </div>
      );
    }

    if (user.outgoing_buddy_request) {
      return <span className="text-yellow-600">Buddy request pending</span>;
    }

    return (
      <button
        className="px-4 py-2 bg-fairway-600 text-white rounded hover:bg-fairway-700 font-medium"
        onClick={handleSendBuddyRequest}
        disabled={sendingRequest}
      >
        {sendingRequest ? 'Sending...' : 'Add Buddy'}
      </button>
    );
  };

  return (
    <div className="max-w-xl mx-auto bg-white rounded-lg shadow-md p-8 mt-8">
      <h2 className="text-2xl font-bold text-fairway-800 mb-6">{user.fullName}'s Profile</h2>
      <div className="flex items-center mb-6">
        {user.profilePictureUrl ? (
          <img src={user.profilePictureUrl} alt="Profile" className="w-24 h-24 rounded-full object-cover mr-6 border-2 border-fairway-500" />
        ) : (
          <div className="w-24 h-24 rounded-full bg-fairway-200 flex items-center justify-center text-4xl font-bold text-fairway-700 mr-6">
            {user.firstName.charAt(0)}
          </div>
        )}
        <div className="flex flex-col space-y-2">
          <div className="font-semibold text-fairway-800 text-xl">{user.fullName}</div>
          {getBuddyStatus()}
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
    </div>
  );
};

export default UserProfilePage;
