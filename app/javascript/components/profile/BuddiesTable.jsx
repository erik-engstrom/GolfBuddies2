import React from 'react';
import { Link } from 'react-router-dom';

const BuddiesTable = ({ buddies }) => {
  // If there are no buddies, show a message
  if (!buddies || buddies.length === 0) {
    return (
      <div className="mt-6">
        <h3 className="text-xl font-semibold mb-3">Your Buddies</h3>
        <p className="text-gray-500 italic">You don't have any buddies yet. Accept some buddy requests to get started!</p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h3 className="text-xl font-semibold mb-3">Your Buddies</h3>
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full">
          <thead className="bg-fairway-100">
            <tr>
              <th className="py-3 px-4 text-left text-sm font-medium text-fairway-800">Golfer</th>
              <th className="py-3 px-4 text-left text-sm font-medium text-fairway-800">Handicap</th>
              <th className="py-3 px-4 text-left text-sm font-medium text-fairway-800">Playing Style</th>
              <th className="py-3 px-4 text-left text-sm font-medium text-fairway-800">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {buddies.map(buddy => (
              <tr key={buddy.id} className="hover:bg-gray-50">
                <td className="py-3 px-4">
                  <Link to={`/users/${buddy.id}`} className="flex items-center">
                    {buddy.profilePictureUrl ? (
                      <img 
                        src={buddy.profilePictureUrl} 
                        alt={buddy.fullName} 
                        className="w-8 h-8 rounded-full mr-3"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-fairway-200 flex items-center justify-center mr-3">
                        <span className="text-fairway-700 font-semibold">
                          {buddy.fullName.charAt(0)}
                        </span>
                      </div>
                    )}
                    <span className="font-medium hover:underline">{buddy.fullName}</span>
                  </Link>
                </td>
                <td className="py-3 px-4 text-sm text-gray-500">
                  {buddy.handicap ?? 'N/A'}
                </td>
                <td className="py-3 px-4 text-sm text-gray-500">
                  {buddy.playingStyle ? (
                    <span className="capitalize">{buddy.playingStyle}</span>
                  ) : (
                    'N/A'
                  )}
                </td>
                <td className="py-3 px-4">
                  <Link
                    to={`/messages?buddy=${buddy.id}`}
                    className="px-3 py-1 bg-fairway-600 text-white text-xs rounded hover:bg-fairway-700"
                  >
                    Message
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BuddiesTable;
