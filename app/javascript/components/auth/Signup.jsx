import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { SIGN_UP_MUTATION } from '../../graphql/mutations';

const Signup = ({ onLogin }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [handicap, setHandicap] = useState('');
  const [playingStyle, setPlayingStyle] = useState('');
  const [error, setError] = useState('');
  
  const [signUp, { loading }] = useMutation(SIGN_UP_MUTATION, {
    onCompleted: (data) => {
      if (data.signUp.errors.length) {
        setError(data.signUp.errors[0]);
      } else {
        onLogin(data.signUp.token);
      }
    },
    onError: (error) => {
      setError(error.message);
    }
  });
  
  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    if (password !== passwordConfirmation) {
      setError('Passwords do not match');
      return;
    }
    
    signUp({
      variables: {
        firstName,
        lastName,
        email,
        password,
        passwordConfirmation,
        handicap: handicap ? parseFloat(handicap) : null,
        playingStyle: playingStyle || null
      }
    });
  };
  
  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden mt-8">
      <div className="bg-fairway-600 py-4 px-6">
        <h2 className="text-2xl font-bold text-white">Join Golf Buddies</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="py-6 px-8">
        {error && (
          <div className="bg-flag-100 border border-flag-400 text-flag-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <div className="flex flex-wrap -mx-2">
          <div className="w-1/2 px-2 mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="firstName">
              First Name
            </label>
            <input
              id="firstName"
              type="text"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
          
          <div className="w-1/2 px-2 mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="lastName">
              Last Name
            </label>
            <input
              id="lastName"
              type="text"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="passwordConfirmation">
            Confirm Password
          </label>
          <input
            id="passwordConfirmation"
            type="password"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            required
            minLength={6}
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="handicap">
            Handicap (optional)
          </label>
          <input
            id="handicap"
            type="number"
            step="0.1"
            min="0"
            max="54"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={handicap}
            onChange={(e) => setHandicap(e.target.value)}
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="playingStyle">
            Playing Style (optional)
          </label>
          <select
            id="playingStyle"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={playingStyle}
            onChange={(e) => setPlayingStyle(e.target.value)}
          >
            <option value="">Select a style</option>
            <option value="fun">Fun</option>
            <option value="competitive">Competitive</option>
            <option value="social">Social</option>
          </select>
        </div>
        
        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="bg-fairway-600 hover:bg-fairway-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
          <Link to="/login" className="inline-block align-baseline font-bold text-sm text-fairway-600 hover:text-fairway-800">
            Already have an account?
          </Link>
        </div>
      </form>
    </div>
  );
};

export default Signup;
