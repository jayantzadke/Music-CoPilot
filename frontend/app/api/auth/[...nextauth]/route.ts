import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email'    },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null
        try {
          const res = await fetch(`${API}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: credentials.email, password: credentials.password }),
          })
          if (!res.ok) return null
          const { user, accessToken } = await res.json()
          return { ...user, accessToken }
        } catch {
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.accessToken = (user as Record<string, unknown>).accessToken as string
        token.userId = user.id
      }
      // for google oauth, register/login on our backend
      if (account?.provider === 'google' && user?.email) {
        try {
          const res = await fetch(`${API}/api/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email:       user.email,
              displayName: user.name ?? user.email.split('@')[0],
              googleId:    account.providerAccountId,
              avatar:      user.image,
            }),
          })
          if (res.ok) {
            const { user: dbUser, accessToken } = await res.json()
            token.accessToken = accessToken
            token.userId = dbUser.id
          }
        } catch {
          // google auth backend sync failed — still let them in
        }
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string
      if (session.user) {
        (session.user as Record<string, unknown>).id = token.userId
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET ?? 'dev-secret-change-in-production',
})

export { handler as GET, handler as POST }
