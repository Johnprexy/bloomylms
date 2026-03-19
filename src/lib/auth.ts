import NextAuth, { type NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { sql } from '@/lib/db'


export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        try {
          const users = await sql`
            SELECT id, email, full_name, password_hash, role, avatar_url, is_active
            FROM users WHERE email = ${credentials.email} LIMIT 1
          `
          const user = users[0]
          if (!user) return null
          if (!user.is_active) return null
          if (!user.password_hash) return null

          const valid = await bcrypt.compare(credentials.password, user.password_hash)
          if (!valid) return null

          return {
            id: user.id,
            email: user.email,
            name: user.full_name,
            image: user.avatar_url,
            role: user.role,
          }
        } catch (err) {
          console.error('Auth error:', err)
          return null
        }
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
      }
      // Allow role updates
      if (trigger === 'update' && session?.role) {
        token.role = session.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string
        ;(session.user as any).role = token.role as string
      }
      return session
    },
    async signIn({ user, account }) {
      // Handle Google OAuth — upsert user
      if (account?.provider === 'google' && user.email) {
        try {
          const existing = await sql`
            SELECT id FROM users WHERE email = ${user.email} LIMIT 1
          `
          if (existing.length === 0) {
            await sql`
              INSERT INTO users (email, full_name, avatar_url, email_verified, role)
              VALUES (${user.email}, ${user.name || ''}, ${user.image || null}, true, 'student')
              ON CONFLICT (email) DO UPDATE SET
                full_name = EXCLUDED.full_name,
                avatar_url = EXCLUDED.avatar_url
            `
          }
          // Update the user id to match DB
          const dbUser = await sql`SELECT id FROM users WHERE email = ${user.email} LIMIT 1`
          if (dbUser[0]) user.id = dbUser[0].id
        } catch (err) {
          console.error('Google sign-in error:', err)
          return false
        }
      }
      return true
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}

export default NextAuth(authOptions)
