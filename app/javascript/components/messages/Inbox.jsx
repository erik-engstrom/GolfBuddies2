import React, { useContext } from 'react';
import Messages from './Messages';
import { CurrentUserContext } from '../../app/CurrentUserContext';

const Inbox = () => {
  const { currentUser, loading } = useContext(CurrentUserContext);
  
  if (loading) {
    return (
      <div className="container mx-auto mt-8 px-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-fairway-800 mb-6">Messages</h1>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-fairway-600"></div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto mt-8 px-4">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-fairway-800 mb-6">Messages</h1>
        <Messages currentUser={currentUser} />
      </div>
    </div>
  );
};

export default Inbox;
