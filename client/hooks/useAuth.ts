"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { userApi } from "@/api/user";
import { User } from "@/types/api";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      try {
        const responseData = await userApi.getMe().then(r => 'data' in r ? r.data : null).catch(() => null);
        if (mounted && responseData) {
          setUser(responseData as User);
          setIsLoading(false);
        } else if (mounted) {
           setUser(null);
           setIsLoading(false);
        }
      } catch {
        if (mounted) {
          setUser(null);
          setIsLoading(false);
        }
      }
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

  return { user, isLoading, requireAuth };
}
