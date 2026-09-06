'use client'

import { useMemo, useSyncExternalStore } from 'react'
import { readSavedGuideIds, SAVED_GUIDES_KEY, toggleSavedGuide } from '@/lib/saved-guides'

const listeners = new Set<() => void>()
function subscribe(listener: () => void) {
  listeners.add(listener)
  const onStorage = (event: StorageEvent) => {
    if (event.storageArea === window.sessionStorage && (event.key === SAVED_GUIDES_KEY || event.key === null)) listener()
  }
  window.addEventListener('storage', onStorage)
  return () => { listeners.delete(listener); window.removeEventListener('storage', onStorage) }
}
function snapshot() {
  try { return readSavedGuideIds(window.sessionStorage.getItem(SAVED_GUIDES_KEY)).join(',') } catch { return '' }
}
function serverSnapshot() { return '' }

function write(ids: string[]): string | undefined {
  try {
    if (ids.length) window.sessionStorage.setItem(SAVED_GUIDES_KEY, JSON.stringify(ids))
    else window.sessionStorage.removeItem(SAVED_GUIDES_KEY)
    listeners.forEach((listener) => listener())
  } catch {
    return 'Your browser is blocking saved guides. Allow session storage for this site to use this feature.'
  }
}

export function useSavedGuides() {
  const value = useSyncExternalStore(subscribe, snapshot, serverSnapshot)
  const ids = useMemo(() => value ? value.split(',') : [], [value])
  return { ids, snapshot: value }
}

export function changeSavedGuide(profileId: string): string | undefined {
  const value = snapshot()
  const result = toggleSavedGuide(value ? value.split(',') : [], profileId)
  return result.error ?? write(result.ids)
}

export function removeSavedGuide(profileId: string): string | undefined {
  const value = snapshot()
  return write((value ? value.split(',') : []).filter((id) => id !== profileId))
}

export function clearSavedGuides(): string | undefined { return write([]) }
