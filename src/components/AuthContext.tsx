import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
}

interface StoredUser {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  login: (email: string, password: string) => { ok: boolean; error?: string };
  signup: (username: string, email: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}

// simple hash - not cryptographically secure but fine for localStorage demo
function hashPassword(pw: string): string {
  let hash = 0;
  for (let i = 0; i < pw.length; i++) {
    const char = pw.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  // add salt-like prefix and convert
  const base = Math.abs(hash).toString(36);
  let h2 = 0;
  const salted = 'rb_' + pw + '_salt';
  for (let i = 0; i < salted.length; i++) {
    h2 = ((h2 << 5) - h2) + salted.charCodeAt(i);
    h2 |= 0;
  }
  return base + Math.abs(h2).toString(36);
}

function getStoredUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem('rb_users');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredUsers(users: StoredUser[]) {
  localStorage.setItem('rb_users', JSON.stringify(users));
}

function getSession(): User | null {
  try {
    const raw = localStorage.getItem('rb_session');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(user: User | null) {
  if (user) {
    localStorage.setItem('rb_session', JSON.stringify(user));
  } else {
    localStorage.removeItem('rb_session');
  }
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getSession());

  useEffect(() => {
    saveSession(user);
  }, [user]);

  const signup = useCallback((username: string, email: string, password: string): { ok: boolean; error?: string } => {
    const trimUser = username.trim();
    const trimEmail = email.trim().toLowerCase();

    if (!trimUser || trimUser.length < 2) return { ok: false, error: 'Username must be at least 2 characters' };
    if (!trimEmail || !trimEmail.includes('@')) return { ok: false, error: 'Enter a valid email' };
    if (password.length < 4) return { ok: false, error: 'Password must be at least 4 characters' };

    const users = getStoredUsers();
    if (users.find(u => u.email === trimEmail)) return { ok: false, error: 'An account with that email already exists' };
    if (users.find(u => u.username.toLowerCase() === trimUser.toLowerCase())) return { ok: false, error: 'That username is taken' };

    const newUser: StoredUser = {
      id: generateId(),
      username: trimUser,
      email: trimEmail,
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    saveStoredUsers(users);

    const sessionUser: User = { id: newUser.id, username: newUser.username, email: newUser.email, createdAt: newUser.createdAt };
    setUser(sessionUser);
    return { ok: true };
  }, []);

  const login = useCallback((email: string, password: string): { ok: boolean; error?: string } => {
    const trimEmail = email.trim().toLowerCase();
    if (!trimEmail) return { ok: false, error: 'Enter your email' };
    if (!password) return { ok: false, error: 'Enter your password' };

    const users = getStoredUsers();
    const found = users.find(u => u.email === trimEmail);
    if (!found) return { ok: false, error: 'No account found with that email' };
    if (found.passwordHash !== hashPassword(password)) return { ok: false, error: 'Wrong password' };

    const sessionUser: User = { id: found.id, username: found.username, email: found.email, createdAt: found.createdAt };
    setUser(sessionUser);
    return { ok: true };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
