import React, { useState } from 'react';
import { Lock } from 'lucide-react';

const Login = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Hardcoded password - change this to your desired password
  const CORRECT_PASSWORD = 'redpegasus';

  const handleSubmit = (e) => {
    e.preventDefault();

    if (password === CORRECT_PASSWORD) {
      // Store authentication in sessionStorage (expires when browser closes)
      sessionStorage.setItem('isAuthenticated', 'true');
      onLogin();
    } else {
      setError('Incorrect password. Please try again.');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md border border-slate-200">
        {/* Header with Logo */}
        <div className="text-center mb-8">
          <img
            src="https://firebasestorage.googleapis.com/v0/b/proaptus-website.firebasestorage.app/o/LOGO_RGB%20(1).svg?alt=media&token=72b5eb8b-c509-40af-b8d1-84861040be37"
            alt="Proaptus Logo"
            className="h-12 mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Pricing Model
          </h1>
          <p className="text-slate-600">
            Please enter the password to access the application
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-700 mb-2"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(''); // Clear error when typing
              }}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter password"
              autoFocus
              required
              autoComplete="new-password"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
          >
            <Lock className="w-4 h-4" />
            Access Pricing Model
          </button>
        </form>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-600">
            Contact your administrator if you need access
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
