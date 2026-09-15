/**
 * Hooks TanStack Query — source des données serveur (feuille de route, §4).
 * Convention des clés : [domaine, ...identifiants]. Stale time par nature de donnée :
 * catalogue 1 min (défaut du QueryClient), recherche 30 s, drop 30 s, compteurs 10 min.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { CheckoutResponse, DropDto, Episode, Guest, OrderStatusDto } from "@/types";

// ---------- types API sans équivalent domaine ----------

export interface SocialStats {
  listenersTotal: number;
  downloadsTotal: number;
  reviewsTotal: number;
  spotifyFollowers: number;
}

// ---------- épisodes ----------

export const episodesKey = ["episodes"] as const;
export const episodeKey = (slug: string) => ["episodes", slug] as const;
export const episodeSearchKey = (q: string) => ["episodes", "search", q] as const;

export function useEpisodes() {
  return useQuery({
    queryKey: episodesKey,
    queryFn: () => api.get<Episode[]>("/episodes"),
  });
}

export function useEpisode(slug: string) {
  return useQuery({
    queryKey: episodeKey(slug),
    queryFn: () => api.get<Episode>(`/episodes/${slug}`),
    enabled: !!slug,
    retry: false,
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
export const guestKey = (slug: string) => ["guests", slug] as const;

export function useGuests() {
  return useQuery({
    queryKey: guestsKey,
    queryFn: () => api.get<Guest[]>("/guests"),
  });
}

export function useGuest(slug: string) {
  return useQuery({
    queryKey: guestKey(slug),
    queryFn: () => api.get<Guest>(`/guests/${slug}`),
    enabled: !!slug,
    retry: false,
  });
}

// ---------- boutique / drop ----------

export const dropKey = ["shop", "drop"] as const;
export const orderStatusKey = (id: string) => ["shop", "orders", id, "status"] as const;

export function useDrop() {
  return useQuery({
    queryKey: dropKey,
    queryFn: () => api.get<DropDto>("/shop/drop"),
    staleTime: 30_000,
  });
}

export function useCheckout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: { productId: string; quantity: number }) =>
      api.post<CheckoutResponse>("/shop/checkout", req),
    onSettled: () => qc.invalidateQueries({ queryKey: dropKey }),
  });
}

/** Suivi d'une commande après retour de Stripe : interroge tant que le paiement est en attente. */
export function useOrderStatus(id: string | null) {
  return useQuery({
    queryKey: orderStatusKey(id ?? ""),
    queryFn: () => api.get<OrderStatusDto>(`/shop/orders/${id}/status`),
    enabled: !!id,
    retry: false,
    refetchInterval: (query) => (query.state.data?.status === "PENDING" ? 2_000 : false),
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
