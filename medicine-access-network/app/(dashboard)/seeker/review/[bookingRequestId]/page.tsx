import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { requireRole } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabaseServer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ReviewForm } from '@/components/forms/ReviewForm'

export const metadata: Metadata = { title: 'Leave a review' }

interface PageProps {
  params: Promise<{ bookingRequestId: string }>
}

export default async function LeaveReviewPage({ params }: PageProps) {
  const { bookingRequestId } = await params
  const user = await requireRole('seeker')
  const supabase = await createServerSupabaseClient()

  // Fetch the booking request — must be completed and belong to this seeker.
  const { data: bookingRequest } = await supabase
    .from('booking_requests')
    .select('id, status, seeker_id, facilitator_id, requested_service')
    .eq('id', bookingRequestId)
    .eq('seeker_id', user.id)
    .eq('status', 'completed')
    .single()

  if (!bookingRequest) notFound()

  // Check if already reviewed.
  const { data: existing } = await supabase
    .from('reviews')
    .select('id')
    .eq('booking_request_id', bookingRequestId)
    .maybeSingle()

  if (existing) redirect('/seeker')

  // Get facilitator display name.
  const { data: facilitatorProfile } = await supabase
    .from('facilitator_profiles')
    .select('display_name')
    .eq('user_id', bookingRequest.facilitator_id)
    .single()

  const facilitatorName = facilitatorProfile?.display_name ?? 'your guide'

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <Link
          href="/seeker"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800"
        >
          <ArrowLeft className="size-3.5" />
          Back to dashboard
        </Link>
        <h1 className="text-2xl font-bold text-stone-900">Leave a review</h1>
        <p className="mt-1 text-sm text-stone-500">
          {bookingRequest.requested_service} with {facilitatorName}
        </p>
      </div>

      <Card className="border-stone-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{facilitatorName}</CardTitle>
        </CardHeader>
        <CardContent>
          <ReviewForm
            bookingRequestId={bookingRequestId}
            facilitatorName={facilitatorName}
          />
        </CardContent>
      </Card>
    </div>
  )
}
