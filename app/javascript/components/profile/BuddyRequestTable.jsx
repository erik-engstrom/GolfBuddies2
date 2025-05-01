import React from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { formatDistanceToNow } from 'date-fns';
import { RESPOND_TO_BUDDY_REQUEST_MUTATION } from '../../graphql/mutations';

const BuddyRequestTable = ({ title, requests, type, refetch }) => {
  const [respondToBuddyRequest, { loading }] = useMutation(RESPOND_TO_BUDDY_REQUEST_MUTATION, {
    onCompleted: () => {
      refetch();
    }
  });

  const handleRespondToBuddyRequest = async (requestId, accept) => {
    try {
      await respondToBuddyRequest({ 
        variables: { 
          buddyRequestId: requestId, 
          accept 
        }
      });
    } catch (error) {
      console.error(`Error ${accept ? 'accepting' : 'declining'} buddy request:`, error);
    }
  };

  // If there are no requests, show a message
  if (!requests || requests.length === 0) {
    return (
      <div className="mt-6">
        <h3 className="text-xl font-semibold mb-3">{title}</h3>
        <p className="text-gray-500 italic">No buddy requests to display.</p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full">
          <thead className="bg-fairway-100">
            <tr>
              <th className="py-3 px-4 text-left text-sm font-medium text-fairway-800">Golfer</th>
              <th className="py-3 px-4 text-left text-sm font-medium text-fairway-800">Status</th>
              <th className="py-3 px-4 text-left text-sm font-medium text-fairway-800">Sent</th>
              {type === 'received' && (
                <th className="py-3 px-4 text-left text-sm font-medium text-fairway-800">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {requests.map(request => {
              // Determine which user to display based on the request type
              const userToDisplay = type === 'sent' ? request.receiver : request.sender;
              
              return (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <Link to={`/users/${userToDisplay.id}`} className="flex items-center">
                      {userToDisplay.profilePictureUrl ? (
                        <img 
                          src={userToDisplay.profilePictureUrl} 
                          alt={userToDisplay.fullName} 
                          className="w-8 h-8 rounded-full mr-3"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-fairway-200 flex items-center justify-center mr-3">
                          <span className="text-fairway-700 font-semibold">
                            {userToDisplay.fullName.charAt(0)}
                          </span>
                        </div>
                      )}
                      <span className="font-medium hover:underline">{userToDisplay.fullName}</span>
                    </Link>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      request.status === 'accepted' ? 'bg-green-100 text-green-800' : 
                      request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'
                    }`}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">
                    {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                  </td>
                  {type === 'received' && (
                    <td className="py-3 px-4">
                      {request.status === 'pending' ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleRespondToBuddyRequest(request.id, true)}
                            disabled={loading}
                            className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRespondToBuddyRequest(request.id, false)}
                            disabled={loading}
                            className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                          >
                            Decline
                          </button>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">
                          {request.status === 'accepted' ? 'Accepted' : 'Declined'}
                        </span>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BuddyRequestTable;
