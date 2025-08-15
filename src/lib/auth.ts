import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Test credentials - in a real app, you would check against a database
        if (credentials.username === "admin" && credentials.password === "admin123") {
          return {
            id: "1",
            name: "Admin User",
            email: "admin@carrierlookup.com",
            role: "admin"
          }
        }
        
        if (credentials.username === "user" && credentials.password === "user123") {
          return {
            id: "2",
            name: "Test User",
            email: "user@carrierlookup.com",
            role: "user"
          }
        }
        
        return null
      }
    })
  ],
  pages: {
    signIn: "/auth/signin"
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.role = user.role
      }
      return token
    },
    session: async ({ session, token }) => {
      if (token) {
        session.user.id = token.sub as string
        session.user.role = token.role as string
      }
      return session
    }
  },
  session: {
    strategy: "jwt"
  }
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }