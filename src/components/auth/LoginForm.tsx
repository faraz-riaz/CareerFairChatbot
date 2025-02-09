import React, { useState } from 'react';
import { LoginCredentials } from '../../types/auth';
import { LogIn } from 'lucide-react';

interface LoginFormProps {
  onSubmit: (credentials: LoginCredentials) => Promise<void>;
  onSwitchToSignup: () => void;
}

export function LoginForm({ onSubmit, onSwitchToSignup }: LoginFormProps) {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await onSubmit(credentials);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-6">Login</h2>
      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={credentials.email}
            onChange={(e) =>
              setCredentials((prev) => ({ ...prev, email: e.target.value }))
            }
            className="mt-1 w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            type="password"
            value={credentials.password}
            onChange={(e) =>
              setCredentials((prev) => ({ ...prev, password: e.target.value }))
            }
            className="mt-1 w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
            required
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 px-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            'Logging in...'
          ) : (
            <>
              <LogIn className="h-4 w-4" />
              Login
            </>
          )}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-600">
        Don't have an account?{' '}
        <button
          onClick={onSwitchToSignup}
          className="text-purple-500 hover:text-purple-600"
        >
          Sign up
        </button>
      </p>
    </div>
  );
} 