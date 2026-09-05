'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter()
  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const isSignup = mode === 'sign-up'

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError(''); setLoading(true)
    const result = isSignup
      ? await authClient.signUp.email({ name, email, password })
      : await authClient.signIn.email({ email, password })
    setLoading(false)
    if (result.error) {
      console.error('Auth error:', result.error)
      setError(result.error.message || 'No pudimos completar la operación. Revisá tus datos e intentá de nuevo.')
      return
    }
    const redirectUrl =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('redirect') || '/'
        : '/'
    window.location.href = redirectUrl
  }

  return <form onSubmit={submit} className="flex flex-col gap-5">
    {isSignup && <div className="flex flex-col gap-2"><Label htmlFor="name">Nombre de jugador</Label><Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nacho" /></div>}
    <div className="flex flex-col gap-2"><Label htmlFor="email">Usuario o email</Label><Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jugador@ejemplo.com" /></div>
    <div className="flex flex-col gap-2"><Label htmlFor="password">Contraseña</Label><Input id="password" type="password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <Button disabled={loading} type="submit">{loading ? 'Entrando...' : isSignup ? 'Crear cuenta' : 'Iniciar sesión'}</Button>
  </form>
}
