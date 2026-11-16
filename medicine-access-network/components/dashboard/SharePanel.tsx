import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { BADGE_HEIGHT, BADGE_PATH, BADGE_WIDTH, badgeEmbedCode, profileUrl, storyImagePath, suggestedCaption } from '@/lib/share-kit'

const linkStyle = 'inline-flex min-h-11 items-center font-medium text-emerald-800 underline underline-offset-4'
const fieldStyle = 'mt-2 w-full resize-none rounded-lg border border-stone-200 bg-stone-50 p-3 font-mono text-xs text-stone-700'

// Shown only for approved profiles: everything here points at the public listing.
export function SharePanel({ profileId }: { profileId: string }) {
  const url = profileUrl(profileId)
  return (
    <Card lang="en" className="border-emerald-200">
      <CardContent className="space-y-5 p-5">
        <div>
          <h2 className="text-lg font-semibold text-stone-900">Share your profile</h2>
          <p className="mt-1 text-sm text-stone-600">People who already follow you are the most likely to reach out. These use only what is on your public profile.</p>
        </div>

        <section aria-labelledby="share-story" className="space-y-2">
          <h3 id="share-story" className="font-medium text-stone-900">Instagram story</h3>
          <p className="text-sm text-stone-600">Save the image, post it as a story, and add a link sticker with your profile address.</p>
          <a href={storyImagePath(profileId)} download="facilitator-network-story.png" className={linkStyle}>Download story image</a>
          <label className="block text-sm text-stone-700">Profile address for the link sticker
            <textarea readOnly rows={1} className={fieldStyle} value={url} />
          </label>
          <label className="block text-sm text-stone-700">Suggested caption
            <textarea readOnly rows={3} className={fieldStyle} value={suggestedCaption(profileId)} />
          </label>
        </section>

        <section aria-labelledby="share-badge" className="space-y-2">
          <h3 id="share-badge" className="font-medium text-stone-900">Website badge</h3>
          <p className="text-sm text-stone-600">Add this to your website so visitors can find your profile. Paste the code where you want the badge to appear.</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={BADGE_PATH} alt="Listed on The Facilitator Network" width={BADGE_WIDTH} height={BADGE_HEIGHT} />
          <label className="block text-sm text-stone-700">Badge code
            <textarea readOnly rows={3} className={fieldStyle} value={badgeEmbedCode(profileId)} />
          </label>
        </section>

        <Link href={`/facilitators/${profileId}`} className={linkStyle}>View your public profile</Link>
      </CardContent>
    </Card>
  )
}
