// import { useSession, signIn, signOut } from "next-auth/react";
import { User, UserRole } from '@/domain/models';

export function useAuth() {
  // === SEMENTARA KITA BYPASS UNTUK DEV ===
  // const { data: session, status } = useSession();

  const user = {
    id: "dev-bypass",
    name: "Developer",
    email: "dev@garutkab.go.id",
    role: "admin" as UserRole,
  };
  
  const isAuthenticated = true;
  const isLoading = false;
  const isInitialized = true;

  return {
    user,
    isAuthenticated,
    isLoading,
    isInitialized,

    loginWithSSO: async () => {},
    loginBypass: async () => {},
    logout: async () => {},

    hasRole: (roles: UserRole[]) => true
  };
}
