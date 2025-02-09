import React, { useState, useRef, useEffect } from 'react';
import { MessageSquarePlus, Send, AlertTriangle, MoreVertical, Trash2, Edit2 } from 'lucide-react';
import { initializeGemini } from './lib/gemini';
import { Chat, Message } from './types';
import { ChatMessage } from './components/ChatMessage';
import { loadChats, saveChat, deleteChat } from './lib/storage';
import { Modal } from './components/Modal';

function App() {
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

  const currentChat = chats.find((chat) => chat.id === currentChatId);

  useEffect(() => {
    loadChats().then(setChats).catch(console.error);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentChat?.messages]);

  const createNewChat = () => {
    setNewChatTitle('');
    setIsNewChatModalOpen(true);
  };

  const handleCreateChat = () => {
    const title = newChatTitle.trim() || 'New Chat';
    const newChat: Chat = {
      id: crypto.randomUUID(),
      title,
      messages: [],
      timestamp: Date.now(),
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
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 p-4 flex flex-col">
        <button
          onClick={createNewChat}
          className="flex items-center gap-2 w-full px-4 py-2 text-white bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
        >
          <MessageSquarePlus className="h-5 w-5" />
          New Chat
        </button>
        <div className="mt-4 flex-1 overflow-y-auto">
          {chats.map((chat) => (
            <div key={chat.id} className="relative group">
              <button
                onClick={() => setCurrentChatId(chat.id)}
                className={`w-full px-4 py-2 text-left text-sm rounded-lg mb-1 flex items-center justify-between ${
                  chat.id === currentChatId
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <span className="truncate flex-1">{chat.title}</span>
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
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
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
          <div className="border-t bg-white p-4">
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
                  className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsNewChatModalOpen(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateChat}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
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
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setIsRenameModalOpen(false);
                setChatToRename(null);
              }}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleRenameChat}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
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