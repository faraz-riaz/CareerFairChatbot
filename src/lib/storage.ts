import { Chat } from '../types';
import { User, LoginCredentials } from '../types/auth';

const DB_NAME = 'career-fair-chat';
const CHATS_STORE = 'chats';
const USERS_STORE = 'users';
const DB_VERSION = 1;

async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create chats store
      if (!db.objectStoreNames.contains(CHATS_STORE)) {
        db.createObjectStore(CHATS_STORE, { keyPath: 'id' });
      }
      
      // Create users store with email index
      if (!db.objectStoreNames.contains(USERS_STORE)) {
        const userStore = db.createObjectStore(USERS_STORE, { keyPath: 'id' });
        userStore.createIndex('email', 'email', { unique: true });
      }
    };
  });
}

// User-related functions
export async function createUser(userData: Omit<User, 'id'>): Promise<User> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(USERS_STORE, 'readwrite');
    const store = transaction.objectStore(USERS_STORE);
    
    // Check if email already exists
    const emailIndex = store.index('email');
    const emailCheck = emailIndex.get(userData.email);
    
    emailCheck.onsuccess = () => {
      if (emailCheck.result) {
        reject(new Error('Email already exists'));
        return;
      }
      
      // Create new user
      const newUser: User = {
        ...userData,
        id: crypto.randomUUID(),
      };
      
      const request = store.add(newUser);
      request.onsuccess = () => resolve(newUser);
      request.onerror = () => reject(request.error);
    };

    transaction.oncomplete = () => db.close();
  });
}

export async function authenticateUser(credentials: LoginCredentials): Promise<User> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(USERS_STORE, 'readonly');
    const store = transaction.objectStore(USERS_STORE);
    const emailIndex = store.index('email');
    
    const request = emailIndex.get(credentials.email);
    
    request.onsuccess = () => {
      const user = request.result;
      if (!user) {
        reject(new Error('User not found'));
        return;
      }
      
      // In a real app, you would hash the password and compare it securely
      // This is just for demonstration
      if (user.password !== credentials.password) {
        reject(new Error('Invalid password'));
        return;
      }
      
      // Don't send password back to client
      const { password, ...userWithoutPassword } = user;
      resolve(userWithoutPassword as User);
    };
    
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
  });
}

export async function updateUser(userId: string, updates: Partial<User>): Promise<User> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(USERS_STORE, 'readwrite');
    const store = transaction.objectStore(USERS_STORE);
    
    // First get the existing user
    const getRequest = store.get(userId);
    
    getRequest.onsuccess = () => {
      const existingUser = getRequest.result;
      if (!existingUser) {
        reject(new Error('User not found'));
        return;
      }
      
      const updatedUser = {
        ...existingUser,
        ...updates,
      };
      
      const putRequest = store.put(updatedUser);
      putRequest.onsuccess = () => {
        const { password, ...userWithoutPassword } = updatedUser;
        resolve(userWithoutPassword as User);
      };
      putRequest.onerror = () => reject(putRequest.error);
    };
    
    getRequest.onerror = () => reject(getRequest.error);
    transaction.oncomplete = () => db.close();
  });
}

// Update the existing chat functions to work with the new store name
export async function saveChat(chat: Chat): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CHATS_STORE, 'readwrite');
    const store = transaction.objectStore(CHATS_STORE);
    const request = store.put(chat);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();

    transaction.oncomplete = () => db.close();
  });
}

export async function loadChats(): Promise<Chat[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CHATS_STORE, 'readonly');
    const store = transaction.objectStore(CHATS_STORE);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const chats = request.result as Chat[];
      resolve(chats.sort((a, b) => b.timestamp - a.timestamp));
    };

    transaction.oncomplete = () => db.close();
  });
}

export async function deleteChat(chatId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CHATS_STORE, 'readwrite');
    const store = transaction.objectStore(CHATS_STORE);
    const request = store.delete(chatId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();

    transaction.oncomplete = () => db.close();
  });
}