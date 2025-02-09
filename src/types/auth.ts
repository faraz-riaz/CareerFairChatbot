export interface User {
  id: string;
  name: string;
  email: string;
  age: number;
  jobTitle: string;
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