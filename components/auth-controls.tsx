'use client'

import * as React from 'react'
import Link from 'next/link'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'

export function AuthControls() {
  const { data: session, isPending } = authClient.useSession()
  if (isPending) return null
  if (!session) return <div className="flex items-center gap-2"><Link className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted" href="/sign-in">Ingresar</Link><Link className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground" href="/sign-up">Registrarse</Link></div>
  return <div className="flex items-center gap-3"><span className="hidden text-sm text-muted-foreground sm:inline">Hola, {session.user.name}</span><Button variant="outline" size="sm" onClick={() => authClient.signOut().then(() => window.location.reload())}>Salir</Button></div>
}
