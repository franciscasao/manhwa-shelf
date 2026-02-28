"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { pb } from "@/lib/db";
import type { RecordModel } from "pocketbase";

interface AuthState {
  user: RecordModel | null;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    passwordConfirm: string,
  ) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

function getInitialAuthState(): AuthState {
  if (pb.authStore.isValid && pb.authStore.record) {
    if (!pb.authStore.record.verified) {
      pb.authStore.clear();
      return { user: null, isLoading: false };
    }
    return { user: pb.authStore.record, isLoading: false };
  }
  pb.authStore.clear();
  return { user: null, isLoading: false };
}

export function useAuthProvider(): AuthContextValue {
  const [state, setState] = useState<AuthState>(getInitialAuthState);

  // Listen for auth changes (e.g. token expiry, other tabs)
  useEffect(() => {
    const unsubscribe = pb.authStore.onChange((_token, record) => {
      if (record && !record.verified) {
        pb.authStore.clear();
        setState({ user: null, isLoading: false });
        return;
      }
      setState({ user: record, isLoading: false });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await pb
      .collection("users")
      .authWithPassword(email, password);
    if (!result.record.verified) {
      pb.authStore.clear();
      throw new Error("Account not verified. Contact an administrator.");
    }
    setState({ user: result.record, isLoading: false });
  }, []);

  const register = useCallback(
    async (email: string, password: string, passwordConfirm: string) => {
      await pb
        .collection("users")
        .create({ email, password, passwordConfirm });
    },
    [],
  );

  const logout = useCallback(() => {
    pb.authStore.clear();
    setState({ user: null, isLoading: false });
  }, []);

  return useMemo(
    () => ({
      ...state,
      login,
      register,
      logout,
    }),
    [state, login, register, logout],
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
