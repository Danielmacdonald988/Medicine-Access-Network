# Medicine Access Network — Product Specification

## Vision

A trusted discovery and matching platform for plant medicine-adjacent facilitators, preparation coaches, integration guides, breathwork practitioners, somatic workers, and spiritual support guides.

**This is NOT a drug marketplace.** The platform does not sell, distribute, coordinate, or facilitate illegal substances. It focuses on education, facilitator discovery, safety screening, preparation, integration, reputation, and private booking requests for legal services.

## Core Positioning

> "Airbnb/Zocdoc-style discovery for trusted medicine-adjacent facilitators, with safety, preparation, and integration built in."

## User Roles

### Seeker
- Exploring plant medicine or healing modalities
- Needs: trusted facilitators, safety information, preparation support
- Pain: doesn't know who is safe, experienced, or ethical

### Facilitator (Guide)
- Offers legal services: integration coaching, breathwork, somatic work, preparation, education
- Needs: a legitimate platform, vetted reputation system, private inquiry flow
- NOT: ceremony coordinators, substance providers

### Admin
- Reviews facilitator applications before they go live
- Manages safety compliance and platform integrity

## MVP Feature Set

| Feature | Status |
|---|---|
| User auth (Supabase) | Scaffolded |
| Seeker onboarding | Scaffolded |
| Facilitator onboarding | Scaffolded |
| Facilitator profiles | Scaffolded |
| Search + filter | Scaffolded |
| Booking request flow | Scaffolded |
| Reviews + reputation | Schema only |
| Admin verification | Scaffolded |
| Safety disclaimer system | Implemented |
| Payments (Stripe) | Not yet |
| Messaging | Placeholder |
| Email notifications | Not yet |

## Legal Constraints (Non-Negotiable)

1. No language suggesting illegal substance sale, sourcing, or procurement
2. No allowing users to request specific illegal substances
3. Facilitators are NOT "providers" in a medical sense
4. No medical claims, diagnoses, treatments, or prescriptions
5. Emphasis on preparation, integration, education, and safety
6. All profiles must show visible safety practices and contraindication acknowledgement
7. Admin verification required before public listing
8. Stripe payments for legal services only

## Future Phases

- Phase 2: Stripe Connect for facilitator payouts
- Phase 2: Real-time messaging between seeker and facilitator
- Phase 2: Email notifications for booking status changes
- Phase 3: Facilitator availability calendar
- Phase 3: Group session listings (breathwork circles, integration groups)
- Phase 3: Resource library (curated articles, preparation guides)
- Phase 4: Mobile app (React Native)
