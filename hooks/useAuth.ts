import { useSession, signIn, signOut } from "next-auth/react";
import { User, UserRole } from '@/domain/models';

export function useAuth() {
  const { data: session, status } = useSession();

  const user = session?.user as any;
  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";
  const isInitialized = status !== "loading";

  return {
    user,
    isAuthenticated,
    isLoading,
    isInitialized,

    loginWithSSO: async () => {
      await signIn("keycloak");
    },
    loginWithCredentials: async (email?: string, password?: string) => {
      const targetEmail = email || "admin@garutkab.go.id";
      const targetPassword = password || "PUPRAdmin2024!";
      await signIn("credentials", {
        email: targetEmail,
        password: targetPassword,
        callbackUrl: "/",
      });
    },
    logout: async () => {
      await signOut();
    },

    hasRole: (roles: UserRole[]) => {
      if (!user || !user.role) return false;
      return roles.includes(user.role as UserRole);
    }
  };
}
