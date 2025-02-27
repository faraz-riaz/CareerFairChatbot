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
import { Modal } from './components/Modal';
import { LoginForm } from './components/auth/LoginForm';
import { SignupForm } from './components/auth/SignupForm';
import { useAuth } from './contexts/AuthContext';
import { LoginCredentials, SignupData, User } from './types/auth';
import { ProfilePage } from './components/ProfilePage';
import { ThemeToggle } from './components/ThemeToggle';
import { AuthHeader } from './components/AuthHeader';
import { auth, chats as chatsApi, companies } from './lib/api';
import { careerFairContext } from './lib/eventContext';
import { classifyQuery, QueryType } from './lib/queryClassifier';
import { generateMongoQuery } from './lib/companyQueries';
import { getJobRecommendationsForChat } from './lib/jobRecommendations';

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
  const [newestMessageTimestamp, setNewestMessageTimestamp] = useState<number>(0);
  const [shownMessages, setShownMessages] = useState<Map<string, Set<number>>>(new Map());
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<Chat | null>(null);

  const currentChat = chats.find((chat) => chat._id === currentChatId);

  // Load user's chats
  useEffect(() => {
    if (user) {
      chatsApi.getAll()
        .then((loadedChats) => {
          setChats(loadedChats);
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
      const user = await auth.login(credentials);
      setUser(user);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to login');
    }
  };

  const handleSignup = async (data: SignupData) => {
    try {
      const user = await auth.signup(data);
      setUser(user);
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

  const handleCreateChat = async () => {
    if (!user) return;
    
    const title = newChatTitle.trim() || 'New Chat';
    const newChat = {
      title,
      messages: [],
      timestamp: Date.now(),
      userId: user._id,
    };

    try {
      const savedChat = await chatsApi.create(newChat);
      setChats((prev) => [savedChat, ...prev]);
      setCurrentChatId(savedChat._id);
      setIsNewChatModalOpen(false);
      setNewChatTitle('');
    } catch (error) {
      console.error('Failed to create chat:', error);
    }
  };

  const handleRenameChat = async () => {
    if (!chatToRename) return;
    
    try {
      const updatedChat = await chatsApi.update(chatToRename._id, {
        title: newChatTitle.trim() || chatToRename.title,
      });
      
      setChats((prev) =>
        prev.map((chat) => (chat._id === updatedChat._id ? updatedChat : chat))
      );
      setIsRenameModalOpen(false);
      setChatToRename(null);
      setNewChatTitle('');
    } catch (error) {
      console.error('Failed to rename chat:', error);
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      await chatsApi.delete(chatId);
      setChats((prev) => prev.filter((chat) => chat._id !== chatId));
      if (currentChatId === chatId) {
        setCurrentChatId(null);
      }
      setIsDeleteModalOpen(false);
      setChatToDelete(null);
    } catch (error) {
      console.error('Failed to delete chat:', error);
    }
  };

  // Helper function to check if a message has been shown in a specific chat
  const hasMessageBeenShown = (chatId: string, timestamp: number) => {
    const chatShownMessages = shownMessages.get(chatId);
    return chatShownMessages?.has(timestamp) ?? false;
  };

  // Helper function to mark a message as shown in a specific chat
  const markMessageAsShown = (chatId: string, timestamp: number) => {
    setShownMessages(prev => {
      const newMap = new Map(prev);
      const chatMessages = new Set(newMap.get(chatId) || []);
      chatMessages.add(timestamp);
      newMap.set(chatId, chatMessages);
      return newMap;
    });
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || !currentChatId) return;
    setError(null);
    setIsLoading(true);

    try {
      // Create and add user message
      const newMessage = {
        role: 'user' as const,
        content,
        timestamp: Date.now(),
      };

      // Update chat with user message
      let updatedChat;
      try {
        updatedChat = await chatsApi.update(currentChatId, {
          messages: [...currentChat!.messages, newMessage],
        });

        setChats((prev) =>
          prev.map((chat) =>
            chat._id === currentChatId ? updatedChat : chat
          )
        );
      } catch (error) {
        console.error('Failed to save user message:', error);
        setError('Failed to save your message. Please try again.');
        setIsLoading(false);
        return;
      }

      // Process the message based on query type
      try {
        // Classify the query first (not part of chat)
        const queryType = await classifyQuery(content);
        
        let additionalContext = '';
        
        if (queryType === QueryType.COMPANY_INFO) {
          try {
            // Generate MongoDB query
            const mongoQueryString = await generateMongoQuery(content);
            console.log('Generated Query:', mongoQueryString);
            
            // Use the API function instead of fetch
            const companyInfo = await companies.query(mongoQueryString);

            if (companyInfo.length === 0) {
              additionalContext = '\nNo matching companies found.';
            } else {
              additionalContext = `\nRelevant company information:\n${JSON.stringify(companyInfo, null, 2)}`;
            }
          } catch (error) {
            console.error('Company query error:', error);
            // Don't fail the entire message, just note the error
            additionalContext = '\nError retrieving company information.';
          }
        } else if (queryType === QueryType.JOB_RECOMMENDATION) {
          try {
            // Get job recommendations
            const jobRecommendations = await getJobRecommendationsForChat(content);
            
            // Create and add bot message with recommendations
            const botMessage = {
              role: 'bot' as const,
              content: jobRecommendations,
              timestamp: Date.now(),
            };

            setNewestMessageTimestamp(botMessage.timestamp);

            const finalChat = await chatsApi.update(currentChatId, {
              messages: [...updatedChat.messages, botMessage],
            });

            setChats((prev) =>
              prev.map((chat) =>
                chat._id === currentChatId ? finalChat : chat
              )
            );
            
            setInput('');
            setIsLoading(false);
            return; // Skip the normal flow
          } catch (error) {
            console.error('Job recommendation error:', error);
            // Create a fallback response instead of failing
            const errorBotMessage = {
              role: 'bot' as const,
              content: "I'm sorry, I encountered an error while retrieving job recommendations. Please make sure you've uploaded your resume in your profile, or try asking in a different way.",
              timestamp: Date.now(),
            };

            setNewestMessageTimestamp(errorBotMessage.timestamp);

            const errorChat = await chatsApi.update(currentChatId, {
              messages: [...updatedChat.messages, errorBotMessage],
            });

            setChats((prev) =>
              prev.map((chat) =>
                chat._id === currentChatId ? errorChat : chat
              )
            );
            
            setInput('');
            setIsLoading(false);
            return;
          }
        }

        // Generate response using the model with career fair context
        let botResponse;
        try {
          const model = await initializeGemini();
          
          const result = await model.generateContent([
            { text: careerFairContext.getSystemPrompt() + additionalContext },
            ...updatedChat.messages.map((msg: Message) => ({ text: msg.content })),
            { text: content }
          ]);
          
          botResponse = result.response.text();
        } catch (aiError) {
          console.error('AI model error:', aiError);
          // Provide a fallback response
          botResponse = "I'm sorry, I'm having trouble processing your request right now. Could you try asking in a different way?";
        }

        // Create bot message
        const botMessage = {
          role: 'bot' as const,
          content: botResponse,
          timestamp: Date.now(),
        };

        setNewestMessageTimestamp(botMessage.timestamp);

        // Update chat with bot response
        try {
          const finalChat = await chatsApi.update(currentChatId, {
            messages: [...updatedChat.messages, botMessage],
          });

          setChats((prev) =>
            prev.map((chat) =>
              chat._id === currentChatId ? finalChat : chat
            )
          );
        } catch (saveError) {
          console.error('Failed to save bot response:', saveError);
          // At least update the UI even if we couldn't save to the server
          setChats((prev) =>
            prev.map((chat) =>
              chat._id === currentChatId 
                ? { ...chat, messages: [...chat.messages, botMessage] } 
                : chat
            )
          );
          setError('Failed to save the conversation. The response is shown but may not persist if you refresh.');
        }
      } catch (processingError) {
        console.error('Message processing error:', processingError);
        
        // Create a fallback error message
        const errorMessage = {
          role: 'bot' as const,
          content: "I'm sorry, I encountered an error while processing your message. Please try again or ask a different question.",
          timestamp: Date.now(),
        };
        
        // Add the error message to the chat
        try {
          const errorChat = await chatsApi.update(currentChatId, {
            messages: [...updatedChat.messages, errorMessage],
          });

          setChats((prev) =>
            prev.map((chat) =>
              chat._id === currentChatId ? errorChat : chat
            )
          );
        } catch (saveError) {
          // Last resort - update UI only
          setChats((prev) =>
            prev.map((chat) =>
              chat._id === currentChatId 
                ? { ...chat, messages: [...chat.messages, errorMessage] } 
                : chat
            )
          );
        }
      }
    } catch (error) {
      console.error('Unexpected error in chat flow:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setInput('');
      setIsLoading(false);
    }
  };

  const handleProfileUpdate = async (updates: Partial<User>) => {
    if (!user) return;
    try {
      const updatedUser = await auth.updateUser(user._id, updates);
      setUser(updatedUser);
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  };

  const handlePasswordChange = async (oldPassword: string, newPassword: string) => {
    if (!user) return;
    
    try {
      await auth.changePassword(user._id, oldPassword, newPassword);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to change password');
    }
  };

  const handleAccountDelete = async () => {
    if (!user || !confirm('Are you sure you want to delete your account?')) return;
    try {
      await auth.deleteUser(user._id);
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
              key={chat._id}
              onClick={() => {
                setCurrentChatId(chat._id);
                setIsProfileOpen(false);
              }}
              className={`w-full text-left p-2 rounded-lg mb-1 group flex justify-between items-center ${
                chat._id === currentChatId
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
                    setChatToDelete(chat);
                    setIsDeleteModalOpen(true);
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
                    <ChatMessage 
                      key={message.timestamp} 
                      message={message} 
                      isNew={
                        message.timestamp === newestMessageTimestamp && 
                        !hasMessageBeenShown(currentChat._id, message.timestamp) &&
                        message.role === 'bot'
                      }
                    />
                  ))}
                  {isLoading && (
                    <div className="p-6 text-gray-500">Generating response...</div>
                  )}
                  {error && (
                    <div className="max-w-3xl mx-auto p-4 mb-4">
                      <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-lg flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium">Error</p>
                          <p className="text-sm mt-1">{error}</p>
                          <button
                            onClick={() => setError(null)}
                            className="mt-2 text-sm bg-red-100 dark:bg-red-900/50 px-3 py-1 rounded-md hover:bg-red-200 dark:hover:bg-red-900/70 transition-colors"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-24 h-24 bg-purple-500 rounded-full flex items-center justify-center mb-6">
                  <MessageSquarePlus className="h-12 w-12 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  Welcome to Career Fair Chat
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
                  Start a conversation with our AI assistant to get help with your career questions.
                </p>
                <button
                  onClick={createNewChat}
                  className="flex items-center gap-2 px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                >
                  <MessageSquarePlus className="h-5 w-5" />
                  Start a New Chat
                </button>
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

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setChatToDelete(null);
        }}
        title="Delete Chat"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            Are you sure you want to delete this chat? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setIsDeleteModalOpen(false);
                setChatToDelete(null);
              }}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => chatToDelete && handleDeleteChat(chatToDelete._id)}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default App;