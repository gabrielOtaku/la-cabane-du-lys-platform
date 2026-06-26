/**
 * Hooks TanStack Query — connexion au backend Spring Boot.
 * Remplace les imports statiques depuis src/data/*.ts
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Episode, Guest, Product, DropInfo } from "@/types";

// ---------- types API (miroir des records backend) ----------

export interface DropDto {
  opensAt: string;
  open: boolean;
  products: Product[];
}

export interface SocialStats {
  listenersTotal: number;
  downloadsTotal: number;
  reviewsTotal: number;
  spotifyFollowers: number;
}

export interface CheckoutResponse {
  checkoutUrl: string;
  reference: string;
}

// ---------- épisodes ----------

export const episodesKey = ["episodes"] as const;
export const episodeKey = (id: string) => ["episodes", id] as const;
export const episodeSearchKey = (q: string) => ["episodes", "search", q] as const;

export function useEpisodes() {
  return useQuery({
    queryKey: episodesKey,
    queryFn: () => api.get<Episode[]>("/episodes"),
  });
}

export function useEpisode(id: string) {
  return useQuery({
    queryKey: episodeKey(id),
    queryFn: () => api.get<Episode>(`/episodes/${id}`),
    enabled: !!id,
  });
}

export function useEpisodeSearch(q: string) {
  return useQuery({
    queryKey: episodeSearchKey(q),
    queryFn: () => api.get<Episode[]>(`/episodes/search?q=${encodeURIComponent(q)}`),
    enabled: q.trim().length >= 2,
    staleTime: 30_000,
  });
}

// ---------- invités ----------

export const guestsKey = ["guests"] as const;

export function useGuests() {
  return useQuery({
    queryKey: guestsKey,
    queryFn: () => api.get<Guest[]>("/guests"),
  });
}

// ---------- boutique / drop ----------

export const dropKey = ["shop", "drop"] as const;

export function useDrop() {
  return useQuery({
    queryKey: dropKey,
    queryFn: () => api.get<DropDto>("/shop/drop"),
    staleTime: 5 * 60_000,
  });
}

export function useCheckout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: { productId: string; quantity: number }) =>
      api.post<CheckoutResponse>("/shop/checkout", req),
    onSuccess: () => qc.invalidateQueries({ queryKey: dropKey }),
  });
}

// ---------- compteurs sociaux ----------

export const socialStatsKey = ["stats", "social"] as const;

export function useSocialStats() {
  return useQuery({
    queryKey: socialStatsKey,
    queryFn: () => api.get<SocialStats>("/stats/social"),
    staleTime: 10 * 60_000,
  });
}
