export type UserRole = 'seeker' | 'facilitator' | 'admin'
export type ExperienceLevel = 'curious' | 'beginner' | 'experienced'
export type PreferredFormat = 'voice' | 'video' | 'in_person' | 'async'
export type BookingStatus = 'pending' | 'accepted' | 'declined' | 'completed'
export type VerificationStatus = 'pending' | 'approved' | 'rejected'

export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
  created_at: string
  updated_at: string
}

export interface SeekerProfile {
  id: string
  user_id: string
  display_name: string
  location?: string
  intention?: string
  experience_level: ExperienceLevel
  preferred_modalities: string[]
  support_needs?: string
  privacy_preference: 'public' | 'private'
  created_at: string
}

export interface FacilitatorProfile {
  id: string
  user_id: string
  display_name: string
  bio: string
  location?: string
  remote_available: boolean
  modalities: string[]
  years_experience?: number
  lineage_or_training?: string
  certifications?: string[]
  safety_practices?: string
  contraindications_acknowledged: boolean
  donation_based: boolean
  minimum_donation?: number
  hourly_rate?: number
  verification_status: VerificationStatus
  visibility: 'public' | 'unlisted' | 'hidden'
  avatar_url?: string
  created_at: string
  updated_at: string
}

// Shape of public.facilitator_public_profiles (db/migrations/0002, 0003) —
// what anon can actually read: no verification_status, no visibility, no
// updated_at. Used for every unauthenticated read path (search, browse,
// facilitator detail). Do not add verification_status/visibility here —
// if the view doesn't expose it, this type shouldn't claim it exists.
export interface FacilitatorPublicProfile {
  id: string
  user_id: string
  display_name: string
  bio: string
  location?: string
  remote_available: boolean
  modalities: string[]
  years_experience?: number
  lineage_or_training?: string
  certifications?: string[]
  safety_practices?: string
  contraindications_acknowledged: boolean
  donation_based: boolean
  minimum_donation?: number
  hourly_rate?: number
  avatar_url?: string
  created_at: string
}

export interface Modality {
  id: string
  name: string
  category: string
}

export interface BookingRequest {
  id: string
  // Null on anonymous contact submissions (the normal case now — seekers
  // have no accounts). Only set on legacy rows from the old authenticated
  // flow. seeker_name/seeker_email are the anonymous-flow equivalent — see
  // db/migrations/0003.
  seeker_id: string | null
  seeker_name: string | null
  seeker_email: string | null
  facilitator_id: string
  requested_service: string
  message: string
  preferred_format: PreferredFormat
  preferred_time_window?: string | null
  status: BookingStatus
  created_at: string
}

export interface Review {
  id: string
  seeker_id: string
  facilitator_id: string
  rating: number
  text: string
  safety_rating: number
  integration_rating: number
  created_at: string
}

export interface VerificationNote {
  id: string
  facilitator_id: string
  admin_id: string
  status: VerificationStatus
  note?: string
  created_at: string
}

// API response shapes
export interface FacilitatorSearchResult extends FacilitatorPublicProfile {
  avg_rating?: number
  review_count?: number
}

export interface ApiError {
  error: string
  code?: string
}
