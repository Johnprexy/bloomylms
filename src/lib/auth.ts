import { type NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { sql } from '@/lib/db'

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  // Enable debug in development
  debug: process.env.NODE_ENV === 'development',
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Email & Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = credentials.email.toLowerCase().trim()
        const password = credentials.password

        try {
          const users = await sql`
            SELECT id, email, full_name, password_hash, role, avatar_url, is_active
            FROM users
            WHERE LOWER(email) = LOWER(${email})
            LIMIT 1
          `

          const user = users[0]

          if (!user) {
            console.log('[Auth] No user found for:', email)
            return null
          }

          if (!user.is_active) {
            console.log('[Auth] User is not active:', email)
            return null
          }

          if (!user.password_hash) {
            console.log('[Auth] User has no password hash:', email)
            return null
          }

          const isValid = await bcrypt.compare(password, user.password_hash)

          if (!isValid) {
            console.log('[Auth] Invalid password for:', email)
            return null
          }

          console.log('[Auth] Successful login for:', email, 'role:', user.role)

          return {
            id: user.id,
            email: user.email,
            name: user.full_name,
            image: user.avatar_url || null,
            role: user.role,
          }
        } catch (err) {
          console.error('[Auth] Database error during authorize:', err)
          return null
        }
      },
    }),

    // Google OAuth — only enabled if credentials are set
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        })]
      : []
    ),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // On initial sign in, attach role and id from user object
      if (user) {
        token.id = user.id
        token.role = (user as any).role ?? 'student'
        token.email = user.email
        token.name = user.name
      }
      return token
    },

    async session({ session, token }) {
      if (session.user && token) {
        (session.user as any).id = token.id
        ;(session.user as any).role = token.role ?? 'student'
        session.user.email = token.email
        session.user.name = token.name
      }
      return session
    },

    async signIn({ user, account }) {
      // Handle Google OAuth — create user in DB if not exists
      if (account?.provider === 'google' && user.email) {
        try {
          const existing = await sql`
            SELECT id, role FROM users WHERE LOWER(email) = LOWER(${user.email}) LIMIT 1
          `
          if (existing.length === 0) {
            const newUser = await sql`
              INSERT INTO users (email, full_name, avatar_url, email_verified, role, is_active)
              VALUES (${user.email}, ${user.name || ''}, ${user.image || null}, true, 'student', true)
              RETURNING id, role
            `
            user.id = newUser[0]?.id
            ;(user as any).role = 'student'
          } else {
            user.id = existing[0].id
            ;(user as any).role = existing[0].role
          }
        } catch (err) {
          console.error('[Auth] Google sign-in DB error:', err)
          return false
        }
      }
      return true
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
}
