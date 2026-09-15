'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslation } from '@/components/i18n/TranslationProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoginForm } from './LoginForm'
import { createClient } from '@/lib/supabase'
import { safeRedirectPath } from '@/lib/safe-redirect'

export function EmailLoginForm() {
  const { t } = useTranslation()
  const params = useSearchParams()
  const [passwordMode, setPasswordMode] = useState(false)
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function sendLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const callback = new URL('/auth/callback?next=/dashboard', window.location.origin)
      const next = safeRedirectPath(params.get('next'))
      if (next !== '/dashboard') callback.searchParams.set('next', next)
      const { error: authError } = await createClient().auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: false, emailRedirectTo: callback.toString() },
      })
      // Do not reveal whether an address belongs to an existing account.
      if (authError && authError.code !== 'otp_disabled' && authError.code !== 'user_not_found') {
        setError('We could not send your link. Please wait a minute and try again.')
      } else {
        setSent(true)
      }
    } catch {
      setError('We could not send your link. Check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      {params.get('error') === 'auth_callback_failed' && <p role="alert" className="text-sm text-red-600">{t('This sign-in link could not be used. Request a new link below.')}</p>}
      {passwordMode ? <LoginForm /> : sent ? (
        <div role="status" className="space-y-3 text-sm">
          <p className="font-medium text-emerald-700">{t('Check your inbox')}</p>
          <p>{t('If an account exists for this email, a sign-in link is on its way. Check your spam folder too.')}</p>
          <Button variant="outline" onClick={() => setSent(false)}>{t('Edit email or request another link')}</Button>
        </div>
      ) : (
        <form onSubmit={sendLink} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="login_email">{t('Email')}</Label>
            <Input id="login_email" type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} />
          </div>
          {error && <p role="alert" className="text-sm text-red-600">{t(error)}</p>}
          <Button type="submit" disabled={busy} className="w-full bg-emerald-700 hover:bg-emerald-800">{t(busy ? 'Sending your link…' : 'Email me a sign-in link')}</Button>
          <p className="text-center text-xs text-stone-500">{t('No password needed. Your email link signs you in securely.')}</p>
        </form>
      )}
      <button type="button" className="block mx-auto text-sm text-emerald-700 underline" onClick={() => setPasswordMode(!passwordMode)}>{t(passwordMode ? 'Use an email link instead' : 'Use a password instead')}</button>
    </div>
  )
}
