'use client'

import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import Image from 'next/image'
import { ImagePlus, LoaderCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  isProfileImagePath,
  profileImageUrl,
  MAX_PROFILE_IMAGES,
  MAX_PROFILE_IMAGE_BYTES,
  PROFILE_IMAGE_TYPES,
} from '@/lib/profile-media'

type ProfileMediaFieldsProps = {
  value: string[]
  onChange: (paths: string[]) => void
  onBusyChange: (busy: boolean) => void
  error?: string
  disabled?: boolean
}

class UploadError extends Error {}

export function ProfileMediaFields({
  value,
  onChange,
  onBusyChange,
  error,
  disabled = false,
}: ProfileMediaFieldsProps) {
  const [busy, setBusy] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [status, setStatus] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)
  const activeUpload = useRef<AbortController | null>(null)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      activeUpload.current?.abort()
    }
  }, [])

  async function uploadImages(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? [])
    event.currentTarget.value = ''
    if (busy || disabled || files.length === 0) return
    setUploadError('')
    setStatus('')
    if (files.length + value.length > MAX_PROFILE_IMAGES) {
      setUploadError(`You can add up to ${MAX_PROFILE_IMAGES} photos. Remove a photo before adding more.`)
      return
    }
    if (files.some((file) => !(PROFILE_IMAGE_TYPES as readonly string[]).includes(file.type))) {
      setUploadError('Choose JPG, PNG, or WebP photos. Other file types are not supported.')
      return
    }
    if (files.some((file) => file.size === 0 || file.size > MAX_PROFILE_IMAGE_BYTES)) {
      setUploadError('Each photo must be 4 MB or less and must not be empty.')
      return
    }

    setBusy(true)
    onBusyChange(true)
    const nextPaths = [...value]
    try {
      for (let index = 0; index < files.length; index += 1) {
        if (!mounted.current) return
        setStatus(`Uploading photo ${index + 1} of ${files.length}…`)
        const controller = new AbortController()
        activeUpload.current = controller
        const timeout = setTimeout(() => controller.abort(), 30_000)
        try {
          const file = files[index]
          const response = await fetch('/api/profile-images', {
            method: 'POST',
            headers: { 'Content-Type': file.type },
            body: file,
            signal: controller.signal,
          })
          if (response.status === 401) {
            throw new UploadError('Your sign-in has expired. Sign in again before uploading photos.')
          }
          if (response.status === 429) {
            throw new UploadError('You have reached the upload limit for now. Please try again later.')
          }
          if (response.status === 413) {
            throw new UploadError('This photo is too large. Choose a JPG, PNG, or WebP photo up to 4 MB.')
          }
          if (response.status === 400 || response.status === 415 || response.status === 422) {
            throw new UploadError('This photo could not be processed. Choose a non-animated JPG, PNG, or WebP image under 20 megapixels.')
          }
          if (!response.ok) throw new UploadError('The photo could not be uploaded. Please try again.')
          const result: unknown = await response.json()
          if (!mounted.current) return
          if (
            typeof result !== 'object' || result === null || !('path' in result) ||
            typeof result.path !== 'string' || !isProfileImagePath(result.path)
          ) {
            throw new UploadError('The upload could not be confirmed. Please try again.')
          }
          nextPaths.push(result.path)
          onChange([...nextPaths])
        } finally {
          clearTimeout(timeout)
          activeUpload.current = null
        }
      }
      setStatus(`${files.length === 1 ? 'Photo' : 'Photos'} uploaded. Submit your profile to save these changes.`)
    } catch (cause) {
      if (!mounted.current) return
      setStatus('')
      const message = cause instanceof UploadError
        ? cause.message
        : 'The upload did not finish. Check your connection and try again.'
      setUploadError(message)
    } finally {
      if (mounted.current) {
        setBusy(false)
        onBusyChange(false)
      }
    }
  }

  return (
    <div className="space-y-5" aria-busy={busy}>
      <div className="space-y-2">
        <Label htmlFor="profile-photos">Profile photos (at least one required)</Label>
        <p id="profile-photo-help" className="text-sm leading-relaxed text-stone-600">
          Add one to five photos. Your first photo appears in search results. Use a clear
          photo of yourself, then add other images that help people understand your practice.
          Only upload images you have permission to share publicly.
        </p>
        <p className="text-xs text-stone-500">Portrait selfies and landscape photos keep their full frame. No need to crop them into a square.</p>
        <p className="text-xs text-stone-500">JPG, PNG, or WebP. Up to 4 MB per photo. Still images under 20 megapixels.</p>
        <p className="text-xs text-stone-500">
          New uploads are visible to you and reviewers. Photos on your approved public profile are displayed publicly.
        </p>
        <input
          ref={fileInput}
          id="profile-photos"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={uploadImages}
          disabled={disabled || busy || value.length >= MAX_PROFILE_IMAGES}
          aria-describedby={`profile-photo-help${error || uploadError ? ' profile-photo-error' : ''}`}
          aria-invalid={Boolean(error || uploadError)}
          className="block w-full rounded-lg border border-stone-300 p-3 text-sm text-stone-600 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:font-medium file:text-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:opacity-60"
        />
      </div>

      {value.length > 0 && (
        <ol className="grid grid-cols-1 gap-4 min-[400px]:grid-cols-2">
          {value.map((path, index) => {
            const imageUrl = profileImageUrl(path)
            return (
              <li key={path} className="overflow-hidden rounded-xl border border-stone-200 bg-white">
                <div className="relative aspect-[4/3] bg-stone-100">
                  {imageUrl && (
                    <Image
                      src={imageUrl}
                      alt={`Your uploaded profile photo ${index + 1}`}
                      fill
                      unoptimized
                      sizes="(max-width: 640px) 90vw, 300px"
                      className="object-contain p-2"
                    />
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 p-3">
                  {index === 0 && (
                    <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800">
                      Primary photo
                    </span>
                  )}
                  {index > 0 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={disabled || busy}
                      aria-label={`Make photo ${index + 1} primary`}
                      onClick={() => {
                        onChange([path, ...value.filter((item) => item !== path)])
                        setStatus(`Photo ${index + 1} is now your primary photo. Submit your profile to save.`)
                      }}
                    >
                      Make primary
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-stone-600"
                    disabled={disabled || busy}
                    aria-label={`Remove photo ${index + 1}`}
                      onClick={() => {
                        onChange(value.filter((item) => item !== path))
                        setUploadError('')
                        setStatus('Photo removed from this draft. Submit your profile to save.')
                        requestAnimationFrame(() => fileInput.current?.focus())
                        // Only unattached uploads are removable; saved photos are
                        // retained by the server until the profile update succeeds.
                        void fetch('/api/profile-images', {
                          method: 'DELETE',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ path }),
                        }).catch(() => undefined)
                      }}
                  >
                    Remove
                  </Button>
                </div>
              </li>
            )
          })}
        </ol>
      )}

      {value.length === 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-stone-300 p-5 text-sm text-stone-500">
          <ImagePlus className="size-6 shrink-0" aria-hidden="true" />
          No photos added yet.
        </div>
      )}
      <p className="text-xs text-stone-500">{value.length} of {MAX_PROFILE_IMAGES} photos added</p>
      <div role="status" className="flex items-center gap-2 text-sm text-emerald-800">
        {busy && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
        {status}
      </div>
      {(uploadError || error) && (
        <p id="profile-photo-error" role="alert" className="text-sm text-red-700">
          {uploadError || error}
        </p>
      )}
    </div>
  )
}
