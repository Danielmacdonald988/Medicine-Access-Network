import { getTranslation } from '@/lib/i18n/server'
import type { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UpdatePasswordForm } from '@/components/forms/UpdatePasswordForm'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslation()
  return { title: t('Update password') }
}

export default async function UpdatePasswordPage() {
  const { t } = await getTranslation()
  return (
    <Card className="gap-6 rounded-2xl border border-border bg-card py-7 shadow-[0_12px_45px_#203e3406] ring-0 sm:py-8">
      <CardHeader className="gap-3 px-6 sm:px-8">
        <CardTitle className="font-heading text-[40px] leading-[1.05] tracking-[-0.035em]"><h1>{t("Set a new password")}</h1></CardTitle>
        <CardDescription className="text-sm leading-relaxed">{t("Choose a strong password of at least 8 characters.")}</CardDescription>
      </CardHeader>
      <CardContent className="px-6 sm:px-8">
        <UpdatePasswordForm />
      </CardContent>
    </Card>
  )
}
