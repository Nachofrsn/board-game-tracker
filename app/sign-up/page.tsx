import Link from 'next/link'
import { AuthForm } from '@/components/auth-form'

export default function SignUpPage() { return <main className="min-h-screen grid place-items-center p-6 bg-[var(--felt)]"><section className="w-full max-w-md rounded-2xl border border-[var(--wood-line)] bg-card p-8 shadow-xl"><p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">Mesa Mayor</p><h1 className="mt-3 text-3xl font-bold">Sumate a la mesa</h1><p className="mt-2 text-muted-foreground">Creá tu cuenta para acceder a tus grupos.</p><div className="mt-8"><AuthForm mode="sign-up" /></div><p className="mt-6 text-center text-sm text-muted-foreground">¿Ya tenés cuenta? <Link className="font-semibold text-primary underline" href="/sign-in">Iniciar sesión</Link></p></section></main> }
