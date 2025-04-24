import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { SIGN_IN_MUTATION } from '../../graphql/mutations';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const [signIn, { loading }] = useMutation(SIGN_IN_MUTATION, {
    onCompleted: (data) => {
      if (data.signIn.errors.length) {
        setError(data.signIn.errors[0]);
      } else {
        onLogin(data.signIn.token);
      }
    },
    onError: (error) => {
      setError(error.message);
    }
  });
  
  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    signIn({ variables: { email, password } });
  };
  
  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden mt-16">
      <div className="bg-fairway-600 py-4 px-6">
        <h2 className="text-2xl font-bold text-white">Login to Golf Buddies</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="py-6 px-8">
        {error && (
          <div className="bg-flag-100 border border-flag-400 text-flag-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
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
        
        <div className="mb-6">
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
          />
        </div>
        
        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="bg-fairway-600 hover:bg-fairway-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
          <Link to="/signup" className="inline-block align-baseline font-bold text-sm text-fairway-600 hover:text-fairway-800">
            Create Account
          </Link>
        </div>
      </form>
    </div>
  );
};

export default Login;
