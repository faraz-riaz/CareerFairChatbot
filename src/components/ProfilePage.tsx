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
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);
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

  const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setResumeError('Please upload a PDF file');
      return;
    }

    try {
      setIsUploadingResume(true);
      setResumeError(null);

      // Convert PDF to text
      const rawResumeText = await pdfToText(file);
      
      // Process resume with Gemini
      const model = await initializeGemini();
      const prompt = `Please analyze this resume and classify all information into the following categories. Use markdown formatting with ## for main categories and ### for subcategories where appropriate. Format as shown in the example below:

## Experience
### Software Engineer at XYZ Company (2022-2023)
- Led development of feature X
- Improved performance by Y%

## Education
### Bachelor of Science in Computer Science
University of Technology, New York
2020-2024
GPA: 3.9/4.0

### Summer Program
Tokyo University of Technology, Tokyo
July, 2023
(No additional information other than the name of the university, location and year)

### Coding Bootcamp
Code Academy, New York
June, 2022 
(No additional information other than the name of the institute, location and year)

## Projects
### E-commerce Platform
Full-stack web application for online retail
- Implemented secure payment processing
- Reduced page load time by 40%
Technologies: \`React\`, \`Node.js\`, \`MongoDB\`, \`AWS\`

## Skills
Python, JavaScript, TypeScript, Java, React, Express, Django, TensorFlow, PostgreSQL, MongoDB, Redis

## Certifications
- AWS Certified Solutions Architect (2023)
- Google Cloud Professional Developer (2022)

Strictly follow the format guidelines.

Only include information that fits into these five categories. Format guidelines:
- Education: Only include degree name, university name and location, year, and GPA if available
- Skills: List all skills on one line, separated by commas
- Certifications and Awards: Simple bullet points with title and year only
- Remove any URLs, links, or references to external websites
Keep all text aligned to the left with no extra indentation except for bullet points. Here's the resume:

${rawResumeText}`;

      const result = await model.generateContent(prompt);
      if (!result.response) {
        throw new Error('Failed to get response from AI');
      }
      
      const classifiedResume = result.response.text();
      if (!classifiedResume) {
        throw new Error('Empty response from AI');
      }
      
      // Update user profile with both raw and classified resume text
      await onUpdate({ 
        resume: classifiedResume,
        rawResume: rawResumeText 
      });
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Resume processing error:', error);
      setResumeError(
        error instanceof Error 
          ? `Failed to process resume: ${error.message}` 
          : 'Failed to process resume. Please try again.'
      );
    } finally {
      setIsUploadingResume(false);
    }
  };

  const ClassifiedResume = ({ markdown }: { markdown: string }) => {
    return (
      <div className="mt-4 space-y-6">
        <ReactMarkdown
          components={{
            h2: ({ children }) => (
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white border-b pb-2 mb-4 dark:border-gray-700">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mt-4">
                {children}
              </h3>
            ),
            ul: ({ children }) => (
              <ul className="list-disc ml-4 space-y-1 text-gray-700 dark:text-gray-300 mb-4">
                {children}
              </ul>
            ),
            li: ({ children }) => (
              <li className="text-gray-700 dark:text-gray-300">
                {children}
              </li>
            ),
            p: ({ children }) => (
              <p className="text-gray-700 dark:text-gray-300 mb-2 whitespace-pre-line">
                {children}
              </p>
            ),
            code: ({ children }) => (
              <code className="px-1.5 py-0.5 text-sm bg-gray-100 dark:bg-gray-800 rounded text-gray-800 dark:text-gray-200">
                {children}
              </code>
            ),
          }}
        >
          {markdown}
        </ReactMarkdown>
      </div>
    );
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

            {/* Resume Section */}
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Resume</h3>
              
              <div className="space-y-4">
                {user.resume ? (
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-green-200 dark:border-green-900">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <CheckCircle className="h-6 w-6 text-green-500 dark:text-green-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-gray-400" />
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            Resume uploaded successfully
                          </p>
                        </div>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                          Your resume has been processed and classified
                        </p>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="mt-3 text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 flex items-center gap-1"
                        >
                          <Upload className="h-4 w-4" />
                          Upload a different version
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                      Upload your resume (PDF only)
                    </p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400"
                    >
                      Select file
                    </button>
                  </div>
                )}
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={handleResumeUpload}
                />
                
                {isUploadingResume && (
                  <div className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-500 border-t-transparent"></div>
                    Processing resume...
                  </div>
                )}
                
                {resumeError && (
                  <div className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                    <X className="h-4 w-4" />
                    {resumeError}
                  </div>
                )}
              </div>
            </div>

            {/* Resume Details Section */}
            {user.resume && (
              <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    Resume Details
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
                    <ClassifiedResume markdown={user.resume} />
                  </div>
                </div>
              </div>
            )}

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