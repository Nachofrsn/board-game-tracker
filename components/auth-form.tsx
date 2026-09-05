'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter()
  const [username, setUsername] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const isSignup = mode === 'sign-up'

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError('')

    const cleanUsername = username.trim().toLowerCase()
    if (!cleanUsername) {
      setError('Por favor ingresá un nombre de usuario.')
      return
    }
    if (cleanUsername.length < 3) {
      setError('El nombre de usuario debe tener al menos 3 caracteres.')
      return
    }
    if (!/^[a-zA-Z0-9_.]+$/.test(cleanUsername)) {
      setError('El usuario solo puede contener letras, números, puntos (.) o guiones bajos (_).')
      return
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }

    setLoading(true)
    try {
      let result: any
      if (isSignup) {
        const internalEmail = `${cleanUsername}@mesa.local`
        result = await authClient.signUp.email({
          name: username.trim(),
          email: internalEmail,
          password,
          username: cleanUsername,
        } as any)
      } else {
        result = await authClient.signIn.username({
          username: cleanUsername,
          password,
        })
      }

      setLoading(false)
      if (result?.error) {
        console.error('Auth error:', result.error)
        const msg = result.error.message || ''
        const code = (result.error as any).code || ''

        if (
          code === 'USERNAME_IS_ALREADY_TAKEN' ||
          msg.toLowerCase().includes('already taken') ||
          msg.toLowerCase().includes('already exists')
        ) {
          setError('El nombre de usuario ya está registrado. Elegí otro.')
        } else if (
          code === 'INVALID_USERNAME_OR_PASSWORD' ||
          msg.toLowerCase().includes('invalid') ||
          msg.toLowerCase().includes('credential')
        ) {
          setError('Usuario o contraseña incorrectos.')
        } else if (code === 'USERNAME_TOO_SHORT') {
          setError('El nombre de usuario debe tener al menos 3 caracteres.')
        } else if (code === 'USERNAME_TOO_LONG') {
          setError('El nombre de usuario no puede tener más de 30 caracteres.')
        } else {
          setError(msg || 'No pudimos completar la operación. Revisá tus datos e intentá de nuevo.')
        }
        return
      }

      const rawRedirect =
        typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).get('redirect') || '/'
          : '/'
      const redirectUrl =
        rawRedirect.startsWith('/') && !rawRedirect.startsWith('//')
          ? rawRedirect
          : '/'
      window.location.href = redirectUrl
    } catch (err: any) {
      setLoading(false)
      console.error('Unexpected auth error:', err)
      setError('Ocurrió un error inesperado. Por favor intentá de nuevo.')
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="username">Usuario</Label>
        <Input
          id="username"
          type="text"
          required
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="nacho_board"
          minLength={3}
          maxLength={30}
        />
        {isSignup && (
          <p className="text-xs text-muted-foreground">
            Mínimo 3 caracteres (solo letras, números, puntos o guiones bajos).
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          type="password"
          minLength={8}
          required
          autoComplete={isSignup ? 'new-password' : 'current-password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
        {isSignup && (
          <p className="text-xs text-muted-foreground">
            Mínimo 8 caracteres.
          </p>
        )}
      </div>

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button disabled={loading} type="submit">
        {loading ? 'Procesando...' : isSignup ? 'Crear cuenta' : 'Iniciar sesión'}
      </Button>
    </form>
  )
}
