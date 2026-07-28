import NextAuth from "next-auth"
import KeycloakProvider from "next-auth/providers/keycloak"
import CredentialsProvider from "next-auth/providers/credentials"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    KeycloakProvider({
      clientId: process.env.AUTH_KEYCLOAK_ID || "gps-cc-client",
      clientSecret: process.env.AUTH_KEYCLOAK_SECRET || "placeholder-secret",
      issuer: process.env.AUTH_KEYCLOAK_ISSUER || "https://placeholder-keycloak.local",
    }),
    CredentialsProvider({
      name: "Akun PUPR",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }
        // Super Admin default untuk pengujian & operasional lokal/cloud
        if (
          (credentials.email === "admin@garutkab.go.id" || credentials.email === "admin@pupr.garutkab.go.id") &&
          (credentials.password === "PUPRAdmin2024!" || credentials.password === "puprgarut2026")
        ) {
          return {
            id: "usr-admin-01",
            name: "Super Admin PUPR Garut",
            email: "admin@garutkab.go.id",
            role: "super_admin",
            bidang: "SEKRETARIAT",
            jabatan: "Kepala Bidang TIK PUPR"
          } as any
        }
        // Operator TIK PUPR
        if (
          credentials.email === "operator@pupr.garutkab.go.id" &&
          credentials.password === "Operator2026!"
        ) {
          return {
            id: "usr-operator-01",
            name: "Operator TIK PUPR Garut",
            email: "operator@pupr.garutkab.go.id",
            role: "operator",
            bidang: "BINA_MARGA",
            jabatan: "Operator Laporan Warga"
          } as any
        }
        return null
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role || "super_admin"
        token.bidang = (user as any).bidang || "SEKRETARIAT"
      }
      if (account) {
        token.accessToken = account.access_token || "cred-access-token"
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        ;(session.user as any).role = token.role || "super_admin"
        ;(session.user as any).bidang = token.bidang || "SEKRETARIAT"
        ;(session as any).accessToken = token.accessToken
      }
      return session
    }
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login'
  },
  secret: process.env.AUTH_SECRET || "pupr-garut-default-secret-key-2026",
  trustHost: true,
})
