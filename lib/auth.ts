import { betterAuth } from 'better-auth'
import { username } from 'better-auth/plugins'
import { pool } from '@/lib/db'

const origins = [
  'http://localhost:*',
  'http://127.0.0.1:*',
  'http://192.168.*:*',
  'http://10.*:*',
  'https://*.vercel.app',
  process.env.BETTER_AUTH_URL,
  process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
].filter(Boolean) as string[]

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  database: pool,
  baseURL: process.env.BETTER_AUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'),
  trustedOrigins: origins,
  emailAndPassword: { enabled: true },
  plugins: [
    username({
      minUsernameLength: 3,
      maxUsernameLength: 30,
    }),
  ],
})

export type Session = typeof auth.$Infer.Session

export async function getSession(requestHeaders: Headers) {
  return auth.api.getSession({ headers: requestHeaders })
}
