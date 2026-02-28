"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { userApi } from "@/services/user";
import { User } from "@/types/api";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  requireAuth: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  requireAuth: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      const result = await userApi.getMe();
      if (!mounted) return;

      if (result.success) {
        setUser(result.data as User);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    }

    checkAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const requireAuth = () => {
    if (!isLoading && !user) {
      router.push("/");
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, requireAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuthContext = () => useContext(AuthContext);
