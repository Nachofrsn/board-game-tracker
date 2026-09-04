import { betterAuth } from 'better-auth'
import { Pool } from 'pg'

const origins = [
  'http://localhost:3000',
  process.env.BETTER_AUTH_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
].filter(Boolean) as string[]

export const auth = betterAuth({
  database: new Pool({ connectionString: process.env.DATABASE_URL }),
  baseURL: process.env.BETTER_AUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'),
  trustedOrigins: origins,
  emailAndPassword: { enabled: true },
})

export type Session = typeof auth.$Infer.Session

export async function getSession(requestHeaders: Headers) {
  return auth.api.getSession({ headers: requestHeaders })
}
