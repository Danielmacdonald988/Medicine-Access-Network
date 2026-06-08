import type { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UpdatePasswordForm } from '@/components/forms/UpdatePasswordForm'

export const metadata: Metadata = { title: 'Update password' }

export default function UpdatePasswordPage() {
  return (
    <Card className="border-stone-200">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Set a new password</CardTitle>
        <CardDescription>
          Choose a strong password of at least 8 characters.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <UpdatePasswordForm />
      </CardContent>
    </Card>
  )
}
