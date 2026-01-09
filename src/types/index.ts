import { z } from "zod";

export type Role = "moderator" | "operator" | "customer";
export type CheckStatus = "pending" | "printed" | "used" | "expired" | "cancelled";

export interface Station {
    id: number;
    name: string;
    address: string | null;
    phone: string | null;
    isActive: boolean;
    createdAt: string;
    _count?: {
        operators: number;
        checks: number;
    };
}

export interface User {
    id: number;
    username: string | null;
    password: string | null;
    fullName: string | null;
    phone: string | null;
    telegramId: string | null;
    telegramUsername: string | null;
    role: Role;
    balanceLiters: string;
    isActive: boolean;
    stationId: number | null;
    station?: { id: number; name: string } | null;
    lastStation?: { id: number; name: string } | null;
    createdAt: string;
}

export interface Check {
    id: number;
    code: string;
    qrCode: string | null;
    amountLiters: string;
    status: CheckStatus;
    isPrinted: boolean;
    customerName: string | null;
    customerPhone: string | null;
    customerAddress: string | null;
    operatorId: number;
    stationId: number;
    customerId: number | null;
    usedAt: string | null;
    createdAt: string;
    expiresAt: string;
    operator?: { id: number; fullName: string | null; username: string | null };
    customer?: { id: number; fullName: string | null; phone: string | null };
    station?: { id: number; name: string };
}

export interface Message {
    id: number;
    title: string;
    content: string;
    senderId: number;
    isGlobal: boolean;
    createdAt: string;
    sender?: { id: number; fullName: string | null; username: string | null };
    _count?: { recipients: number };
}

export interface StatsResponse {
    totalCustomers: number;
    totalOperators: number;
    totalStations: number;
    totalChecks: number;
    usedChecks: number;
    pendingChecks: number;
    usedLiters: number;
    pendingLiters: number;
    totalLiters: number;
}

export interface OperatorStats {
    today: { checks: number; liters: number };
    month: { checks: number; liters: number };
    total: { checks: number; liters: number };
}

export interface LoginRequest {
    username: string;
    password: string;
}

export const insertUserSchema = z.object({
    username: z.string().optional(),
    password: z.string().optional(),
    fullName: z.string().optional(),
    phone: z.string().optional(),
    telegramId: z.string().optional(),
    role: z.enum(["moderator", "operator", "customer"]).optional(),
    stationId: z.number().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;

export const createCheckSchema = z.object({
    amountLiters: z.number().min(0.1),
    operatorId: z.number(),
    stationId: z.number(),
    customerName: z.string().optional(),
    customerPhone: z.string().optional(),
    customerAddress: z.string().optional(),
    autoUse: z.boolean().optional(),
});

export type CreateCheck = z.infer<typeof createCheckSchema>;

export const createStationSchema = z.object({
    name: z.string().min(1),
    address: z.string().optional(),
    phone: z.string().optional(),
});

export type CreateStation = z.infer<typeof createStationSchema>;

export const createMessageSchema = z.object({
    title: z.string().min(1),
    content: z.string().min(1),
    senderId: z.number(),
});

export type CreateMessage = z.infer<typeof createMessageSchema>;

export interface LoginResponse {
    user: User;
    accessToken: string;
}

const TOKEN_KEY = "ayoqsh_token";

export const tokenStorage = {
    get: (): string | null => localStorage.getItem(TOKEN_KEY),
    set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
    remove: () => localStorage.removeItem(TOKEN_KEY),
};
