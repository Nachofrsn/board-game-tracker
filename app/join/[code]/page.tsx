'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Dices, Users, CheckCircle2, ArrowRight, LogIn, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { PlayerAvatar } from '@/components/board/player-avatar'
import { toast } from 'sonner'
import { useStore } from '@/lib/store'

type JoinData = {
  group: {
    id: string
    name: string
    description: string | null
    color: string
  }
  creatorName: string | null
  members: Array<{ id: string; name: string; initials: string; color: string; userId: string | null }>
  isMember: boolean
  isLoggedIn: boolean
  currentUser: { id: string; name: string; username?: string | null; email?: string } | null
}

export default function JoinGroupPage() {
  const params = useParams()
  const router = useRouter()
  const { refresh } = useStore()
  const code = params.code as string

  const [loading, setLoading] = React.useState(true)
  const [joining, setJoining] = React.useState(false)
  const [data, setData] = React.useState<JoinData | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!code) return
    setLoading(true)
    fetch(`/api/groups/join/${code}`)
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || 'No se pudo cargar la invitación')
        }
        return res.json()
      })
      .then((json: JoinData) => {
        setData(json)
        setError(null)
      })
      .catch((err) => {
        setError(err.message)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [code])

  async function handleJoin() {
    if (!code) return
    setJoining(true)
    try {
      const res = await fetch(`/api/groups/join/${code}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const result = await res.json()
      if (!res.ok) {
        throw new Error(result.error || 'No pudimos unirte al grupo')
      }

      await refresh()
      toast.success(
        result.alreadyMember
          ? `Ya sos parte del grupo "${data?.group.name}"`
          : `¡Te uniste a "${data?.group.name}"!`
      )
      router.push('/')
    } catch (err: any) {
      toast.error(err.message || 'Ocurrió un error al intentar unirte')
    } finally {
      setJoining(false)
    }
  }

  return (
    <main className="min-h-screen grid place-items-center p-4 sm:p-6 bg-[var(--felt)]">
      <div className="w-full max-w-md">
        <div className="mb-4 flex items-center justify-center gap-2 text-primary font-serif font-bold text-lg">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Dices className="size-5" />
          </div>
          <span>Mesa Mayor</span>
        </div>

        <Card className="border-[var(--wood-line)] bg-card shadow-2xl overflow-hidden">
          {loading ? (
            <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">Cargando invitación...</p>
            </CardContent>
          ) : error || !data ? (
            <>
              <CardHeader className="text-center pb-2">
                <CardTitle className="font-serif text-2xl text-destructive">
                  Invitación no válida
                </CardTitle>
                <CardDescription className="mt-2 text-balance">
                  {error || 'El enlace de invitación no existe o ha expirado.'}
                </CardDescription>
              </CardHeader>
              <CardFooter className="pt-4 flex justify-center">
                <Link href="/">
                  <Button variant="outline">Ir a Mesa Mayor</Button>
                </Link>
              </CardFooter>
            </>
          ) : (
            <>
              <div className="bg-primary/10 border-b border-border/60 px-6 py-4 text-center">
                <span className="text-xs uppercase tracking-wider font-semibold text-primary">
                  Invitación a grupo
                </span>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold mt-1 text-foreground">
                  {data.group.name}
                </h1>
                {data.creatorName && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Creado por {data.creatorName}
                  </p>
                )}
              </div>

              <CardContent className="pt-6 flex flex-col gap-6">
                {data.group.description && (
                  <p className="text-sm text-muted-foreground text-center italic">
                    "{data.group.description}"
                  </p>
                )}

                <div>
                  <div className="flex items-center justify-between mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <Users className="size-3.5" />
                      Jugadores de la mesa ({data.members.length})
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {data.members.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center gap-2 rounded-full border border-border/80 bg-muted/40 px-3 py-1 text-xs"
                      >
                        <PlayerAvatar id={m.id} name={m.name} className="size-5" />
                        <span className="font-medium">{m.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-border/80 bg-muted/30 p-4">
                  {data.isMember ? (
                    <div className="flex flex-col items-center gap-3 text-center">
                      <div className="flex size-10 items-center justify-center rounded-full bg-primary/15 text-primary">
                        <CheckCircle2 className="size-6" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Ya sos miembro de este grupo</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Podés ver y cargar partidas directamente desde el inicio.
                        </p>
                      </div>
                      <Link href="/" className="w-full mt-2">
                        <Button className="w-full">
                          Ir al grupo
                          <ArrowRight data-icon="inline-end" className="size-4" />
                        </Button>
                      </Link>
                    </div>
                  ) : !data.isLoggedIn ? (
                    <div className="flex flex-col gap-3 text-center">
                      <div>
                        <p className="font-medium text-sm text-foreground">
                          Para sumarte al grupo, iniciá sesión o creá tu cuenta
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Solo necesitás un usuario y contraseña (sin email).
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 pt-2">
                        <Link href={`/sign-up?redirect=/join/${code}`} className="w-full">
                          <Button className="w-full gap-2">
                            <UserPlus className="size-4" />
                            Crear cuenta y unirme
                          </Button>
                        </Link>
                        <Link href={`/sign-in?redirect=/join/${code}`} className="w-full">
                          <Button variant="outline" className="w-full gap-2">
                            <LogIn className="size-4" />
                            Ya tengo cuenta
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground">Sesión iniciada como</p>
                        <p className="font-semibold text-sm text-foreground">
                          {data.currentUser?.name}
                          {data.currentUser?.username && (
                            <span className="text-muted-foreground font-normal ml-1.5">
                              (@{data.currentUser?.username})
                            </span>
                          )}
                        </p>
                      </div>
                      <Button
                        size="lg"
                        className="w-full font-medium"
                        disabled={joining}
                        onClick={handleJoin}
                      >
                        {joining ? 'Uniéndote...' : 'Unirme a este grupo'}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>

              <CardFooter className="pt-0 justify-center">
                <Link href="/" className="text-xs text-muted-foreground hover:text-foreground">
                  ← Volver al inicio
                </Link>
              </CardFooter>
            </>
          )}
        </Card>
      </div>
    </main>
  )
}
