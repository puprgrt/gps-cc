import NextAuth from "next-auth"
import KeycloakProvider from "next-auth/providers/keycloak"
import CredentialsProvider from "next-auth/providers/credentials"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    KeycloakProvider({
      clientId: process.env.AUTH_KEYCLOAK_ID,
      clientSecret: process.env.AUTH_KEYCLOAK_SECRET,
      issuer: process.env.AUTH_KEYCLOAK_ISSUER,
    }),
    CredentialsProvider({
      id: "dev-bypass",
      name: "Bypass (Dev Only)",
      credentials: {
        bypass_token: { label: "Bypass Token", type: "text" }
      },
      async authorize(credentials) {
        if (credentials?.bypass_token === "DEV_BYPASS") {
          return {
            id: "dev-admin-1",
            name: "Administrator (Bypass)",
            email: "admin@garutkab.go.id",
            image: "https://ui-avatars.com/api/?name=Admin+Bypass&background=0D8ABC&color=fff"
          }
        }
        return null
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // Saat login pertama kali
      if (account && user) {
        token.accessToken = account.access_token
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
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
  secret: process.env.AUTH_SECRET,
  trustHost: true,
})
