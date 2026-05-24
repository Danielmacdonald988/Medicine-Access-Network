# Project: Medicine Access Network

## Product Vision
Build a trusted discovery and matching platform for plant medicine facilitators, integration guides, breathwork practitioners, somatic workers, and preparation coaches.

This is NOT a drug marketplace. The platform does not sell, distribute, coordinate, or facilitate illegal substances. It focuses on education, facilitator discovery, safety screening, preparation, integration, reputation, and private booking requests for legal services.

## Target Audience
People who feel called toward plant medicine or related healing modalities but do not know:
- who is safe
- who is experienced
- what preparation is required
- what integration support looks like
- how to avoid predatory or unsafe facilitators

## Core Positioning
"Airbnb/Zocdoc-style discovery for trusted medicine-adjacent facilitators, with safety, preparation, and integration built in."

## Recommended Tech Stack
Frontend:
- Next.js 14+
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Hook Form
- Zod validation

Backend:
- Next.js API routes / server actions
- Supabase for Postgres, Auth, Storage, Row Level Security
- Prisma ORM or Supabase client directly

Payments:
- Stripe for legal services only:
  - preparation session
  - integration session
  - breathwork
  - consultation
  - donation-based support
No payments for substances or ceremonies involving illegal activity.

Auth:
- Supabase Auth
- User roles:
  - seeker
  - facilitator
  - admin

Deployment:
- Vercel
- Supabase hosted Postgres

## MVP Features
1. User authentication
2. Seeker onboarding
3. Facilitator onboarding
4. Facilitator profiles
5. Search and filtering
6. Safety and modality tags
7. Booking request flow
8. Messaging request placeholder
9. Reviews and reputation
10. Admin verification dashboard
11. Legal/safety disclaimer system

## Non-Negotiable Constraints
- Do not use language suggesting illegal substance sale, sourcing, shipping, or procurement.
- Do not allow users to request specific illegal substances.
- Do not call facilitators "providers" in a medical sense.
- Do not make medical claims.
- Do not diagnose, treat, cure, or prescribe.
- Emphasize preparation, integration, education, and safety.
- All facilitator profiles must include visible safety boundaries.
- Admin verification is required before a facilitator appears publicly.

## Core Data Models

### User
- id
- email
- fullName
- role: seeker | facilitator | admin
- createdAt
- updatedAt

### SeekerProfile
- id
- userId
- displayName
- location
- intention
- experienceLevel: curious | beginner | experienced
- preferredModalities
- supportNeeds
- privacyPreference
- createdAt

### FacilitatorProfile
- id
- userId
- displayName
- bio
- location
- remoteAvailable
- modalities
- yearsExperience
- lineageOrTraining
- certifications
- safetyPractices
- contraindicationsAcknowledged
- donationBased
- minimumDonation
- hourlyRate
- verificationStatus: pending | approved | rejected
- createdAt
- updatedAt

### Modality
- id
- name
- category
Examples:
- integration
- preparation
- breathwork
- meditation
- somatic coaching
- kambo education
- psychedelic integration
- recovery support
- spiritual coaching

### BookingRequest
- id
- seekerId
- facilitatorId
- requestedService
- message
- preferredFormat: voice | video | in_person | async
- status: pending | accepted | declined | completed
- createdAt

### Review
- id
- seekerId
- facilitatorId
- rating
- text
- safetyRating
- integrationRating
- createdAt

### VerificationNote
- id
- facilitatorId
- adminId
- status
- note
- createdAt

## Design Direction
Clean, high-trust, grounded, not psychedelic cliché.

Reference feel:
- Airbnb trust
- Zocdoc clarity
- Stripe polish
- Calm app simplicity

Visual identity:
- warm neutrals
- deep green
- charcoal
- off-white
- subtle gradients
- rounded cards
- low-noise UI
