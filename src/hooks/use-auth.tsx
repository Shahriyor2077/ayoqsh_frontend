import { createContext, ReactNode, useContext, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, LoginRequest, LoginResponse, api, tokenStorage, getAuthHeaders } from "@/types";
import { useToast } from "@/hooks/use-toast";

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

      const res = await fetch(api.auth.login.path, {
        method: api.auth.login.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Foydalanuvchi nomi yoki parol noto'g'ri");
      }
      return await res.json();
    },
    onSuccess: (data: LoginResponse) => {
      tokenStorage.set(data.accessToken);
      setStoredUser(data.user);
      queryClient.setQueryData(["auth-user"], data.user);
      toast({
        title: "Xush kelibsiz!",
        description: `${data.user.fullName || data.user.username} sifatida kirdingiz`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Kirish muvaffaqiyatsiz",
        description: error.message,
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
      await fetch(api.auth.logout.path, {
        method: api.auth.logout.method,
        headers: getAuthHeaders(),
      });
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

      const res = await fetch(api.auth.me.path, {
        headers: getAuthHeaders(),
      });

      if (res.status === 401) {
        tokenStorage.remove();
        setStoredUser(null);
        return null;
      }

      if (!res.ok) {
        return getStoredUser();
      }

      const userData = await res.json();
      setStoredUser(userData);
      return userData;
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
