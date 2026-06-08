export const APP_NAME = 'Medicine Access Network'
export const APP_TAGLINE = 'Find trusted guides for your healing journey'

export const MODALITY_CATEGORIES = {
  preparation: 'Preparation',
  integration: 'Integration',
  breathwork: 'Breathwork',
  somatic: 'Somatic & Body Work',
  meditation: 'Meditation & Mindfulness',
  spiritual: 'Spiritual Support',
  recovery: 'Recovery Support',
  education: 'Education',
} as const

export const MODALITIES = [
  { id: 'integration-coaching', name: 'Integration Coaching', category: 'integration' },
  { id: 'preparation-coaching', name: 'Preparation Coaching', category: 'preparation' },
  { id: 'breathwork', name: 'Breathwork', category: 'breathwork' },
  { id: 'holotropic-breathwork', name: 'Holotropic Breathwork', category: 'breathwork' },
  { id: 'somatic-coaching', name: 'Somatic Coaching', category: 'somatic' },
  { id: 'somatic-therapy', name: 'Somatic Experiencing', category: 'somatic' },
  { id: 'meditation-guidance', name: 'Meditation Guidance', category: 'meditation' },
  { id: 'mindfulness-coaching', name: 'Mindfulness Coaching', category: 'meditation' },
  { id: 'spiritual-coaching', name: 'Spiritual Coaching', category: 'spiritual' },
  { id: 'psychedelic-integration', name: 'Psychedelic Integration', category: 'integration' },
  { id: 'kambo-education', name: 'Kambo Education', category: 'education' },
  { id: 'recovery-support', name: 'Recovery Support', category: 'recovery' },
  { id: 'harm-reduction', name: 'Harm Reduction Education', category: 'education' },
  { id: 'ceremony-preparation', name: 'Ceremony Preparation', category: 'preparation' },
] as const

export const EXPERIENCE_LEVELS = [
  {
    value: 'curious',
    label: 'Curious',
    description: "I'm exploring this space for the first time and want to learn safely.",
  },
  {
    value: 'beginner',
    label: 'Beginner',
    description: "I've had limited experience and am looking for structured support.",
  },
  {
    value: 'experienced',
    label: 'Experienced',
    description: "I'm familiar with the work and need targeted integration or coaching.",
  },
] as const

export const SUPPORT_NEEDS = [
  {
    id: 'preparation',
    label: 'Preparation',
    description: 'Getting ready intentionally and safely before a healing experience.',
  },
  {
    id: 'integration',
    label: 'Integration',
    description: 'Processing insights and grounding change after an experience.',
  },
  {
    id: 'breathwork',
    label: 'Breathwork',
    description: 'Conscious breathing practices for healing and self-discovery.',
  },
  {
    id: 'somatic-support',
    label: 'Somatic support',
    description: 'Body-based approaches to processing emotions and stored tension.',
  },
  {
    id: 'recovery-adjacent',
    label: 'Recovery-adjacent support',
    description: 'Plant medicine and healing within a recovery-informed context.',
  },
  {
    id: 'spiritual-guidance',
    label: 'Spiritual guidance',
    description: 'Meaning-making, spiritual direction, and connection to practice.',
  },
  {
    id: 'education',
    label: 'Education',
    description: 'Harm reduction, safety information, and learning before acting.',
  },
] as const

export const PREFERRED_FORMATS = [
  { value: 'video', label: 'Video call' },
  { value: 'voice', label: 'Voice call' },
  { value: 'in_person', label: 'In-person session' },
  { value: 'async', label: 'Async / messaging' },
] as const

export const SAFETY_DISCLAIMER =
  'Medicine Access Network does not sell, distribute, or coordinate access to controlled substances. ' +
  'All services listed are legal support services including education, preparation coaching, integration guidance, ' +
  'breathwork, and somatic work. Nothing on this platform constitutes medical advice, diagnosis, or treatment. ' +
  'Always consult a licensed healthcare provider for medical concerns.'

export const LEGAL_SERVICES_NOTE =
  'All payments on this platform are for legal services only: preparation coaching, integration sessions, ' +
  'breathwork, consultation, and educational support.'

export const VERIFICATION_REQUIRED_NOTE =
  'All facilitators are reviewed by our admin team before appearing publicly. ' +
  'Verification does not imply endorsement or guarantee of outcomes.'
