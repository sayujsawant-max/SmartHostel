import { createContext } from 'react';
import type { Role } from '@smarthostel/shared';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: Role;
  gender?: string;
  academicYear?: string;
  hasConsented?: boolean;
  block?: string;
  floor?: string;
  roomNumber?: string;
}

export interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<UserProfile>;
  register: (name: string, email: string, password: string, gender: string, academicYear: string) => Promise<UserProfile>;
  googleLogin: (credential: string) => Promise<UserProfile>;
  logout: () => Promise<void>;
  setConsented: () => void;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);
