export interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: number;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  timestamp: number;
}