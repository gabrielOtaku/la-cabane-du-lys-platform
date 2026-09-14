"use client";
/**
 * Hooks du back office (phase 7). Toutes les routes exigent le rôle ADMIN côté serveur ;
 * le garde côté client (AdminShell) n'est qu'un confort d'affichage.
 * Convention des clés : ["admin", ressource, ...identifiants].
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { episodesKey, guestsKey, dropKey } from "@/lib/queries";
import type {
  AdminDrop, AdminEpisode, AdminGuest, AdminOrder, AdminOverview, AdminProduct, AuditEvent,
  DropLifecycle, DropUpsert, EpisodeUpsert, GuestUpsert, ProductUpsert,
} from "@/types/admin";

const k = {
  overview: ["admin", "overview"] as const,
  episodes: ["admin", "episodes"] as const,
  episode: (id: string) => ["admin", "episodes", id] as const,
  guests: ["admin", "guests"] as const,
  guest: (id: string) => ["admin", "guests", id] as const,
  drops: ["admin", "drops"] as const,
  drop: (id: string) => ["admin", "drops", id] as const,
  products: ["admin", "products"] as const,
  orders: ["admin", "orders"] as const,
  audit: ["admin", "audit"] as const,
};

function useInvalidate() {
  const qc = useQueryClient();
  return (...keys: readonly (readonly string[])[]) => {
    keys.forEach((key) => void qc.invalidateQueries({ queryKey: key }));
    void qc.invalidateQueries({ queryKey: k.audit });
    void qc.invalidateQueries({ queryKey: k.overview });
  };
}

// ---------- vue d'ensemble, journal ----------

export const useAdminOverview = () =>
  useQuery({ queryKey: k.overview, queryFn: () => api.get<AdminOverview>("/admin/overview"), staleTime: 30_000 });

export const useAuditLog = (size = 50) =>
  useQuery({ queryKey: [...k.audit, size], queryFn: () => api.get<AuditEvent[]>(`/admin/audit?size=${size}`), staleTime: 15_000 });

// ---------- épisodes ----------

export const useAdminEpisodes = () =>
  useQuery({ queryKey: k.episodes, queryFn: () => api.get<AdminEpisode[]>("/admin/episodes"), staleTime: 15_000 });

export const useAdminEpisode = (id: string | null) =>
  useQuery({ queryKey: k.episode(id ?? ""), queryFn: () => api.get<AdminEpisode>(`/admin/episodes/${id}`), enabled: !!id, retry: false });

export function useSaveEpisode() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, data }: { id: string | null; data: EpisodeUpsert }) =>
      id ? api.put<AdminEpisode>(`/admin/episodes/${id}`, data) : api.post<AdminEpisode>("/admin/episodes", data),
    onSuccess: (ep) => invalidate(k.episodes, k.episode(ep.id), episodesKey),
  });
}

export function useEpisodeStatus() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: "publish" | "unpublish" }) =>
      api.post<AdminEpisode>(`/admin/episodes/${id}/${action}`),
    onSuccess: (ep) => invalidate(k.episodes, k.episode(ep.id), episodesKey),
  });
}

export function useDeleteEpisode() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => api.del<void>(`/admin/episodes/${id}`),
    onSuccess: () => invalidate(k.episodes, episodesKey),
  });
}

// ---------- invités ----------

export const useAdminGuests = () =>
  useQuery({ queryKey: k.guests, queryFn: () => api.get<AdminGuest[]>("/admin/guests"), staleTime: 15_000 });

export const useAdminGuest = (id: string | null) =>
  useQuery({ queryKey: k.guest(id ?? ""), queryFn: () => api.get<AdminGuest>(`/admin/guests/${id}`), enabled: !!id, retry: false });

export function useSaveGuest() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, data }: { id: string | null; data: GuestUpsert }) =>
      id ? api.put<AdminGuest>(`/admin/guests/${id}`, data) : api.post<AdminGuest>("/admin/guests", data),
    onSuccess: (g) => invalidate(k.guests, k.guest(g.id), guestsKey, k.episodes, episodesKey),
  });
}

export function useDeleteGuest() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => api.del<void>(`/admin/guests/${id}`),
    onSuccess: () => invalidate(k.guests, guestsKey),
  });
}

// ---------- drops ----------

export const useAdminDrops = () =>
  useQuery({ queryKey: k.drops, queryFn: () => api.get<AdminDrop[]>("/admin/drops"), staleTime: 15_000 });

export const useAdminDrop = (id: string | null) =>
  useQuery({ queryKey: k.drop(id ?? ""), queryFn: () => api.get<AdminDrop>(`/admin/drops/${id}`), enabled: !!id, retry: false });

export function useSaveDrop() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, data }: { id: string | null; data: DropUpsert }) =>
      id ? api.put<AdminDrop>(`/admin/drops/${id}`, data) : api.post<AdminDrop>("/admin/drops", data),
    onSuccess: (d) => invalidate(k.drops, k.drop(d.id), dropKey, k.products),
  });
}

export function useDropLifecycle() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, lifecycle }: { id: string; lifecycle: DropLifecycle }) =>
      api.put<AdminDrop>(`/admin/drops/${id}/lifecycle`, { lifecycle }),
    onSuccess: (d) => invalidate(k.drops, k.drop(d.id), dropKey),
  });
}

export function useDeleteDrop() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => api.del<void>(`/admin/drops/${id}`),
    onSuccess: () => invalidate(k.drops, dropKey),
  });
}

// ---------- pièces ----------

export const useAdminProducts = () =>
  useQuery({ queryKey: k.products, queryFn: () => api.get<AdminProduct[]>("/admin/products"), staleTime: 15_000 });

export function useSaveProduct() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, data }: { id: string | null; data: ProductUpsert }) =>
      id ? api.put<AdminProduct>(`/admin/products/${id}`, data) : api.post<AdminProduct>("/admin/products", data),
    onSuccess: () => invalidate(k.products, k.drops, dropKey),
  });
}

export function useDeleteProduct() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => api.del<void>(`/admin/products/${id}`),
    onSuccess: () => invalidate(k.products, k.drops, dropKey),
  });
}

// ---------- commandes ----------

export const useAdminOrders = () =>
  useQuery({ queryKey: k.orders, queryFn: () => api.get<AdminOrder[]>("/admin/orders"), staleTime: 10_000 });

export function useFulfillOrder() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => api.post<AdminOrder>(`/admin/orders/${id}/fulfill`),
    onSuccess: () => invalidate(k.orders),
  });
}
