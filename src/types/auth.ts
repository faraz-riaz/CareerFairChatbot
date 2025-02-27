export interface User {
  _id: string;
  name: string;
  email: string;
  age: number;
  jobTitle: string;
  resume?: string;
  rawResume?: string;
  password?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
  age: number;
  jobTitle: string;
} 