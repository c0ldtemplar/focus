import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { isFirebaseConfigured, DUMMY_USERS } from '../lib/firebaseConfig';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    if (!isFirebaseConfigured) {
      try {
        const saved = localStorage.getItem('focus-demo-user');
        return saved ? JSON.parse(saved) : null;
      } catch {
        localStorage.removeItem('focus-demo-user');
        return null;
      }
    }
    return null;
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      // No-op, keep loading as false would cause effect setState
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      setUser(fbUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // If Firebase not configured, loading is false after initial state
  const [hasChecked, setHasChecked] = useState(false);
  useEffect(() => {
    if (!isFirebaseConfigured) {
      const t = setTimeout(() => setHasChecked(true), 0);
      return () => clearTimeout(t);
    }
  }, []);

  const effectiveLoading = isFirebaseConfigured ? loading : !hasChecked;

  const signIn = useCallback(async (email: string, password: string) => {
    if (!isFirebaseConfigured) {
      await new Promise(resolve => setTimeout(resolve, 600));
      const foundUser = DUMMY_USERS.find(
        u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );
      if (!foundUser) {
        const userExists = DUMMY_USERS.some(u => u.email.toLowerCase() === email.toLowerCase());
        throw new Error(userExists ? 'Contraseña incorrecta' : 'Usuario no encontrado');
      }
      const userData = { id: foundUser.id, email: foundUser.email, name: foundUser.name, providerId: 'demo' } as unknown as User;
      localStorage.setItem('focus-demo-user', JSON.stringify(userData));
      setUser(userData);
      return;
    }
    await signInWithEmailAndPassword(auth!, email, password);
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    if (!isFirebaseConfigured) {
      await new Promise(resolve => setTimeout(resolve, 600));
      if (password.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres');
      if (DUMMY_USERS.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        throw new Error('El usuario ya existe. Por favor, inicia sesión.');
      }
      throw new Error('Registro temporalmente desactivado. Usa credenciales de prueba.');
    }
    await createUserWithEmailAndPassword(auth!, email, password);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!isFirebaseConfigured) {
      await new Promise(resolve => setTimeout(resolve, 600));
      const userData = { id: 'google-1', email: 'google.user@focus.local', name: 'Usuario Google', providerId: 'google.demo' } as unknown as User;
      localStorage.setItem('focus-demo-user', JSON.stringify(userData));
      setUser(userData);
      return;
    }
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth!, provider);
  }, []);

  const logout = useCallback(async () => {
    if (!isFirebaseConfigured) {
      await new Promise(resolve => setTimeout(resolve, 300));
      localStorage.removeItem('focus-demo-user');
      setUser(null);
      return;
    }
    await signOut(auth!);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    if (!isFirebaseConfigured) {
      await new Promise(resolve => setTimeout(resolve, 600));
      if (!DUMMY_USERS.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        throw new Error('No existe una cuenta con ese correo');
      }
      throw new Error('Entorno de desarrollo: usa test@focus.local / test123');
    }
    await sendPasswordResetEmail(auth!, email);
  }, []);

  const value = { user, loading: effectiveLoading, signIn, signUp, signInWithGoogle, logout, resetPassword };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};