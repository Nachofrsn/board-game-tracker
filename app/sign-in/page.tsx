import Link from 'next/link'
import { AuthForm } from '@/components/auth-form'

export default function SignInPage() { return <main className="min-h-screen grid place-items-center p-6 bg-[var(--felt)]"><section className="w-full max-w-md rounded-2xl border border-[var(--wood-line)] bg-card p-8 shadow-xl"><p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">Mesa Mayor</p><h1 className="mt-3 text-3xl font-bold">Volvé a la mesa</h1><p className="mt-2 text-muted-foreground">Ingresá para ver tus grupos y partidas.</p><div className="mt-8"><AuthForm mode="sign-in" /></div><p className="mt-6 text-center text-sm text-muted-foreground">¿Primera partida? <Link className="font-semibold text-primary underline" href="/sign-up">Crear cuenta</Link></p></section></main> }
