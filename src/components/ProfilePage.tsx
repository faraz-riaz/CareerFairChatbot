import React, { useState, useRef } from 'react';
import { User } from '../types/auth';
import { ArrowLeft, Edit2, Key, Trash2, Save, X, Upload, CheckCircle, FileText } from 'lucide-react';
import { Modal } from './Modal';
import { pdfToText } from '../lib/pdfToText';
import ReactMarkdown from 'react-markdown';
import { initializeGemini } from '../lib/gemini';

interface ProfilePageProps {
  user: User;
  onBack: () => void;
  onUpdate: (updates: Partial<User>) => Promise<void>;
  onChangePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  onDelete: () => Promise<void>;
}

export function ProfilePage({ 
  user, 
  onBack, 
  onUpdate,
  onChangePassword,
  onDelete 
}: ProfilePageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editedData, setEditedData] = useState({
    name: user.name,
    age: user.age,
    jobTitle: user.jobTitle,
  });
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await onUpdate(editedData);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await onChangePassword(passwordData.oldPassword, passwordData.newPassword);
      setIsPasswordModalOpen(false);
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
      return;
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    setUploadError(null);
    
    try {
      let text = '';
      
      if (file.type === 'application/pdf') {
        try {
          text = await pdfToText(file);
        } catch (pdfError) {
          console.error('Resume processing error:', pdfError);
          setUploadError(pdfError instanceof Error 
            ? pdfError.message 
            : 'Failed to process PDF file');
          setIsUploading(false);
          return;
        }
      } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        text = await file.text();
      } else {
        setUploadError('Unsupported file type. Please upload a PDF or TXT file.');
        setIsUploading(false);
        return;
      }
      
      if (!text.trim()) {
        setUploadError('No text could be extracted from the file. Please try a different file or paste the text directly.');
        setIsUploading(false);
        return;
      }
      
      try {
        await onUpdate({ resume: text });
        setUploadSuccess('Resume uploaded successfully!');
        setTimeout(() => setUploadSuccess(null), 3000);
      } catch (updateError) {
        console.error('Failed to update profile with resume:', updateError);
        if (updateError instanceof Error) {
          if (updateError.message.includes('authenticate') || updateError.message.includes('log in')) {
            setUploadError('Your session has expired. Please log in again.');
            // Optionally redirect to login page
          } else {
            setUploadError('Failed to save resume to your profile. Please try again.');
          }
        }
      }
    } catch (error) {
      console.error('File upload error:', error);
      setUploadError('Failed to process the file. Please try again or paste the text directly.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900 min-h-screen overflow-y-auto">
      <div className="max-w-4xl mx-auto p-8 pb-24">
        {/* Header - Make it sticky */}
        <div className="sticky top-0 z-10 flex items-center justify-between mb-8 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              title="Back to chat"
            >
              <ArrowLeft className="h-6 w-6 text-gray-600 dark:text-gray-300" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile Settings</h1>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
            >
              <Edit2 className="h-4 w-4" />
              Edit Profile
            </button>
          )}
        </div>

        {/* Content Container */}
        <div className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
              {error}
            </div>
          )}

          {/* Main Content */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <div className="p-6">
              {isEditing ? (
                <form onSubmit={handleSave} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Name
                    </label>
                    <input
                      type="text"
                      value={editedData.name}
                      onChange={(e) =>
                        setEditedData((prev) => ({ ...prev, name: e.target.value }))
                      }
                      className="mt-1 w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email
                    </label>
                    <input
                      type="email"
                      value={user.email}
                      onChange={(e) =>
                        setEditedData((prev) => ({ ...prev, email: e.target.value }))
                      }
                      className="mt-1 w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Age
                    </label>
                    <input
                      type="number"
                      value={editedData.age}
                      onChange={(e) =>
                        setEditedData((prev) => ({
                          ...prev,
                          age: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="mt-1 w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Job Title
                    </label>
                    <input
                      type="text"
                      value={editedData.jobTitle}
                      onChange={(e) =>
                        setEditedData((prev) => ({
                          ...prev,
                          jobTitle: e.target.value,
                        }))
                      }
                      className="mt-1 w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</div>
                    <div className="mt-1 text-gray-900 dark:text-white">{user.name}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</div>
                    <div className="mt-1 text-gray-900 dark:text-white">{user.email}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Age</div>
                    <div className="mt-1 text-gray-900 dark:text-white">{user.age}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Job Title</div>
                    <div className="mt-1 text-gray-900 dark:text-white">{user.jobTitle}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Resume Upload Section - More Discrete Version */}
            <div className="border-t dark:border-gray-700 mt-6">
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-medium text-gray-900 dark:text-white">
                    Resume
                  </h3>
                  
                  {user.resume && (
                    <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                      <CheckCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                      <span>Resume uploaded</span>
                    </div>
                  )}
                </div>

                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center">
                    <div className="mr-3 bg-purple-100 dark:bg-purple-900/20 rounded-full p-2">
                      <FileText className="h-5 w-5 text-purple-500 dark:text-purple-400" />
                    </div>
                    
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1.5">
                        {user.resume 
                          ? "Update your resume (PDF only)" 
                          : "Upload your resume to improve job recommendations"}
                      </p>
                      
                      <label 
                        htmlFor="resume-upload" 
                        className="inline-flex items-center text-xs px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded cursor-pointer transition-colors"
                      >
                        <Upload className="h-3 w-3 mr-1.5" />
                        {user.resume ? "Replace PDF" : "Upload PDF"}
                        <input
                          id="resume-upload"
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,application/pdf"
                          onChange={handleFileUpload}
                          disabled={isUploading}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {isUploading && (
                    <div className="mt-2 text-xs text-blue-500 flex items-center">
                      <svg className="animate-spin mr-1.5 h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Processing...</span>
                    </div>
                  )}

                  {uploadError && (
                    <div className="mt-2 text-xs text-red-500 p-2 bg-red-50 dark:bg-red-900/10 rounded">
                      <div className="flex items-start">
                        <svg className="h-3 w-3 text-red-400 mr-1.5 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span>{uploadError}</span>
                      </div>
                    </div>
                  )}

                  {uploadSuccess && (
                    <div className="mt-2 text-xs text-green-500 p-2 bg-green-50 dark:bg-green-900/10 rounded">
                      <div className="flex items-start">
                        <svg className="h-3 w-3 text-green-400 mr-1.5 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>{uploadSuccess}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="border-t dark:border-gray-700 p-6 space-y-4">
              <button
                onClick={() => setIsPasswordModalOpen(true)}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors w-full"
              >
                <Key className="h-4 w-4" />
                Change Password
              </button>
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-2 rounded-lg transition-colors w-full"
              >
                <Trash2 className="h-4 w-4" />
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => {
          setIsPasswordModalOpen(false);
          setError(null);
          setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
        }}
        title="Change Password"
      >
        <div className="space-y-4">
          {error && (
            <div className="p-3 text-sm bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Current Password
            </label>
            <input
              type="password"
              value={passwordData.oldPassword}
              onChange={(e) =>
                setPasswordData((prev) => ({
                  ...prev,
                  oldPassword: e.target.value,
                }))
              }
              className="mt-1 w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              New Password
            </label>
            <input
              type="password"
              value={passwordData.newPassword}
              onChange={(e) =>
                setPasswordData((prev) => ({
                  ...prev,
                  newPassword: e.target.value,
                }))
              }
              className="mt-1 w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Confirm New Password
            </label>
            <input
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) =>
                setPasswordData((prev) => ({
                  ...prev,
                  confirmPassword: e.target.value,
                }))
              }
              className="mt-1 w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button
              onClick={() => setIsPasswordModalOpen(false)}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handlePasswordChange}
              disabled={isLoading}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 transition-colors"
            >
              Change Password
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Account"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            Are you sure you want to delete your account? This action cannot be
            undone.
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onDelete}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Delete Account
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
} 