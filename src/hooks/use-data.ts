import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  type InsertUser,
  type User,
  type Station,
  type Check,
  type Message,
  type StatsResponse,
  type OperatorStats,
  type CreateCheck,
  type CreateStation,
  type CreateMessage,
  api,
  getAuthHeaders,
} from "@/types";
import { useToast } from "@/hooks/use-toast";

async function authFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...options?.headers,
    },
  });
  return res;
}

export function useUsers(role?: "moderator" | "operator" | "customer") {
  return useQuery<User[]>({
    queryKey: [api.users.list.path, role],
    queryFn: async () => {
      const url = role ? `${api.users.list.path}?role=${role}` : api.users.list.path;
      const res = await authFetch(url);
      if (!res.ok) throw new Error("Foydalanuvchilarni yuklashda xatolik");
      return res.json();
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertUser) => {
      const res = await authFetch(api.users.create.path, {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: "Foydalanuvchi yaratishda xatolik" }));
        throw new Error(error.message || "Foydalanuvchi yaratishda xatolik");
      }
      return res.json() as Promise<User>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.users.list.path] });
      toast({ title: "Muvaffaqiyat", description: "Foydalanuvchi yaratildi" });
    },
    onError: (error: Error) => {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertUser> }) => {
      const res = await authFetch(`${api.users.list.path}/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: "Foydalanuvchi yangilashda xatolik" }));
        throw new Error(error.message || "Foydalanuvchi yangilashda xatolik");
      }
      return res.json() as Promise<User>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.users.list.path] });
      toast({ title: "Muvaffaqiyat", description: "Foydalanuvchi yangilandi" });
    },
    onError: (error: Error) => {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await authFetch(`${api.users.list.path}/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: "Foydalanuvchi o'chirishda xatolik" }));
        throw new Error(error.message || "Foydalanuvchi o'chirishda xatolik");
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.users.list.path] });
      toast({ title: "Muvaffaqiyat", description: "Foydalanuvchi o'chirildi" });
    },
    onError: (error: Error) => {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    },
  });
}

export function useStationCustomers(stationId: number) {
  return useQuery<User[]>({
    queryKey: ["/api/users/station", stationId, "customers"],
    queryFn: async () => {
      const res = await authFetch(`/api/users/station/${stationId}/customers`);
      if (!res.ok) throw new Error("Mijozlarni yuklashda xatolik");
      return res.json();
    },
    enabled: !!stationId,
  });
}

export function useStations() {
  return useQuery<Station[]>({
    queryKey: [api.stations.list.path],
    queryFn: async () => {
      const res = await authFetch(api.stations.list.path);
      if (!res.ok) throw new Error("Shaxobchalarni yuklashda xatolik");
      return res.json();
    },
  });
}

export function useCreateStation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateStation) => {
      const res = await authFetch(api.stations.create.path, {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Shaxobcha yaratishda xatolik");
      return res.json() as Promise<Station>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.stations.list.path] });
      toast({ title: "Muvaffaqiyat", description: "Shaxobcha yaratildi" });
    },
    onError: (error: Error) => {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateStation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CreateStation & { isActive?: boolean }> }) => {
      const res = await authFetch(`${api.stations.list.path}/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Shaxobcha yangilashda xatolik");
      return res.json() as Promise<Station>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.stations.list.path] });
      toast({ title: "Muvaffaqiyat", description: "Shaxobcha yangilandi" });
    },
    onError: (error: Error) => {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteStation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await authFetch(`${api.stations.list.path}/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: "Shaxobcha o'chirishda xatolik" }));
        throw new Error(error.message || "Shaxobcha o'chirishda xatolik");
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.stations.list.path] });
      toast({ title: "Muvaffaqiyat", description: "Shaxobcha o'chirildi" });
    },
    onError: (error: Error) => {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    },
  });
}

