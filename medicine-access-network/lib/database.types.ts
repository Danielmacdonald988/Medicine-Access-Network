// Auto-generate this file with: npx supabase gen types typescript --local
// This is a hand-authored placeholder until Supabase CLI is configured.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          role: 'seeker' | 'facilitator' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      seeker_profiles: {
        Row: {
          id: string
          user_id: string
          display_name: string
          location: string | null
          intention: string | null
          experience_level: 'curious' | 'beginner' | 'experienced'
          preferred_modalities: string[]
          support_needs: string | null
          privacy_preference: 'public' | 'private'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['seeker_profiles']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['seeker_profiles']['Insert']>
      }
      facilitator_profiles: {
        Row: {
          id: string
          user_id: string
          display_name: string
          bio: string
          location: string | null
          remote_available: boolean
          modalities: string[]
          years_experience: number | null
          lineage_or_training: string | null
          certifications: string[] | null
          safety_practices: string | null
          contraindications_acknowledged: boolean
          donation_based: boolean
          minimum_donation: number | null
          hourly_rate: number | null
          verification_status: 'pending' | 'approved' | 'rejected'
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<
          Database['public']['Tables']['facilitator_profiles']['Row'],
          'id' | 'created_at' | 'updated_at'
        >
        Update: Partial<Database['public']['Tables']['facilitator_profiles']['Insert']>
      }
      booking_requests: {
        Row: {
          id: string
          seeker_id: string
          facilitator_id: string
          requested_service: string
          message: string
          preferred_format: 'voice' | 'video' | 'in_person' | 'async'
          status: 'pending' | 'accepted' | 'declined' | 'completed'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['booking_requests']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['booking_requests']['Insert']>
      }
      reviews: {
        Row: {
          id: string
          seeker_id: string
          facilitator_id: string
          rating: number
          text: string
          safety_rating: number
          integration_rating: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['reviews']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['reviews']['Insert']>
      }
      verification_notes: {
        Row: {
          id: string
          facilitator_id: string
          admin_id: string
          status: 'pending' | 'approved' | 'rejected'
          note: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['verification_notes']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['verification_notes']['Insert']>
      }
      modalities: {
        Row: {
          id: string
          name: string
          category: string
        }
        Insert: Omit<Database['public']['Tables']['modalities']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['modalities']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      user_role: 'seeker' | 'facilitator' | 'admin'
      experience_level: 'curious' | 'beginner' | 'experienced'
      verification_status: 'pending' | 'approved' | 'rejected'
      booking_status: 'pending' | 'accepted' | 'declined' | 'completed'
      preferred_format: 'voice' | 'video' | 'in_person' | 'async'
    }
  }
}
