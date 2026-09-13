"use client";
/**
 * Session côté client (phase 1). La source de vérité est GET /auth/me, servie par le cookie
 * HttpOnly : le JavaScript ne voit jamais le secret de session.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, isApiError } from "@/lib/api";
import type { Session } from "@/types";

export const sessionKey = ["auth", "session"] as const;

export function useSession() {
  return useQuery({
    queryKey: sessionKey,
    queryFn: async (): Promise<Session | null> => {
      try {
        return await api.get<Session>("/auth/me");
      } catch (e) {
        if (isApiError(e) && (e.status === 401 || e.status === 403)) return null;
        throw e;
      }
    },
    staleTime: 5 * 60_000,
    retry: false,
  });
}

export function useRequestMagicLink() {
  return useMutation({
    mutationFn: (email: string) => api.post<{ message: string }>("/auth/magic-link", { email }),
  });
}

export function useVerifyMagicLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => api.post<Session>("/auth/magic-link/verify", { token }),
    onSuccess: (session) => qc.setQueryData(sessionKey, session),
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<void>("/auth/logout"),
    onSettled: () => {
      qc.setQueryData(sessionKey, null);
      void qc.invalidateQueries({ queryKey: sessionKey });
    },
  });
}
