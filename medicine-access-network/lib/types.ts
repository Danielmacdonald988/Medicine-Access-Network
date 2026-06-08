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
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Modality {
  id: string
  name: string
  category: string
}

export interface BookingRequest {
  id: string
  seeker_id: string
  facilitator_id: string
  requested_service: string
  message: string
  preferred_format: PreferredFormat
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
export interface FacilitatorSearchResult extends FacilitatorProfile {
  avg_rating?: number
  review_count?: number
}

export interface ApiError {
  error: string
  code?: string
}
