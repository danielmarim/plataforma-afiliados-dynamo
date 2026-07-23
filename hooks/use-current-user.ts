"use client";

import { useSession } from "next-auth/react";

/**
 * Hook client-side para acessar o usuário autenticado.
 */
export function useCurrentUser() {
  const { data: session, status } = useSession();

  return {
    user: session?.user ?? null,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
  };
}
