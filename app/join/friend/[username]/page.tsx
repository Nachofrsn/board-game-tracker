'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Dices, Users, UserCheck, CheckCircle2, ArrowRight, LogIn, UserPlus, Share2, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PlayerAvatar } from '@/components/board/player-avatar'
import { toast } from 'sonner'
import { useFriends } from '@/lib/use-friends'

type FriendJoinData = {
  inviter: {
    id: string
    name: string
    username?: string | null
    image?: string | null
  }
  isLoggedIn: boolean
  isSelf: boolean
  status: 'none' | 'friend' | 'pending_sent' | 'pending_received' | 'self'
  currentUser?: {
    id: string
    name: string
    username?: string | null
  } | null
}

export default function FriendJoinPage() {
  const params = useParams()
  const router = useRouter()
  const { refetch } = useFriends()
  const rawUsername = params.username as string
  const username = decodeURIComponent(rawUsername || '')

  const [loading, setLoading] = React.useState(true)
  const [connecting, setConnecting] = React.useState(false)
  const [data, setData] = React.useState<FriendJoinData | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [copied, setCopied] = React.useState(false)

  const fetchStatus = React.useCallback(() => {
    if (!username) return
    setLoading(true)
    fetch(`/api/friends/join/${encodeURIComponent(username)}`)
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || 'No se pudo cargar la invitación')
        }
        return res.json()
      })
      .then((json: FriendJoinData) => {
        setData(json)
        setError(null)
      })
      .catch((err) => {
        setError(err.message)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [username])

  React.useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  const inviteUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/join/friend/${encodeURIComponent(username)}`
      : ''

  function handleCopy() {
    if (!inviteUrl) return
    navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    toast.success('¡Enlace de amistad copiado!')
    setTimeout(() => setCopied(false), 2000)
  }

  function handleShareWhatsApp() {
    const inviterName = data?.inviter?.name || username
    const text = `¡Hola! Te invito a sumarte como amigo en Mesa Mayor para registrar nuestras partidas de juegos de mesa:\n${inviteUrl}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer')
  }

  async function handleAccept() {
    if (!username) return
    setConnecting(true)
    try {
      const res = await fetch(`/api/friends/join/${encodeURIComponent(username)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const result = await res.json()
      if (!res.ok) {
        throw new Error(result.error || 'No pudimos completar la solicitud')
      }

      await refetch()
      toast.success(result.message || `¡Ahora sos amigo de ${data?.inviter.name}!`)
      setData((prev) => (prev ? { ...prev, status: 'friend' } : null))
    } catch (err: any) {
      toast.error(err.message || 'Ocurrió un error al aceptar la amistad')
    } finally {
      setConnecting(false)
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
                  {error || 'El usuario no existe o el enlace es incorrecto.'}
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
              <div className="bg-primary/10 border-b border-border/60 px-6 py-6 text-center flex flex-col items-center">
                <PlayerAvatar
                  id={data.inviter.id}
                  name={data.inviter.name}
                  className="size-16 ring-4 ring-card mb-3 shadow-md"
                />
                <span className="text-xs uppercase tracking-wider font-semibold text-primary">
                  Invitación de amistad
                </span>
                <h1 className="font-serif text-2xl font-bold mt-1 text-foreground">
                  {data.inviter.name}
                </h1>
                {data.inviter.username && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    @{data.inviter.username}
                  </p>
                )}
              </div>

              <CardContent className="pt-6 flex flex-col gap-5">
                <p className="text-sm text-muted-foreground text-center">
                  {data.isSelf ? (
                    'Este es tu enlace personal de invitación de amistad para compartir.'
                  ) : (
                    <>
                      <strong>{data.inviter.name}</strong> te invitó a ser amigos en Mesa Mayor para
                      compartir grupos y llevar registro de partidas de juegos de mesa juntos.
                    </>
                  )}
                </p>

                <div className="rounded-xl border border-border/80 bg-muted/30 p-4">
                  {data.isSelf ? (
                    <div className="flex flex-col gap-3 text-center">
                      <p className="text-xs font-medium text-foreground">
                        Compartí este enlace por WhatsApp o copialo:
                      </p>
                      <div className="flex items-center gap-2">
                        <Input readOnly value={inviteUrl} className="font-mono text-xs select-all" />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={handleCopy}
                          title="Copiar enlace"
                        >
                          {copied ? <Check className="size-4 text-primary" /> : <Copy className="size-4" />}
                        </Button>
                      </div>
                      <Button
                        className="w-full gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white border-0"
                        onClick={handleShareWhatsApp}
                      >
                        <Share2 className="size-4" />
                        Compartir por WhatsApp
                      </Button>
                    </div>
                  ) : data.status === 'friend' ? (
                    <div className="flex flex-col items-center gap-3 text-center">
                      <div className="flex size-10 items-center justify-center rounded-full bg-primary/15 text-primary">
                        <CheckCircle2 className="size-6" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">¡Ya son amigos en Mesa Mayor!</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Ahora pueden sumarse a los mismos grupos y registrar partidas.
                        </p>
                      </div>
                      <Link href="/" className="w-full mt-2">
                        <Button className="w-full">
                          Ir a la mesa
                          <ArrowRight data-icon="inline-end" className="size-4" />
                        </Button>
                      </Link>
                    </div>
                  ) : !data.isLoggedIn ? (
                    <div className="flex flex-col gap-3 text-center">
                      <div>
                        <p className="font-medium text-sm text-foreground">
                          Para sumarte como amigo, iniciá sesión o creá tu cuenta
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Solo necesitás un nombre de usuario y contraseña.
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 pt-2">
                        <Link
                          href={`/sign-up?redirect=${encodeURIComponent(`/join/friend/${username}`)}`}
                          className="w-full"
                        >
                          <Button className="w-full gap-2">
                            <UserPlus className="size-4" />
                            Crear cuenta y conectar
                          </Button>
                        </Link>
                        <Link
                          href={`/sign-in?redirect=${encodeURIComponent(`/join/friend/${username}`)}`}
                          className="w-full"
                        >
                          <Button variant="outline" className="w-full gap-2">
                            <LogIn className="size-4" />
                            Ya tengo cuenta (Iniciar sesión)
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
                        className="w-full font-medium gap-2"
                        disabled={connecting}
                        onClick={handleAccept}
                      >
                        <UserCheck className="size-4" />
                        {connecting ? 'Conectando...' : `Aceptar y ser amigos`}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>

              <CardFooter className="pt-0 justify-center">
                <Link href="/" className="text-xs text-muted-foreground hover:text-foreground">
                  ← Volver a Mesa Mayor
                </Link>
              </CardFooter>
            </>
          )}
        </Card>
      </div>
    </main>
  )
}
