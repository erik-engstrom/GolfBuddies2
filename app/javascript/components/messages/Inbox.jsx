import React from 'react';
import Messages from './Messages';

const Inbox = ({ currentUser }) => {
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
