import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquarePlus,
  Send,
  AlertTriangle,
  MoreVertical,
  Trash2,
  Edit2,
  LogOut,
} from 'lucide-react';
import { initializeGemini } from './lib/gemini';
import { Chat, Message } from './types';
import { ChatMessage } from './components/ChatMessage';
import { loadChats, saveChat, deleteChat, createUser, authenticateUser, updateUser, verifyPassword, deleteUserAndChats } from './lib/storage';
import { Modal } from './components/Modal';
import { LoginForm } from './components/auth/LoginForm';
import { SignupForm } from './components/auth/SignupForm';
import { useAuth } from './contexts/AuthContext';
import { LoginCredentials, SignupData } from './types/auth';
import { ProfilePage } from './components/ProfilePage';
import { ThemeToggle } from './components/ThemeToggle';
import { AuthHeader } from './components/AuthHeader';

function App() {
  // Auth states
  const { user, setUser, isLoading: isAuthLoading } = useAuth();
  const [isLoginView, setIsLoginView] = useState(true);

  // Chat states
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [chatToRename, setChatToRename] = useState<Chat | null>(null);
  const [newChatTitle, setNewChatTitle] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const currentChat = chats.find((chat) => chat.id === currentChatId);

  // Load user's chats
  useEffect(() => {
    if (user) {
      loadChats()
        .then((loadedChats) => {
          // Only show chats belonging to the current user
          setChats(loadedChats.filter((chat) => chat.userId === user.id));
        })
        .catch(console.error);
    } else {
      setChats([]);
      setCurrentChatId(null);
    }
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentChat?.messages]);

  const handleLogin = async (credentials: LoginCredentials) => {
    try {
      const authenticatedUser = await authenticateUser(credentials);
      setUser(authenticatedUser);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to login');
    }
  };

  const handleSignup = async (data: SignupData) => {
    try {
      const newUser = await createUser({
        name: data.name,
        email: data.email,
        password: data.password, // In a real app, this would be hashed
        age: data.age,
        jobTitle: data.jobTitle,
      });
      
      // Remove password from user object before setting in state
      const { password, ...userWithoutPassword } = newUser;
      setUser(userWithoutPassword);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to sign up');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setChats([]);
    setCurrentChatId(null);
  };

  const createNewChat = () => {
    setNewChatTitle('');
    setIsNewChatModalOpen(true);
  };

  const handleCreateChat = () => {
    if (!user) return;
    
    const title = newChatTitle.trim() || 'New Chat';
    const newChat: Chat = {
      id: crypto.randomUUID(),
      title,
      messages: [],
      timestamp: Date.now(),
      userId: user.id,
    };
    setChats((prev) => [newChat, ...prev]);
    saveChat(newChat).catch(console.error);
    setCurrentChatId(newChat.id);
    setIsNewChatModalOpen(false);
    setNewChatTitle('');
  };

  const handleRenameChat = () => {
    if (!chatToRename) return;
    
    const updatedChat = {
      ...chatToRename,
      title: newChatTitle.trim() || chatToRename.title,
    };
    
    setChats((prev) =>
      prev.map((chat) => (chat.id === updatedChat.id ? updatedChat : chat))
    );
    saveChat(updatedChat).catch(console.error);
    setIsRenameModalOpen(false);
    setChatToRename(null);
    setNewChatTitle('');
  };

  const handleDeleteChat = async (chatId: string) => {
    if (!confirm('Are you sure you want to delete this chat?')) return;
    
    setChats((prev) => prev.filter((chat) => chat.id !== chatId));
    if (currentChatId === chatId) {
      setCurrentChatId(null);
    }
    
    try {
      await deleteChat(chatId);
    } catch (error) {
      console.error('Failed to delete chat:', error);
      // Optionally show an error message to the user
    }
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || !currentChatId) return;
    setError(null);

    const newMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    const updatedChat = {
      ...currentChat!,
      messages: [...currentChat!.messages, newMessage],
    };

    setChats((prev) =>
      prev.map((chat) =>
        chat.id === currentChatId ? updatedChat : chat
      )
    );
    await saveChat(updatedChat);

    setIsLoading(true);
    try {
      const model = await initializeGemini();
      const chat = model.startChat({
        history: updatedChat.messages.map((msg) => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: msg.content,
        })),
      });
      
      const result = await chat.sendMessage(content);
      const response = result.response;
      
      const botMessage: Message = {
        id: crypto.randomUUID(),
        role: 'bot',
        content: response.text(),
        timestamp: Date.now(),
      };

      const finalChat = {
        ...updatedChat,
        messages: [...updatedChat.messages, botMessage],
      };

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === currentChatId ? finalChat : chat
        )
      );
      await saveChat(finalChat);
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while processing your message');
    } finally {
      setIsLoading(false);
    }
    setInput('');
  };

  const handleProfileUpdate = async (updates: Partial<User>) => {
    if (!user) return;
    const updatedUser = await updateUser(user.id, updates);
    setUser(updatedUser);
  };

  const handlePasswordChange = async (oldPassword: string, newPassword: string) => {
    if (!user) return;
    
    try {
      const isValid = await verifyPassword(user.id, oldPassword);
      if (!isValid) {
        throw new Error('Current password is incorrect');
      }
      await updateUser(user.id, { password: newPassword });
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to change password');
    }
  };

  const handleAccountDelete = async () => {
    if (!user || !confirm('Are you sure you want to delete your account?')) return;
    try {
      await deleteUserAndChats(user.id);
      setUser(null);
      setChats([]);
      setCurrentChatId(null);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete account');
    }
  };

  if (isAuthLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
        <AuthHeader />
        <div className="flex-1 flex items-center justify-center p-4">
          {isLoginView ? (
            <LoginForm
              onSubmit={handleLogin}
              onSwitchToSignup={() => setIsLoginView(false)}
            />
          ) : (
            <SignupForm
              onSubmit={handleSignup}
              onSwitchToLogin={() => setIsLoginView(true)}
            />
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="max-w-md p-6 bg-white rounded-lg shadow-lg">
          <div className="flex items-center gap-2 text-red-500 mb-4">
            <AlertTriangle className="h-6 w-6" />
            <h2 className="text-lg font-semibold">Error</h2>
          </div>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-4 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 dark:bg-gray-950 p-4 flex flex-col">
        <button
          onClick={createNewChat}
          className="flex items-center gap-2 text-white bg-purple-500 p-2 rounded-lg hover:bg-purple-600 mb-4"
        >
          <MessageSquarePlus className="h-5 w-5" />
          New Chat
        </button>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => setCurrentChatId(chat.id)}
              className={`w-full text-left p-2 rounded-lg mb-1 group flex justify-between items-center ${
                chat.id === currentChatId
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <span className="truncate">{chat.title}</span>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setChatToRename(chat);
                    setNewChatTitle(chat.title);
                    setIsRenameModalOpen(true);
                  }}
                  className="p-1 hover:bg-gray-600 rounded"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteChat(chat.id);
                  }}
                  className="p-1 hover:bg-gray-600 rounded"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </button>
          ))}
        </div>

        {/* User Profile Section */}
        <div className="mt-auto pt-4 border-t border-gray-700">
          <div className="flex items-center justify-between text-gray-300 p-2">
            <button
              onClick={() => setIsProfileOpen(true)}
              className="flex-1 text-left truncate hover:bg-gray-700 px-2 py-1 rounded transition-colors"
            >
              <div className="font-medium">{user.name}</div>
            </button>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                onClick={handleLogout}
                className="p-1 hover:bg-gray-700 rounded transition-colors"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Area */}
      {isProfileOpen ? (
        <ProfilePage
          user={user}
          onBack={() => setIsProfileOpen(false)}
          onUpdate={handleProfileUpdate}
          onChangePassword={handlePasswordChange}
          onDelete={handleAccountDelete}
        />
      ) : (
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
          <div className="flex-1 overflow-y-auto">
            {currentChat ? (
              <>
                <div className="max-w-3xl mx-auto w-full">
                  {currentChat.messages.map((message) => (
                    <ChatMessage key={message.id} message={message} />
                  ))}
                  {isLoading && (
                    <div className="p-6 text-gray-500">Generating response...</div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                Select a chat or create a new one to get started
              </div>
            )}
          </div>

          {/* Input Area */}
          {currentChat && (
            <div className="border-t bg-white dark:bg-gray-800 dark:border-gray-700 p-4">
              <div className="max-w-3xl mx-auto">
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage(input);
                      }
                    }}
                    placeholder="Type your message..."
                    className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    disabled={isLoading}
                  />
                  <button
                    onClick={() => sendMessage(input)}
                    disabled={isLoading || !input.trim()}
                    className="p-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={isNewChatModalOpen}
        onClose={() => setIsNewChatModalOpen(false)}
        title="New Chat"
      >
        <div className="space-y-4">
          <input
            type="text"
            value={newChatTitle}
            onChange={(e) => setNewChatTitle(e.target.value)}
            placeholder="Enter chat name"
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsNewChatModalOpen(false)}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateChat}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              Create
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isRenameModalOpen}
        onClose={() => {
          setIsRenameModalOpen(false);
          setChatToRename(null);
        }}
        title="Rename Chat"
      >
        <div className="space-y-4">
          <input
            type="text"
            value={newChatTitle}
            onChange={(e) => setNewChatTitle(e.target.value)}
            placeholder="Enter new name"
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setIsRenameModalOpen(false);
                setChatToRename(null);
              }}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleRenameChat}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              Rename
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default App;