import { createContext, ReactNode, useContext, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, LoginRequest, LoginResponse, tokenStorage } from "@/types";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/axios";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: ReturnType<typeof useLoginMutation>;
  logoutMutation: ReturnType<typeof useLogoutMutation>;
};

const AuthContext = createContext<AuthContextType | null>(null);

const USER_STORAGE_KEY = "ayoqsh_user";

function getStoredUser(): User | null {
  try {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function setStoredUser(user: User | null) {
  if (user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_STORAGE_KEY);
  }
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

function useLoginMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (credentials: LoginRequest): Promise<LoginResponse> => {
      tokenStorage.remove();
      setStoredUser(null);
      const { data } = await api.post<LoginResponse>("/api/auth/login", credentials);
      return data;
    },
    onSuccess: (data: LoginResponse) => {
      tokenStorage.set(data.accessToken);
      setStoredUser(data.user);
      queryClient.setQueryData(["auth-user"], data.user);
      // Toast login sahifalarida ko'rsatiladi (rol tekshirilgandan keyin)
    },
    onError: (error: any) => {
      toast({
        title: "Kirish muvaffaqiyatsiz",
        description: error.response?.data?.message || "Foydalanuvchi nomi yoki parol noto'g'ri",
        variant: "destructive",
      });
    },
  });
}

function useLogoutMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      await api.post("/api/auth/logout");
    },
    onSuccess: () => {
      tokenStorage.remove();
      setStoredUser(null);
      queryClient.setQueryData(["auth-user"], null);
      queryClient.clear();
      toast({
        title: "Chiqildi",
        description: "Keyingi safar ko'rishguncha!",
      });
    },
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [initialUser] = useState<User | null>(() => getStoredUser());

  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | null, Error>({
    queryKey: ["auth-user"],
    queryFn: async () => {
      const token = tokenStorage.get();
      if (!token) return null;

      try {
        const { data } = await api.get<User>("/api/auth/me");
        setStoredUser(data);
        return data;
      } catch (err: any) {
        if (err.response?.status === 401) {
          tokenStorage.remove();
          setStoredUser(null);
          return null;
        }
        return getStoredUser();
      }
    },
    initialData: initialUser,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const loginMutation = useLoginMutation();
  const logoutMutation = useLogoutMutation();

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
