import { createContext } from 'react';
import type { Role } from '@smarthostel/shared';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: Role;
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
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);
