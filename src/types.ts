export interface Message {
  role: 'user' | 'bot';
  content: string;
  timestamp: number;
}

export interface Chat {
  _id: string;
  title: string;
  messages: Message[];
  timestamp: number;
  userId: string;
}