export function useChecks(filters?: { stationId?: number; status?: string; operatorId?: number }) {
  const params = new URLSearchParams();
  if (filters?.stationId) params.append("stationId", String(filters.stationId));
  if (filters?.status) params.append("status", filters.status);
  if (filters?.operatorId) params.append("operatorId", String(filters.operatorId));

  const url = params.toString() ? `${api.checks.list.path}?${params}` : api.checks.list.path;

  return useQuery<Check[]>({
    queryKey: [api.checks.list.path, filters],
    queryFn: async () => {
      const res = await authFetch(url);
      if (!res.ok) throw new Error("Cheklarni yuklashda xatolik");
      return res.json();
    },
  });
}

export function useCreateCheck() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateCheck) => {
      const res = await authFetch(api.checks.create.path, {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Chek yaratishda xatolik");
      return res.json() as Promise<Check>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.checks.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.stats.get.path] });
      toast({ title: "Muvaffaqiyat", description: "Chek yaratildi" });
    },
    onError: (error: Error) => {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    },
  });
}

export function useConfirmCheck() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (checkId: number) => {
      const res = await authFetch(`/api/checks/${checkId}/confirm`, {
        method: "PUT",
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Chekni tasdiqlashda xatolik");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.checks.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.stats.get.path] });
      toast({ title: "Muvaffaqiyat", description: "Chek tasdiqlandi" });
    },
    onError: (error: Error) => {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    },
  });
}

export function useCancelCheck() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (checkId: number) => {
      const res = await authFetch(`/api/checks/${checkId}/cancel`, {
        method: "PUT",
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Chekni bekor qilishda xatolik");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.checks.list.path] });
      toast({ title: "Muvaffaqiyat", description: "Chek bekor qilindi" });
    },
    onError: (error: Error) => {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    },
  });
}

export function useOperatorStats(operatorId: number) {
  return useQuery<OperatorStats>({
    queryKey: ["/api/stats/operator", operatorId],
    queryFn: async () => {
      const res = await authFetch(`/api/stats/operator/${operatorId}`);
      if (!res.ok) throw new Error("Statistikani yuklashda xatolik");
      return res.json();
    },
    enabled: !!operatorId,
  });
}

export function useMessages() {
  return useQuery<Message[]>({
    queryKey: [api.messages.list.path],
    queryFn: async () => {
      const res = await authFetch(api.messages.list.path);
      if (!res.ok) throw new Error("Xabarlarni yuklashda xatolik");
      return res.json();
    },
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateMessage) => {
      const res = await authFetch(api.messages.sendAll.path, {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Xabar yuborishda xatolik");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.messages.list.path] });
      toast({
        title: "Muvaffaqiyat",
        description: `Xabar ${data.recipientsCount} ta mijozga yuborildi`,
      });
    },
    onError: (error: Error) => {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    },
  });
}

export function useStats() {
  return useQuery<StatsResponse>({
    queryKey: [api.stats.get.path],
    queryFn: async () => {
      const res = await authFetch(api.stats.get.path);
      if (!res.ok) throw new Error("Statistikani yuklashda xatolik");
      return res.json();
    },
  });
}

interface TopCustomer {
  id: number;
  fullName: string | null;
  phone: string | null;
  balanceLiters: string;
  _count?: { usedChecks: number };
}

export function useTopCustomers(order: "asc" | "desc" = "desc", limit: number = 10) {
  return useQuery<TopCustomer[]>({
    queryKey: ["/api/users/top", order, limit],
    queryFn: async () => {
      const res = await authFetch(`/api/users/top?order=${order}&limit=${limit}`);
      if (!res.ok) throw new Error("Top mijozlarni yuklashda xatolik");
      return res.json();
    },
  });
}

export function useCustomersReport(order: "asc" | "desc" = "desc") {
  return useQuery<TopCustomer[]>({
    queryKey: ["/api/users/report", order],
    queryFn: async () => {
      const res = await authFetch(`/api/users/report?order=${order}`);
      if (!res.ok) throw new Error("Hisobotni yuklashda xatolik");
      return res.json();
    },
  });
}

export async function exportCustomersToExcel() {
  const res = await fetch("/api/users/export/excel", {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Excel yuklab olishda xatolik");

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `mijozlar-hisoboti-${new Date().toISOString().split("T")[0]}.xlsx`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  a.remove();
}
