import React, { useState } from 'react';
import { SignupData } from '../../types/auth';
import { UserPlus } from 'lucide-react';

interface SignupFormProps {
  onSubmit: (data: SignupData) => Promise<void>;
  onSwitchToLogin: () => void;
}

export function SignupForm({ onSubmit, onSwitchToLogin }: SignupFormProps) {
  const [formData, setFormData] = useState<SignupData>({
    name: '',
    email: '',
    password: '',
    age: 0,
    jobTitle: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign up');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-6">Sign Up</h2>
      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            className="mt-1 w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, email: e.target.value }))
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
            value={formData.password}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, password: e.target.value }))
            }
            className="mt-1 w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Age</label>
          <input
            type="number"
            value={formData.age || ''}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                age: parseInt(e.target.value) || 0,
              }))
            }
            className="mt-1 w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
            required
            min="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Job Title
          </label>
          <input
            type="text"
            value={formData.jobTitle}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, jobTitle: e.target.value }))
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
            'Signing up...'
          ) : (
            <>
              <UserPlus className="h-4 w-4" />
              Sign Up
            </>
          )}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-600">
        Already have an account?{' '}
        <button
          onClick={onSwitchToLogin}
          className="text-purple-500 hover:text-purple-600"
        >
          Login
        </button>
      </p>
    </div>
  );
} 