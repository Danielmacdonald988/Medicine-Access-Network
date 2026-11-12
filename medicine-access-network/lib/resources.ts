// ─── Content types ────────────────────────────────────────────────────────────

export type Block =
  | { type: 'p'; text: string; links?: { label: string; href: string }[] }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'h3'; text: string; id?: string }
  | { type: 'callout'; variant: 'warning' | 'info' | 'emergency'; text: string }

export interface Resource {
  slug: string
  title: string
  subtitle: string
  description: string // for <meta>
  blocks: Block[]
  searchTitle?: string
  nextStep?: { label: string; href: string; description: string }
  relatedSlugs?: string[]
  sourceCheck?: {
    date: string
    scope: string
    sources: { title: string; url: string }[]
  }
}

// ─── Articles ─────────────────────────────────────────────────────────────────

export const resources: Resource[] = [
  {
    slug: 'preparation-basics',
    title: 'Preparation Basics',
    searchTitle: 'Preparing for a Guide Conversation: Questions and Boundaries',
    nextStep: { label: 'Explore support profiles', href: '/facilitators', description: 'Compare the services guides list, then ask about their approach, fees, boundaries and whether they can work with you where you live. You can browse without an account; an inquiry does not book or pay for a session.' },
    relatedSlugs: ['questions-to-ask', 'scope-of-practice', 'red-flags'],
    subtitle: 'What to consider before working with a guide',
    description:
      'A grounded overview of how to prepare before working with an integration coach, breathwork facilitator, or other guide.',
    blocks: [
      {
        type: 'p',
        text: 'Working with a guide — whether for breathwork, integration coaching, somatic work, or preparation support — tends to go better when you arrive with some clarity about where you are and what you\'re hoping to explore. Preparation is not about having the right answers. It is about slowing down enough to ask honest questions.',
      },
      {
        type: 'callout',
        variant: 'info',
        text: 'Nothing here is medical advice. If you have a health condition, psychiatric history, or take any medications, consult your doctor before pursuing any wellness or coaching work.',
      },
      {
        type: 'h3',
        text: 'Get clear on your intention',
      },
      {
        type: 'p',
        text: 'An intention is not a goal or an expectation — it is a direction. Before reaching out to a guide, take time to sit with questions like: What has brought me here? What am I carrying that I would like to understand better? What kind of support do I actually need right now?',
      },
      {
        type: 'p',
        text: 'Writing these down — even roughly — helps you communicate more clearly with a guide, and helps you assess whether their particular focus is a genuine fit.',
      },
      {
        type: 'h3',
        text: 'Understand what the guide does and does not offer',
      },
      {
        type: 'p',
        text: 'Listings on this platform describe coaching, preparation support, integration conversations, and related wellness services. A listing does not establish a professional license or a clinical care relationship. Ask what capacity the guide is working in, check any claimed license with its issuing body, and confirm that the service matches your needs.',
      },
      {
        type: 'p',
        text: 'If you are processing trauma, experiencing active mental health symptoms, or in crisis, a licensed therapist or counsellor is the appropriate first step — not a coach or guide.',
      },
      {
        type: 'h3',
        text: 'Review your health and medication history',
      },
      {
        type: 'p',
        text: 'If you have health or medication questions about a practice you are considering, discuss the specific practice with your doctor or prescribing clinician. An introductory message through this platform is not a health assessment or a confidential clinical intake.',
      },
      {
        type: 'ul',
        items: [
          'Keep your first message to the support you are seeking, your preferred format, and practical questions',
          'Leave diagnoses, medication lists, trauma details, and substance use history out of the platform contact form',
          'Ask who conducts any necessary screening, what their qualifications are, and how they protect intake information',
          'Share relevant health information honestly with the appropriately qualified professional through an agreed confidential intake process',
        ],
      },
      {
        type: 'h3',
        text: 'Build a support structure',
      },
      {
        type: 'p',
        text: 'Good preparation includes knowing who you can turn to before, during, and after any intensive work. This might be a therapist, a trusted friend, a partner, or a family member. Doing deep personal work in isolation — without anyone who knows what you are exploring — increases risk.',
      },
      {
        type: 'h3',
        text: 'Practical logistics',
      },
      {
        type: 'ul',
        items: [
          'Clear your schedule for recovery time after any session',
          'Avoid making major life decisions immediately following intensive work',
          'Have water, nourishing food, and a calm space available',
          'Know your crisis resources in advance (see Get Urgent Help in the safety library)',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'This platform does not coordinate, facilitate, source, or have any involvement in the use of controlled substances. Guides must offer only lawful support within their qualifications. A listing does not verify service legality; confirm the proposed service and the requirements where you live.',
      },
    ],
  },

  {
    slug: 'integration-basics',
    title: 'Integration Basics',
    searchTitle: 'Psychedelic Integration: What Support Can and Cannot Offer',
    nextStep: { label: 'Find integration support', href: '/integration-support', description: 'Compare guides who list integration conversations. Read their approach, ask about fit and fees, and confirm availability directly. No account is needed to browse or send an inquiry.' },
    relatedSlugs: ['questions-to-ask', 'scope-of-practice', 'integration-circles-vs-individual'],
    subtitle: 'Understanding reflection and support after a psychedelic or other significant experience',
    description:
      'Understand integration conversations, what to ask a guide, and how to compare scope, fees, format and boundaries before reaching out.',
    blocks: [
      { type: 'h3', text: 'Looking for integration support?' },
      { type: 'p', text: 'This guide is for adults considering a conversation about a significant personal experience. You do not need to share a detailed history to explore your options. Start by deciding what you want from a conversation: time to reflect, questions to explore, or help turning an intention into an everyday practice.' },
      { type: 'h3', text: 'Psychedelic integration does not mean another psychedelic session' },
      { type: 'p', text: 'People may seek integration conversations after a psychedelic experience, breathwork, a spiritual experience or another significant event. The focus here is reflection and everyday life, not obtaining or taking a substance. TFN does not sell, source, administer or arrange access to controlled substances. A listing does not establish that a particular service is permitted in every location.' },
      { type: 'h3', text: 'What a first conversation can cover' },
      { type: 'p', text: 'Ask the guide how they structure a first session rather than assuming a standard method. You might agree on what you want to discuss, which topics you prefer to leave aside and one practical next step. You can decline an interpretation or exercise. Before sharing sensitive history, ask about their role, privacy arrangements and whether a different kind of professional support would be more appropriate.' },
      { type: 'h3', text: 'What to ask before a first conversation' },
      { type: 'ul', items: [
        'What does an integration conversation with you involve, and what is outside your role?',
        'What training supports this particular service, and how can I check it?',
        'Can we agree on the topics and practices in advance, and can I pause or decline?',
        'What is the total fee, session length, cancellation policy and approach to confidentiality?',
        'Can you work with me where I live, online or in person, and what time zone should we use?',
      ] },
      { type: 'p', text: 'Guides choose their own service labels. An integration listing is not proof of clinical qualifications or a promise of a particular result. Confirm what the individual offers; a first inquiry does not book a session.' },

      { type: 'h3', id: 'online-integration-readiness', text: 'Before booking online integration support' },
      { type: 'p', text: 'An online listing describes a possible format, not worldwide availability. Before agreeing to a remote conversation, confirm the exact service and the practical arrangements. These checks do not establish suitability or guarantee an outcome.' },
      { type: 'ul', items: [
        'Confirm session location and role. Tell the guide the state or country where you will physically be during the appointment, including if you will be traveling. Ask where they will be and whether they may offer this specific service in those locations. For US clinical care, check the relevant licensing authority; cross-state rules vary. Do not assume the same rules apply to every nonclinical service.',
        'Ask about recording and notes. Will anyone record, transcribe or use an AI note-taking tool? Ask who can access the information, how long it is retained, and whether you can decline recording or choose another arrangement. A promise of confidentiality does not answer all of these questions.',
        'Plan for privacy and access. Choose a space where others cannot overhear or see your screen, and consider headphones. Ask in advance about captions, interpretation or other accommodations. Confirm the joining link, time zone and a backup plan if the connection drops; test your device before the appointment.',
        'Get the practical terms in writing. Confirm session length, total fee and currency, cancellation terms and whether there is an ongoing commitment. You can ask for clarification or decide not to proceed.',
      ] },
      { type: 'p', text: 'A simple first message: “I am considering an online integration conversation. Can you confirm the service you offer, eligible locations, session length, total fee and cancellation terms? Please also explain your recording or note-taking practices and available accessibility options.” Keep diagnoses, medication lists, trauma details and substance use history out of an introductory platform message. Ask about a suitable private intake process if one is needed.' },
      { type: 'p', text: 'Sources for this online-readiness section checked November 8, 2026: US Department of Health and Human Services guidance on clinical cross-state practice, appointment preparation and privacy precautions. These sources describe healthcare settings; citing them does not mean TFN or every listed guide is a healthcare provider or covered by HIPAA.', links: [
        { label: 'HHS: cross-state clinical licensing', href: 'https://telehealth.hhs.gov/licensure/licensing-across-state-lines' },
        { label: 'HHS: preparing for a telehealth visit', href: 'https://telehealth.hhs.gov/patients/what-should-i-know-before-my-telehealth-visit' },
        { label: 'HHS: privacy and security tips', href: 'https://www.hhs.gov/hipaa/for-professionals/privacy/guidance/telehealth-privacy-security/index.html' },
      ] },

      {
        type: 'p',
        text: 'Integration is the ongoing process of making sense of an experience and weaving what you have learned into your daily life. It is not a single conversation or a checklist — it is a slow, often nonlinear process of reflection, embodiment, and change.',
      },
      {
        type: 'p',
        text: 'The word "integration" is used across many contexts — therapy, coaching, breathwork, somatic work, and beyond. What unites them is the recognition that experiences — whether joyful, difficult, expansive, or disorienting — take time to settle.',
      },
      {
        type: 'h3',
        text: 'Why integration matters',
      },
      {
        type: 'p',
        text: 'After a meaningful experience, you may want time to reflect on what it means to you. A conversation is one option, not a requirement, and does not guarantee lasting insights. You can choose whether to seek support, and an integration service cannot promise a particular outcome.',
      },
      {
        type: 'p',
        text: 'Integration coaching exists to help you bring language to what arose, identify patterns, and work out what, if anything, you want to change. It is not about fixing you — it is about giving your experience room to land.',
      },
      {
        type: 'h3',
        text: 'Common integration practices',
      },
      {
        type: 'ul',
        items: [
          'Journalling — writing freely without editing, allowing thoughts and feelings to surface',
          'Talking with a trusted person — a friend, therapist, or integration guide',
          'Spending time in nature, movement, or quiet rest',
          'Creative expression — drawing, music, or other non-verbal forms',
          'Somatic practices — breathwork, body scan, yoga, or gentle movement',
          'Reducing stimulation — limiting alcohol, screens, and social obligations',
          'Returning to therapy if difficult material has surfaced',
        ],
      },
      {
        type: 'h3',
        text: 'How long does integration take?',
      },
      {
        type: 'p',
        text: 'There is no universal timeline. Some people feel shifts within days; others are still working with material months later. A meaningful experience does not have a fixed integration window. What matters is that you stay attentive to what is arising and have support available.',
      },
      {
        type: 'h3',
        text: 'When to seek additional support',
      },
      {
        type: 'p',
        text: 'Integration coaching is not a substitute for mental health care. If you are experiencing persistent distress, dissociation, intrusive thoughts, or any symptoms that interfere with daily functioning, please reach out to a licensed therapist or your doctor.',
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'In the US, call or text 988 for emotional distress or suicidal crisis, 24/7. For immediate danger or a medical emergency, call 911. Fireside Project offers non-clinical psychedelic peer support at 623-473-7433, daily from 11 a.m. to 11 p.m. Pacific; it is not an emergency or suicide hotline.',
      },
      {
        type: 'h3',
        text: 'What an integration guide can offer',
      },
      {
        type: 'ul',
        items: [
          'A listening, non-judgemental space to talk through what arose',
          'Help identifying themes, patterns, and questions worth sitting with',
          'Practical suggestions for grounding and self-care',
          'Accountability for any intentions or changes you want to explore',
          'Referrals to therapists or other providers if needed',
        ],
      },
      {
        type: 'callout',
        variant: 'info',
        text: 'Integration coaching is not a substitute for clinical care. A coach may hold a separate professional license, but the title alone does not establish clinical qualifications. Confirm the service being offered and independently check any claimed license. For clinical support, contact an appropriately licensed healthcare professional.',
      },
    ],
    sourceCheck: {
      date: '2026-09-06',
      scope: 'Support-line numbers, hours, and service scope checked against the providers below.',
      sources: [
        { title: '988 Suicide & Crisis Lifeline', url: 'https://988lifeline.org/' },
        { title: 'Fireside Project: Psychedelic Support Line', url: 'https://firesideproject.org/support-line' },
      ],
    },
  },

  {
    slug: 'questions-to-ask',
    title: 'Questions to Ask a Facilitator',
    searchTitle: 'How to Choose a Facilitator: Questions, Fees and Boundaries',
    nextStep: { label: 'Compare facilitator profiles', href: '/facilitators', description: 'Use these questions alongside each profile. Compare listed services, location, format and fees, then ask a guide about the details that matter to you. Browsing and sending an inquiry do not require an account or payment.' },
    relatedSlugs: ['red-flags', 'scope-of-practice'],
    subtitle: 'How to vet a guide before committing',
    description:
      'A practical list of questions to ask any integration coach, guide, or facilitator before working with them — covering background, safety, scope, and logistics.',
    sourceCheck: {
      date: '2026-11-08',
      scope: 'TFN checked the official Oregon sources for the credential-checking example in this guide. This is a source check, not a clinical or legal review, and does not verify individual providers. Rules can change; consult the issuing authority for current information.',
      sources: [
        { title: 'OHA: OPS Licensee Directory and its limits', url: 'https://www.oregon.gov/oha/PH/PREVENTIONWELLNESS/Pages/Psilocybin-Licensee-Directory.aspx' },
        { title: 'OHA: Search License and Worker Permit Status', url: 'https://www.oregon.gov/oha/PH/PREVENTIONWELLNESS/Pages/Psilocybin-Licensee-Status.aspx' },
        { title: 'OHA: Facilitator Scope of Practice (PDF)', url: 'https://www.oregon.gov/oha/PH/PREVENTIONWELLNESS/Documents/Facilitator-Scope-of-Practice-Fact-Sheet.pdf' },
      ],
    },
    blocks: [
      { type: 'h3', text: 'Start with the support you want' },
      { type: 'p', text: 'For adults comparing guides, a useful starting point is the service itself: integration conversations, spiritual support, meditation, preparation education or somatic practices. These labels describe different offerings, not interchangeable qualifications. Read each profile and ask what the guide actually does.' },
      { type: 'h3', text: 'A simple comparison process' },
      { type: 'ol', items: [
        'Choose a type of support and any practical preferences, such as location or online sessions.',
        'Compare a few profiles. Treat practice years and service selections as self-reported, and verify any claimed credentials independently.',
        'Ask about scope, consent, privacy, total cost and cancellation terms before agreeing to work together.',
        'Take time to decide. You can ask more questions, choose another guide, or decide not to proceed.',
      ] },
      { type: 'h3', text: 'Confirm what the profile cannot tell you' },
      { type: 'ul', items: [
        'Does your listed location describe where you are based or where you can offer this service? Can you work with me in my location?',
        'Are you currently taking inquiries, when might you respond, and which session formats do you actually offer?',
        'What is included in the quoted price, what is the session length, and are there additional costs or cancellation charges?',
        'Which training or license are you claiming for this particular service, and where can I verify it?',
        'How would we agree on consent, touch or other practices, and how can I pause or withdraw without pressure?',
        'If private intake is necessary, who sees it, how is it stored and what are the limits of confidentiality?',
      ] },
      { type: 'h3', text: 'How to check a claimed credential' },
      { type: 'ol', items: [
        'Ask for the exact credential or license name, issuing organization, license number (if applicable), and the state or country that issued it. A training certificate and a professional license are different claims.',
        'Use the issuing authority’s official register or status lookup. Match the person and license type, check the current status and any restrictions shown, and note when you checked. If there is no public lookup or the result is unclear, ask the issuing body how to verify the claim.',
        'Confirm the role they would use for this specific service and where both of you would be located, including for online sessions. Check the relevant authority’s current scope rules; one credential does not establish permission for every service or location.',
        'Keep unanswered questions unresolved rather than treating a directory badge, certificate image, testimonial or missing search result as proof. You can wait for clarification or decide not to proceed.',
      ] },
      { type: 'p', text: 'TFN’s application review and publication process is not independent credential verification or a clinical endorsement. Checking a credential also does not guarantee safety, suitability or outcomes.' },
      { type: 'h3', text: 'Oregon example: directory listing is not license verification' },
      { type: 'p', text: 'Oregon Health Authority says its Oregon Psilocybin Services (OPS) Licensee Directory is optional and incomplete, and is not a license-verification tool. Someone missing from it may still be licensed. To check an OPS license, use the official Search License Status page linked below with the license number and license type.' },
      { type: 'p', text: 'For scope questions, consult OHA’s current Facilitator Scope of Practice fact sheet below. It distinguishes preparation and integration from administration, including rules for people who hold another professional license. This Oregon example does not establish permission in another jurisdiction or verify any TFN profile. TFN does not arrange controlled-substance services.' },
      { type: 'p', text: 'OHA notes that its lookup tools may be unavailable outside the United States. If access or a result is unclear, use the assistance contact on OHA’s official page rather than assuming a license is valid or invalid.' },
      { type: 'h3', text: 'Keep the first message simple' },
      { type: 'p', text: 'For example: “I am exploring the support listed on your profile. Could you explain your approach, session format, fees and current availability?” Keep diagnoses, medication lists, trauma histories and other sensitive details out of an introductory platform message. An inquiry is a conversation starter, not a booking or payment.' },

      {
        type: 'p',
        text: 'Choosing a guide is a significant decision. A good guide will welcome your questions — and the quality of their answers will tell you as much as the answers themselves. If someone is dismissive, evasive, or pressures you not to ask, treat that as a signal.',
      },
      {
        type: 'h3',
        text: 'About their background and training',
      },
      {
        type: 'ul',
        items: [
          'What training, certifications, or programmes have you completed?',
          'How long have you been working in this capacity?',
          'What is your primary area of focus or expertise?',
          'Do you work under any supervision or peer consultation?',
          'What ongoing professional development do you pursue?',
        ],
      },
      {
        type: 'p',
        text: 'There is no single credential that guarantees safety or quality in this space. What matters is that the person can speak clearly and honestly about their background, that it is verifiable, and that it matches what they are offering.',
      },
      {
        type: 'h3',
        text: 'About safety and boundaries',
      },
      {
        type: 'ul',
        items: [
          'What is your intake and screening process?',
          'What contraindications would lead you to decline working with someone?',
          'How do you handle a situation where a client becomes distressed or dysregulated?',
          'What are your ethical boundaries around the client relationship?',
          'Do you maintain confidentiality? Are there exceptions?',
          'What happens if something goes wrong — who do you contact?',
        ],
      },
      {
        type: 'h3',
        text: 'About scope of practice',
      },
      {
        type: 'ul',
        items: [
          'What do you offer, and what falls outside what you offer?',
          'Are you a licensed therapist, counsellor, or medical provider?',
          'If something arises that is beyond your scope, how do you handle that?',
          'Do you have referral relationships with therapists or doctors?',
        ],
      },
      {
        type: 'callout',
        variant: 'info',
        text: 'A platform listing is not a clinical credential. Guides describe coaching, preparation support, integration conversations, and related legal wellness services here. If a guide holds a separate professional license, ask whether the proposed service is within that licensed role and check the license independently. Seek an appropriately licensed professional for clinical care.',
      },
      {
        type: 'h3',
        text: 'About the practical arrangement',
      },
      {
        type: 'ul',
        items: [
          'How do sessions work — format, duration, and frequency?',
          'What is your fee, and how does payment work?',
          'What is your cancellation and rescheduling policy?',
          'How do you communicate between sessions if something comes up?',
          'What does working together typically look like over time?',
        ],
      },
      {
        type: 'h3',
        text: 'About fit',
      },
      {
        type: 'ul',
        items: [
          'Have you worked with people in a similar situation to mine?',
          'What is your approach or philosophy?',
          'Is there anything about my situation that gives you pause?',
          'What would you say are the limits of what our work together can offer?',
        ],
      },
      {
        type: 'p',
        text: 'A guide who takes your questions seriously, answers without evasion, and volunteers information about what they cannot help with is likely one who takes their responsibilities seriously.',
      },
    ],
  },

  {
    slug: 'red-flags',
    title: 'Red Flags in Facilitators',
    subtitle: 'Warning signs to watch for when choosing a guide',
    description:
      'A guide to warning signs and concerning behaviours to watch for when evaluating coaches, guides, and facilitators in the plant medicine and wellness space.',
    blocks: [
      {
        type: 'p',
        text: 'A profile or reassuring description cannot establish a guide’s competence or integrity. Review the proposed service, qualifications and boundaries, and watch for pressure or unsupported claims. These questions can help you make a more informed choice; they cannot guarantee safety.',
      },
      {
        type: 'h3',
        text: 'Guarantees and overclaiming',
      },
      {
        type: 'ul',
        items: [
          'Promises specific outcomes — healing, transformation, cures, or breakthroughs',
          'Claims their method is the only effective approach',
          'Minimises or dismisses risk, side effects, or the need for caution',
          'Makes vague but sweeping medical or therapeutic claims',
          'Frames their work as a solution for serious psychiatric conditions',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'No coach or guide can guarantee a specific outcome. Anyone who does is either misleading you or does not understand the limits of their work.',
      },
      {
        type: 'h3',
        text: 'Pressure and boundary violations',
      },
      {
        type: 'ul',
        items: [
          'Pushes you to commit before you feel ready',
          'Discourages you from asking questions or doing your own research',
          'Suggests you should not tell others — a therapist, doctor, or family — about the work',
          'Makes you feel guilty or spiritually deficient for having doubts',
          'Creates urgency ("limited spots", "now or never")',
        ],
      },
      {
        type: 'h3',
        text: 'Inappropriate relationships',
      },
      {
        type: 'ul',
        items: [
          'Romantic or sexual engagement with clients — this is an ethical violation in any healing or coaching context',
          'Excessive personal self-disclosure that shifts the dynamic',
          'Financial relationships beyond agreed fees (loans, investments, gifts)',
          'Encouraging dependency rather than your own growing autonomy',
          'Isolating you from your existing support network',
        ],
      },
      {
        type: 'h3',
        text: 'No intake or screening process',
      },
      {
        type: 'p',
        text: 'Ask how the guide decides whether the service fits your needs, what screening is appropriate, and when they refer to a qualified healthcare professional. Be cautious if they promise suitability without understanding what you are seeking. Any necessary health screening should use an agreed confidential intake process, not the platform contact form.',
      },
      {
        type: 'h3',
        text: 'Substance-related red flags',
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'This platform does not support sourcing, supplying, or administering controlled substances. Do not use it to arrange those activities. A claim of legality or professional status should be checked independently; rules depend on the substance, service, and location.',
      },
      {
        type: 'ul',
        items: [
          'Offers to procure or supply any controlled substance',
          'Presents substance use as necessary for your healing',
          'Minimises the legal and health risks of substance use',
          'Coordinates or hosts events involving illegal substances',
        ],
      },
      {
        type: 'h3',
        text: 'Lack of transparency',
      },
      {
        type: 'ul',
        items: [
          'Cannot or will not describe their training or background clearly',
          'Credentials that cannot be verified',
          'No clear explanation of what they offer and what they do not',
          'Avoidance when you ask about their approach to safety or crises',
          'No clear fee structure or written agreement',
        ],
      },
      {
        type: 'h3',
        text: 'Trust your instincts',
      },
      {
        type: 'p',
        text: 'You do not need a specific reason to decide someone is not the right fit. If something feels off — if you feel dismissed, pressured, or uneasy — that is enough. The right guide will make you feel more settled as you learn more, not less.',
      },
    ],
  },

  {
    slug: 'contraindications',
    title: 'Health Questions & Screening',
    subtitle: 'What to discuss with a qualified healthcare professional',
    description:
      'Questions about health, screening, and privacy to discuss with an appropriately qualified professional before intensive wellness work.',
    blocks: [
      {
        type: 'callout',
        variant: 'warning',
        text: 'This page helps you prepare questions; it does not assess your health or determine which practices are safe for you. Take individual health and medication questions to an appropriately qualified healthcare professional.',
      },
      {
        type: 'p',
        text: 'Whether a practice is appropriate depends on the specific activity and your individual circumstances. A directory profile or general checklist cannot establish that it is safe for you. Discuss health and medication questions with an appropriately qualified healthcare professional.',
      },
      {
        type: 'h3',
        text: 'Questions for your clinician',
      },
      {
        type: 'ul',
        items: [
          'What information do you need about the specific practice I am considering?',
          'Are there concerns related to my health history, current symptoms, or medications?',
          'Do I need an assessment or a referral before deciding whether to participate?',
          'What signs would mean I should stop and seek professional help?',
          'What follow-up support should I arrange?',
        ],
      },
      {
        type: 'h3',
        text: 'Medication questions',
      },
      {
        type: 'p',
        text: 'Do not stop or adjust any medication without speaking to your prescribing clinician first. Discuss medication questions and relevant health history with that clinician; do not send medication lists through the platform contact form.',
      },
      {
        type: 'h3',
        text: 'Screening and privacy',
      },
      {
        type: 'p',
        text: 'Before sharing sensitive information, ask what screening the service requires, who conducts it, what their qualifications are, and how the information is stored and shared. Discuss necessary health information honestly with the appropriately qualified professional through an agreed confidential intake process.',
      },
      {
        type: 'p',
        text: 'Keep initial inquiries brief and leave out diagnoses, medications, trauma details, and substance use history. The platform contact form is for introductions, not clinical screening. Ask a guide to refer questions beyond their qualifications to an appropriate healthcare professional.',
      },
      {
        type: 'h3',
        text: 'When you are uncertain',
      },
      {
        type: 'p',
        text: 'You can pause or decline a proposed service while you seek advice. Ask for a clear description of the activity and bring it to your clinician. A profile approval, training certificate, or general information page is not personal medical clearance.',
      },
      {
        type: 'callout',
        variant: 'emergency',
        text: 'In the US, call or text 988 for emotional distress or suicidal crisis. For immediate danger or a medical emergency, call 911 or your local emergency number. Do not wait for a response through this platform. See Get Urgent Help in the safety library for service details.',
      },
    ],
  },

  {
    slug: 'scope-of-practice',
    title: 'Coaching, Therapy & Medical Care',
    subtitle: 'Understanding what each type of support offers — and what it does not',
    description:
      'A clear explanation of the differences between coaching, psychotherapy, and medical care — and why understanding those distinctions helps you seek the right support.',
    blocks: [
      {
        type: 'p',
        text: 'One of the most important things you can do before working with anyone in this space is understand what kind of support they are actually offering — and what they are not. These distinctions are not bureaucratic formalities. They reflect real differences in training, accountability, scope, and appropriate use.',
      },
      {
        type: 'h3',
        text: 'Coaching',
      },
      {
        type: 'p',
        text: 'Coaching is a future-focused, goal-oriented practice. Coaches help clients identify what they want, build clarity and accountability, and take steps toward change. The coach title alone does not establish a clinical license or a standard level of training. Certification, title protection and practice requirements vary by service and jurisdiction; check the specific credential and role.',
      },
      {
        type: 'ul',
        items: [
          'May focus on goals, reflection and practical next steps; the approach varies by coach',
          'Does not diagnose or treat mental health conditions',
          'Not a substitute for therapy when clinical support is needed',
          'A coaching certificate is not the same as a clinical license',
          'Confidentiality varies — ask explicitly what a coach\'s policy is',
          'May include preparation support, integration conversations, or accountability work',
        ],
      },
      {
        type: 'h3',
        text: 'Psychotherapy',
      },
      {
        type: 'p',
        text: 'Psychotherapy includes approaches intended to help people with troubling emotions, thoughts and behaviours. Professional titles, licensing requirements and permitted activities vary by jurisdiction. A therapist or counsellor title alone does not establish a license or authority to diagnose. Check the exact qualification, applicable regulator or accredited register, and the scope of the proposed service.',
      },
      {
        type: 'ul',
        items: [
          'Appropriately qualified professionals may assess or treat mental health conditions within their permitted scope',
          'Check licensing or registration requirements in the relevant jurisdiction',
          'Ask which ethical standards and complaints process apply',
          'May address current thoughts, behaviours, relationships or earlier experiences, depending on the approach',
          'Appropriate for trauma, depression, anxiety, and other clinical presentations',
          'Can work alongside psychiatry and medication management',
        ],
      },
      {
        type: 'p',
        text: 'If you are experiencing persistent depression, anxiety, trauma symptoms, suicidal thoughts, or anything that significantly affects your daily functioning, therapy is the appropriate starting point — not coaching.',
      },
      {
        type: 'h3',
        text: 'Medical care and psychiatry',
      },
      {
        type: 'p',
        text: 'Doctors and psychiatrists are licensed medical professionals. Psychiatrists specialise in diagnosing and treating mental health conditions through a medical model, which often includes prescribing and monitoring medication. GPs and other physicians manage physical health, assess risk, and coordinate care.',
      },
      {
        type: 'ul',
        items: [
          'Can prescribe, adjust, or discontinue medications',
          'Conduct formal diagnostic assessments',
          'Manage physical health conditions and interactions',
          'Coordinate emergency or acute mental health care',
          'Required before stopping or changing any prescribed medication',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'This platform presents coaching and support services, not clinical care. Some guides may hold a separate professional license; neither the guide title nor platform approval verifies it. Confirm the capacity in which a person is offering services and independently check any license. Diagnosis, treatment, and medication decisions belong with an appropriately licensed healthcare professional.',
      },
      {
        type: 'h3',
        text: 'What guides on this platform offer',
      },
      {
        type: 'p',
        text: 'Profiles may list preparation conversations, integration support, breathwork facilitation, somatic coaching, harm reduction education and similar practices. Guides must work lawfully and within their qualifications. TFN does not independently verify service legality; confirm the exact activity, role and location requirements. A support-service label does not establish a clinical care relationship.',
      },
      {
        type: 'p',
        text: 'A good guide knows their limits. They can help you process and reflect; they cannot treat you. They can accompany you; they cannot replace clinical care when clinical care is what you need.',
      },
      {
        type: 'h3',
        text: 'When to choose each type of support',
      },
      {
        type: 'ul',
        items: [
          'Choose coaching when you are relatively stable and seeking clarity, growth, or integration support',
          'Choose therapy when you are experiencing clinical symptoms, trauma, or distress that affects your daily life',
          'Choose medical care when you have physical health concerns, medication questions, or need a formal diagnosis',
          'Choose a combination — coaching can complement therapy and medical care, but should not replace them',
        ],
      },
    ],
    sourceCheck: {
      date: '2026-11-08',
      scope: 'Psychotherapy approaches and jurisdiction-dependent professional regulation checked against the sources below. This is general information, not individual medical or legal advice.',
      sources: [
        { title: 'NIMH: Psychotherapies', url: 'https://www.nimh.nih.gov/health/topics/psychotherapies' },
        { title: 'UK Parliament: Counselling and psychotherapy regulation (3 March 2026)', url: 'https://questions-statements.parliament.uk/written-questions/detail/2026-02-24/115490' },
      ],
    },
  },

  {
    slug: 'emergency',
    title: 'Get Urgent Help',
    subtitle: 'What to do if you or someone else is in crisis',
    description:
      'Crisis resources and clear guidance on what to do if you or someone else is in distress or danger. This platform is not an emergency service.',
    blocks: [
      {
        type: 'callout',
        variant: 'emergency',
        text: 'This platform is not an emergency service. If you or someone else is in immediate danger, call your local emergency number (911 in the US) now.',
      },
      {
        type: 'h3',
        text: 'US crisis support — available 24/7',
      },
      {
        type: 'p',
        text: 'For emotional distress or a suicidal crisis in the United States, contact one of these services. If you are outside the US, use the crisis and emergency services in your location.',
      },
      {
        type: 'p',
        text: '988 Suicide & Crisis Lifeline — call or text 988 (US). Available 24/7 for anyone in emotional distress or suicidal crisis.',
        links: [
          { label: 'Call 988 (US)', href: 'tel:988' },
          { label: 'Text 988 (US)', href: 'sms:988' },
          { label: '988 accessibility options: chat, videophone and relay', href: 'https://988lifeline.org/deaf-hard-of-hearing-hearing-loss/' },
        ],
      },
      {
        type: 'p',
        text: 'Crisis Text Line — text HOME to 741741 in the US for free crisis support, available 24/7.',
        links: [{ label: 'Text Crisis Text Line at 741741 (US); enter HOME', href: 'sms:741741' }],
      },
      {
        type: 'h3',
        text: 'Psychedelic peer support — limited hours',
      },
      {
        type: 'p',
        text: 'Fireside Project — call or text 623-473-7433 in the US, daily from 11 a.m. to 11 p.m. Pacific. It offers non-clinical emotional support during or after psychedelic experiences. It is not an emergency service, a suicide hotline, or medical care. For immediate danger or a medical emergency, call 911; for suicidal crisis, call or text 988.',
        links: [
          { label: 'Call Fireside Project (US)', href: 'tel:+16234737433' },
          { label: 'Text Fireside Project (US)', href: 'sms:+16234737433' },
        ],
      },
      {
        type: 'h3',
        text: 'Treatment information and event support',
      },
      {
        type: 'p',
        text: 'SAMHSA National Helpline — 1-800-662-4357. A free, confidential US treatment referral and information service, available 24/7. Use 988 for immediate crisis support.',
        links: [{ label: 'Call SAMHSA National Helpline (US)', href: 'tel:+18006624357' }],
      },
      {
        type: 'p',
        text: 'Zendo Project — peer support at participating events, plus harm reduction training and educational resources. It is not a general emergency phone line; check its website for current event services.',
      },
      {
        type: 'h3',
        text: 'Outside the United States',
      },
      {
        type: 'p',
        text: 'Use emergency services in your current location for immediate danger. US short codes and support lines are not worldwide services. Crisis Text Line lists country-specific international partners; check the partner’s location, eligibility and current service details before using it.',
        links: [{ label: 'Find Crisis Text Line international partners by country', href: 'https://www.crisistextline.org/about-us/where-we-are/' }],
      },
      {
        type: 'h3',
        text: 'What this platform is not',
      },
      {
        type: 'p',
        text: 'This platform and its contact forms do not provide emergency intervention, crisis stabilisation, or clinical assessment. A guide may hold separate professional qualifications, but a listing here does not establish an emergency or clinical care relationship.',
      },
      {
        type: 'p',
        text: 'No message sent through this platform is monitored for crisis content. If you are in crisis, please use the resources above — do not wait for a response from a guide.',
      },
      {
        type: 'h3',
        text: 'Signs that professional or emergency support is needed',
      },
      {
        type: 'ul',
        items: [
          'Thoughts of harming yourself or ending your life',
          'Thoughts of harming someone else',
          'Significant disorientation, confusion, or loss of contact with reality',
          'Inability to care for yourself or complete basic daily tasks',
          'Alcohol or substance use that is out of control and affecting your safety',
          'Acute psychosis, paranoia, or hallucinations',
          'Following a difficult or destabilising experience — breathwork, trauma work, or otherwise',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'If you are supporting someone else who is in crisis — stay with them if it is safe to do so, contact emergency services if needed, and remove access to any means of self-harm. You do not need to manage a crisis alone.',
      },
      {
        type: 'h3',
        text: 'After a difficult experience',
      },
      {
        type: 'p',
        text: 'Difficult experiences — whether in a breathwork session, an integration conversation, or elsewhere — can bring up material that is disorienting or distressing. This is not always a sign something went wrong. But it does mean you need support.',
      },
      {
        type: 'p',
        text: 'If you are feeling unstable following any intensive wellness work, reach out to a therapist, your doctor, or a crisis line before returning to that work. Integration takes time. There is no rush.',
      },
      {
        type: 'h3',
        text: 'Controlled substances',
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'If you have consumed a substance and are experiencing a medical emergency, call 911 in the US (or your local emergency number) immediately. Tell emergency responders what you know so they can help. Do not wait for a reply through this platform.',
      },
    ],
    sourceCheck: {
      date: '2026-11-08',
      scope: 'Support-line numbers, hours, service scope, 988 accessibility options and the international-partner resource checked against the providers below. This is a source check, not a test call or guarantee of availability.',
      sources: [
        { title: '988 Suicide & Crisis Lifeline', url: 'https://988lifeline.org/' },
        { title: '988: Deaf, Hard of Hearing, Hearing Loss', url: 'https://988lifeline.org/deaf-hard-of-hearing-hearing-loss/' },
        { title: 'Crisis Text Line: International partners', url: 'https://www.crisistextline.org/about-us/where-we-are/' },
        { title: 'Crisis Text Line', url: 'https://www.crisistextline.org/' },
        { title: 'Fireside Project: Psychedelic Support Line', url: 'https://firesideproject.org/support-line' },
        { title: 'SAMHSA National Helpline', url: 'https://www.samhsa.gov/find-help/helplines/national-helpline' },
        { title: 'Zendo Project: Event Services', url: 'https://zendoproject.org/volunteer/' },
      ],
    },
  },
  {
    slug: 'spiritual-support',
    title: 'Exploring Spiritual Support',
    searchTitle: 'Spiritual Support: Approaches, Boundaries and Choosing a Guide',
    subtitle: 'Questions about meaning, values and the kind of conversation you want',
    description: 'Explore what spiritual support can mean, questions about beliefs and boundaries, and how to compare guides without pressure or an account.',
    nextStep: { label: 'Browse spiritual support', href: '/facilitators?modality=Spiritual+support', description: 'Explore profiles that list spiritual support. The label alone does not establish a tradition, credential or approach. Ask each guide what they offer and whether it fits what you want. No account or payment is needed to inquire.' },
    relatedSlugs: ['integration-basics', 'questions-to-ask', 'red-flags', 'scope-of-practice'],
    blocks: [
      { type: 'p', text: 'Adults may look for spiritual support when they want to talk about meaning, values, beliefs, belonging or changes in how they see their life. You can be curious, uncertain, religious, non-religious or still finding language for your questions. You do not need to adopt a belief to ask what a guide offers.' },
      { type: 'h3', text: 'Ask what spiritual support means to this guide' },
      { type: 'p', text: 'The term is broad. A conversation might involve reflection, a particular tradition or a practice agreed in advance, but do not assume that a directory label promises any of these. Ask the guide to describe their approach, training and limits in plain language.' },
      { type: 'ul', items: [
        'Do you work within a specific tradition, and how do you approach beliefs different from your own?',
        'What happens in a typical session? Is it conversation, a practice, or something else?',
        'What training or experience is relevant to this service, and what can I independently verify?',
        'Can I disagree, ask questions, decline a practice or end a session?',
      ] },
      { type: 'h3', text: 'Spiritual support or integration conversations?' },
      { type: 'p', text: 'If your main question is how to make sense of a particular psychedelic or other significant experience in everyday life, integration conversations may be a useful category to explore. If you want to discuss beliefs, meaning or a spiritual practice, ask about the guide’s spiritual-support approach. The categories can overlap, but neither label tells you the person’s tradition, qualifications or suitability for you.' },
      { type: 'h3', text: 'Agree on boundaries and practical details' },
      { type: 'p', text: 'Before arranging a session, discuss confidentiality and its limits, fees, cancellation terms, session length and communication between sessions. If a practice involves touch, ask about consent before agreeing. Confirm online availability for your location and time zone rather than assuming that remote support is available everywhere.' },
      { type: 'h3', text: 'Leave room for your own judgment' },
      { type: 'ul', items: [
        'You can take time to decide without pressure to buy a package or make a commitment.',
        'Be cautious about guaranteed outcomes, claims of unquestionable authority, secrecy or pressure to give up other relationships and support.',
        'A guide should be able to explain the limits of their role. Spiritual support is not a substitute for licensed medical or mental health care.',
        'A listing does not independently verify identity, credentials, safety or results.',
      ] },
      { type: 'h3', text: 'Start with a brief question' },
      { type: 'p', text: 'You could ask: “I would like to understand your approach to spiritual support. How do you work with someone who is still exploring their beliefs, and what are your fees and session options?” Keep private health information out of the first platform message. Sending an inquiry does not book a session.' },
      { type: 'callout', variant: 'info', text: 'TFN connects people with listed legal support services. It does not sell, source or coordinate access to controlled substances. A spiritual-support listing does not imply ceremonies, substances or any particular religious role.' },
    ],
  },
  {
    "slug": "integration-circles-vs-individual",
    "title": "Integration Circles or One-to-One Support?",
    "searchTitle": "Psychedelic Integration Circles vs One-to-One Support",
    "subtitle": "Compare participation, privacy and professional roles before choosing a format",
    "description": "Compare psychedelic integration circles and one-to-one support. Ask about group rules, confidentiality, professional roles, fees and your right not to share.",
    "relatedSlugs": [
      "integration-basics",
      "scope-of-practice",
      "questions-to-ask",
      "emergency"
    ],
    "nextStep": {
      "label": "Explore integration profiles",
      "href": "/integration-support",
      "description": "Compare the services people list, then ask directly about format, scope, availability and location eligibility. TFN does not confirm that these profiles offer groups. An inquiry is not a booking."
    },
    "sourceCheck": {
      "date": "2026-11-08",
      "scope": "Sources inform the distinctions and questions below. APA guidance concerns clinical group therapy, not the effectiveness or regulation of peer integration circles. No clinical reviewer or endorsement is implied.",
      "sources": [
        {
          "title": "American Psychological Association: Understanding group therapy",
          "url": "https://www.apa.org/topics/psychotherapy/group-therapy"
        },
        {
          "title": "APA Ethics Code: Group Therapy (10.03)",
          "url": "https://www.apa.org/ethics/code"
        },
        {
          "title": "Institute of Psychedelic Therapy: Integration groups and service limits",
          "url": "https://instituteofpsychedelictherapy.org/directory/integration-groups/"
        }
      ]
    },
    "blocks": [
      {
        "type": "p",
        "text": "If you are looking for a conversation after a psychedelic or other significant experience, a group and a one-to-one appointment involve different choices. Start with the kind of conversation you want, how much you want to share and the role of the person leading it. Neither format guarantees a particular outcome."
      },
      {
        "type": "h3",
        "text": "A circle is not automatically therapy"
      },
      {
        "type": "ul",
        "items": [
          "A peer integration circle is a shared discussion, not automatically a clinical service. Ask who leads it and what support is outside its scope.",
          "A professionally facilitated nonclinical group may offer a structured conversation. Training or a professional-sounding title does not by itself establish a healthcare license.",
          "Clinical group therapy is a distinct service. Verify the clinician’s current license, whether they may work with you in your location, and the clinical service actually being offered.",
          "One-to-one integration support can also be clinical or nonclinical. The private format does not establish qualifications or make it therapy."
        ]
      },
      {
        "type": "h3",
        "text": "Which conversation format fits your preferences?"
      },
      {
        "type": "p",
        "text": "In a group, time and attention are shared with other participants. Ask about group size, whether membership stays the same or newcomers can join, and how turns are managed. In a one-to-one appointment, ask how the conversation is structured around your questions. You can compare options without explaining your personal history or committing to either format."
      },
      {
        "type": "ul",
        "items": [
          "Do you want to hear other perspectives, or would you prefer to discuss your questions with one person?",
          "Can you attend only to listen, pass on an exercise or leave early? What happens if you do not want advice or an interpretation?",
          "Is this a drop-in circle or a fixed series? What attendance commitment and total fees apply?",
          "How does the leader handle pressure, interruptions, conflict or a participant whose needs are beyond the group’s scope?"
        ]
      },
      {
        "type": "h3",
        "text": "A confidentiality agreement is not a guarantee"
      },
      {
        "type": "p",
        "text": "Other participants hear what is shared in a group. Even when everyone agrees to confidentiality, the organizer cannot guarantee that participants will keep information private. APA makes this limitation explicit for group therapy; do not assume a peer circle offers stronger protection. Ask what rules apply before you disclose anything sensitive."
      },
      {
        "type": "ul",
        "items": [
          "Are names, attendance lists or contact details shared with other participants?",
          "What are the rules about discussing someone else’s story outside the group? How are breaches handled?",
          "May participants contact one another afterward, and is permission required first?",
          "Who keeps any notes, who can access them, and what confidentiality limits apply to the leader?"
        ]
      },
      {
        "type": "p",
        "text": "A one-to-one conversation also has privacy limits. Ask the person to explain their actual policy and any legal duties; do not assume every integration guide has the same obligations as a licensed therapist."
      },
      {
        "type": "h3",
        "text": "A brief question you can send"
      },
      {
        "type": "p",
        "text": "“I am comparing group and one-to-one integration support. Is your service clinical care or a nonclinical conversation? For groups, how many people attend, can I listen without sharing, and what are the confidentiality and contact-between-participants rules? What are the total fees and attendance expectations?” Keep diagnoses, medication lists, substance-use history and other sensitive details out of an introductory platform message."
      },
      {
        "type": "h3",
        "text": "Know when a different service is needed"
      },
      {
        "type": "p",
        "text": "A peer circle or nonclinical guide is not a substitute for assessment or treatment by an appropriately licensed healthcare professional. If distress persists or interferes with daily life, seek qualified clinical support rather than relying on a group discussion alone. For immediate danger or urgent support, use the urgent-help guide linked below."
      },
      {
        "type": "callout",
        "variant": "info",
        "text": "This guide concerns reflection and support, not obtaining or taking substances. TFN does not sell, source, administer or arrange access to controlled substances. It does not confirm group availability, independently verify every qualification or guarantee that a proposed service is permitted in every location."
      }
    ]
  },
  {
    slug: 'integration-support-cost',
    title: 'Fees for Integration Support',
    searchTitle: 'What Does Psychedelic Integration Support Cost? Fees and Questions to Ask',
    subtitle: 'Compare the total cost, not just the session price',
    description:
      'Understand how integration guides set fees: per session, packages, sliding scale and donation-based. Learn what to confirm in writing before you pay.',
    relatedSlugs: ['questions-to-ask', 'red-flags', 'integration-basics', 'scope-of-practice'],
    nextStep: { label: 'Compare integration profiles', href: '/integration-support', description: 'Profiles show the fee information each guide chose to list. Fees are self-reported and can change, so confirm the current terms directly. Browsing is free, no account is needed, and an inquiry is not a booking.' },
    blocks: [
      { type: 'p', text: 'There is no standard price for an integration conversation. Guides set their own fees, and the same word can describe a single conversation, a group circle or a multi-week program. A clear way to compare is to work out what you would pay in total, for what, and on what terms.' },
      { type: 'h3', text: 'Common ways guides charge' },
      { type: 'ul', items: [
        'Per session. A fixed fee for one conversation. Ask how long a session lasts and whether a first introductory call is charged.',
        'Packages or programs. Several sessions sold together. Ask whether you can start with a single session first, and what happens to unused sessions if you stop.',
        'Sliding scale. A range of fees based on what you can afford. Ask how the guide decides where you fall and whether you need to disclose financial details.',
        'Donation-based or suggested donation. You choose an amount, sometimes above a suggested minimum. Ask whether there is a minimum and when payment is expected.',
        'Rate on request. The fee is not published. Ask for it in writing before you share personal history.',
      ] },
      { type: 'h3', text: 'Work out the total before you compare' },
      { type: 'p', text: 'A lower session price can cost more overall if it comes with a required package, and a higher price can include things another guide charges for separately. Ask each guide the same questions so you are comparing like with like.' },
      { type: 'ul', items: [
        'What is the total fee, in which currency, and what exactly does it cover?',
        'How long is each session, and how many do you usually suggest? Is that a recommendation or a requirement?',
        'Is contact between sessions included, limited or charged separately?',
        'What are the cancellation, rescheduling and refund terms?',
        'How and when do I pay, and will I receive a receipt?',
      ] },
      { type: 'h3', text: 'Insurance and clinical care' },
      { type: 'p', text: 'Do not assume that insurance, a health savings account or a similar benefit applies. Coverage usually depends on the kind of service, the professional’s license and your own plan. If cost is a reason you are choosing between a nonclinical guide and a licensed clinician, ask your insurer or benefits administrator what your plan covers, and ask the professional exactly which service they would be providing. A guide’s title alone does not establish a license.' },
      { type: 'h3', text: 'If cost is a barrier' },
      { type: 'ul', items: [
        'Ask about a sliding scale or a shorter session. Many people find this an uncomfortable question; a guide who takes their role seriously will answer it plainly.',
        'Consider a peer integration circle. Group formats are often less expensive than one-to-one sessions, with different privacy trade-offs.',
        'Ask about a single session rather than a program, and decide afterwards whether to continue.',
        'If you need clinical care, a nonclinical conversation is not a cheaper substitute for it. For urgent support, use the urgent-help guide rather than waiting for an appointment.',
      ] },
      { type: 'h3', text: 'Payment warning signs' },
      { type: 'ul', items: [
        'Pressure to pay quickly, or a discount that expires before you have had time to think.',
        'A large non-refundable prepayment before you have met or spoken with the guide.',
        'Fees tied to a promised result, or a claim that paying more leads to a better outcome.',
        'Reluctance to put the fee, session length or cancellation terms in writing.',
        'A request to pay for anything other than the conversation or service you agreed to.',
      ] },
      { type: 'p', text: 'None of these proves bad intent, and their absence does not guarantee a good experience. They are reasons to slow down, ask again or choose someone else. You can decline at any point before you have agreed to pay.' },
      { type: 'h3', text: 'A brief question you can send' },
      { type: 'p', text: '“I am comparing integration support and would like to understand your fees. Could you confirm the session length, total fee and currency, whether you offer a sliding scale or single sessions, and your cancellation and refund terms?” Keep diagnoses, medication lists, substance-use history and other sensitive details out of an introductory platform message.' },
      { type: 'callout', variant: 'info', text: 'Fees shown on profiles are self-reported by each guide. TFN does not set, verify or guarantee them, and a listed fee is not a quote. This guide concerns reflection and support, not obtaining or taking substances. TFN does not sell, source, administer or arrange access to controlled substances.' },
    ],
  },
  {
    slug: 'choosing-breathwork-facilitator',
    title: 'Choosing a Breathwork Facilitator',
    searchTitle: 'How to Choose a Breathwork Facilitator: Questions, Screening and Consent',
    subtitle: 'Ask about the style, the screening and your right to stop',
    description:
      'Breathwork styles range from gentle to intensive. Learn what to ask a breathwork facilitator about screening, consent, group size, online sessions and fees.',
    relatedSlugs: ['contraindications', 'questions-to-ask', 'red-flags', 'scope-of-practice'],
    nextStep: { label: 'Browse breathwork profiles', href: '/facilitators?modality=Breathwork', description: 'Compare the services people list, then ask directly about style, screening, format and location eligibility. Profiles are self-reported. Browsing needs no account, and an inquiry is not a booking.' },
    sourceCheck: {
      date: '2026-11-11',
      scope: 'The source below informs the advice to speak with a healthcare professional before intensive breathwork. It discusses one style, holotropic breathwork, in a general-wellness context. This is a source check, not a clinical review, and no endorsement is implied.',
      sources: [
        { title: 'Cleveland Clinic: Should You Try Holotropic Breathwork?', url: 'https://health.clevelandclinic.org/should-you-try-holotropic-breathwork-heres-what-it-does' },
      ],
    },
    blocks: [
      { type: 'p', text: '“Breathwork” covers very different practices. Some are slow, quiet breathing exercises. Others use fast, continuous breathing for an extended period and are intended to be intense. Before comparing facilitators, find out which kind of session is actually being offered, because the questions worth asking depend on it.' },
      { type: 'h3', text: 'Ask what the session involves' },
      { type: 'ul', items: [
        'What style of breathwork do you offer, and how would you describe its intensity?',
        'How long is the breathing portion, and what happens before and after it?',
        'Is it one-to-one or a group? How many participants, and how many people are supporting them?',
        'Is music, movement or physical touch part of the session?',
        'What do people commonly find difficult, and how do you respond?',
      ] },
      { type: 'h3', text: 'Health questions come first' },
      { type: 'p', text: 'Intensive styles can bring up strong physical sensations and emotions. Cleveland Clinic’s overview of holotropic breathwork advises talking with your healthcare provider before trying it, says people with a history of certain health conditions should avoid it, and says it is not recommended during pregnancy or breastfeeding. If you have any health condition, take medication or are unsure, raise it with a qualified healthcare professional before booking an intensive session. A facilitator is not the right person to decide whether a practice is medically suitable for you.' },
      { type: 'p', text: 'It is reasonable to expect a facilitator of an intensive style to ask screening questions before you take part, and to explain what they do with the answers. Share health details through the facilitator’s own intake process, not in an introductory platform message.' },
      { type: 'h3', text: 'Consent and your right to stop' },
      { type: 'ul', items: [
        'Can I slow down, return to normal breathing or stop at any time, and how do I signal that?',
        'Is touch ever used? If so, is it always optional, and can I decline in advance?',
        'Can I keep my eyes open, sit up or leave the room?',
        'What support is available after the session if I feel unsettled?',
      ] },
      { type: 'p', text: 'You do not need a reason to pause or stop. A facilitator who discourages this, or who treats discomfort as something to push through, is giving you useful information about how they work.' },
      { type: 'h3', text: 'Online and solo sessions' },
      { type: 'p', text: 'If a session is online, you may be physically alone while doing it. Ask whether the facilitator adapts the practice for remote sessions, what they expect you to have in place, and what happens if the connection drops or you stop responding. Do not practise intensive breathing in water, while driving or anywhere a moment of dizziness could cause an injury.' },
      { type: 'h3', text: 'Training and role' },
      { type: 'p', text: 'Breathwork training varies widely, and a certificate from a training program is not a healthcare license. Ask what training supports this specific style, how long the person has been leading it, and how you can check what they tell you. If they also describe themselves as a therapist or clinician, verify that license separately with the issuing authority.' },
      { type: 'h3', text: 'Reasons to slow down' },
      { type: 'ul', items: [
        'No questions about your health before an intensive session.',
        'Claims that breathwork treats or cures a condition, or advice to change prescribed medication.',
        'Discouraging you from speaking with a healthcare professional.',
        'Pressure to continue when you want to stop, or to book a package before a first session.',
        'Vague answers about touch, group size or what happens if someone is overwhelmed.',
      ] },
      { type: 'h3', text: 'A brief question you can send' },
      { type: 'p', text: '“I am interested in breathwork and would like to understand your sessions. Which style do you offer and how intense is it? Is it one-to-one or a group, in person or online? How do you screen participants, and can I pause or stop at any time? What are the session length, total fee and cancellation terms?”' },
      { type: 'callout', variant: 'warning', text: 'This guide is general information, not medical advice. It cannot tell you whether a breathwork practice is suitable for you. Speak with a qualified healthcare professional about your own health. If you or someone else is in immediate danger, call your local emergency number.' },
    ],
  },
  {
    slug: 'colorado-facilitator-license-check',
    title: 'Checking a Colorado Facilitator License',
    searchTitle: 'How to Check a Colorado Natural Medicine Facilitator License',
    subtitle: 'Use the state lookup, not a directory listing or a certificate',
    description:
      'Check a claimed Colorado natural medicine facilitator license with the official DORA lookup. Learn what a result shows and what it cannot tell you.',
    relatedSlugs: ['questions-to-ask', 'scope-of-practice', 'red-flags'],
    sourceCheck: {
      date: '2026-11-11',
      scope: 'TFN checked the official Colorado sources below for the license-checking steps in this guide. This is a source check, not a legal review, and does not verify any individual. Rules and web addresses can change; consult the issuing authority for current information.',
      sources: [
        { title: 'Colorado DORA: Natural Medicine FAQ', url: 'https://dpo.colorado.gov/NaturalMedicine/FAQ' },
        { title: 'Colorado DORA: License lookup', url: 'https://apps2.colorado.gov/dora/licensing/Lookup/LicenseLookup.aspx' },
        { title: 'Colorado DORA: File a complaint', url: 'https://dpo.colorado.gov/FileComplaint' },
        { title: 'Colorado Natural Medicine Division: Accessing regulated natural medicine', url: 'https://dnm.colorado.gov/accessing-regulated-natural-medicine' },
      ],
    },
    blocks: [
      { type: 'p', text: 'If someone tells you they are a licensed natural medicine facilitator in Colorado, you can check that claim yourself with the state. This guide explains where to look and what the result does and does not mean. It is about checking a credential claim, not about arranging a service.' },
      { type: 'h3', text: 'Two state agencies, two kinds of license' },
      { type: 'p', text: 'Colorado divides responsibility between two agencies. The Department of Regulatory Agencies (DORA) licenses and regulates individual facilitators. The Department of Revenue’s Natural Medicine Division licenses businesses such as healing centers. A person and a place are therefore checked in different systems, and one does not confirm the other.' },
      { type: 'h3', text: 'How to check a facilitator' },
      { type: 'ol', items: [
        'Ask the person for their full name as it appears on the license, the license type and the license number.',
        'Open DORA’s official license lookup, linked in the sources below. Reach it from a colorado.gov address rather than from a link the person sends you.',
        'Search for the person and compare the result with what you were told, including the license type and its current status.',
        'If you cannot find a record, or the result is unclear, contact DORA’s Natural Medicine program using the details on its official page rather than relying on an explanation from the person you are checking.',
      ] },
      { type: 'h3', text: 'License types are not interchangeable' },
      { type: 'p', text: 'DORA issues more than one natural medicine license type, including Facilitator, Clinical Facilitator and training-related licenses. According to DORA’s FAQ, a Clinical Facilitator license also requires a current Colorado license in a listed health profession. A training license is not the same as a full facilitator license. If you are unsure what a particular license type permits, ask DORA; do not rely on the holder’s description alone.' },
      { type: 'h3', text: 'What a lookup result cannot tell you' },
      { type: 'ul', items: [
        'Whether the person is a good fit for you, or how they treat the people they work with.',
        'Whether a specific service they describe is within the scope of their license.',
        'Anything about training certificates, memberships or titles that are not state licenses.',
        'Whether a venue is licensed. Healing centers are licensed separately by the Natural Medicine Division.',
        'Whether someone licensed in Colorado may work with you in another state or country.',
      ] },
      { type: 'p', text: 'Many guides offer nonclinical conversations, such as preparation education or integration support, and do not claim a state facilitator license. The absence of a Colorado license is not by itself a warning sign for those services. What matters is that the person is clear and accurate about what they hold and what they offer. A claim you cannot confirm is a reason to pause.' },
      { type: 'h3', text: 'If something is wrong' },
      { type: 'p', text: 'DORA accepts complaints about license holders through its official complaint page, linked in the sources below. If you believe someone is presenting themselves as licensed when they are not, DORA is the authority to ask. For immediate danger, call 911.' },
      { type: 'h3', text: 'Other places' },
      { type: 'p', text: 'Licensing is specific to each jurisdiction. For Oregon, see the worked example in the guide to questions to ask a facilitator. Elsewhere, ask which authority issued the credential and check with that authority directly.', links: [
        { label: 'Oregon example: checking a credential', href: '/resources/questions-to-ask' },
      ] },
      { type: 'callout', variant: 'info', text: 'A TFN profile is not license verification. TFN’s application review does not independently confirm state licenses and does not verify service legality in any location. TFN does not sell, source, administer or arrange access to controlled substances or natural medicine services.' },
    ],
  },
  {
    slug: 'integration-support-after-retreat',
    title: 'Support After a Retreat',
    searchTitle: 'Integration Support After a Retreat: What to Expect and Where to Turn',
    subtitle: 'The weeks after you return home, and how to find someone to talk to',
    description:
      'Coming home from a retreat can bring up more than expected. Learn what people report afterwards, what to ask the retreat, and how to find integration support.',
    relatedSlugs: ['integration-basics', 'integration-circles-vs-individual', 'integration-support-cost', 'emergency'],
    nextStep: { label: 'Compare integration profiles', href: '/integration-support', description: 'Compare guides who list integration conversations, then ask about their approach, fees and whether they can work with you where you live. Browsing needs no account, and an inquiry is not a booking.' },
    sourceCheck: {
      date: '2026-11-11',
      scope: 'The sources below inform the description of what some people report after a retreat and the questions about aftercare. Neither is a clinical review of any retreat or service, and no endorsement is implied.',
      sources: [
        { title: 'Fireside Project: Psilocybin retreats, what our caller data tells us', url: 'https://firesideproject.org/blog/psilocybin-retreats-caller-insights' },
        { title: 'Lutkajtis & Evans: Psychedelic integration challenges after a psilocybin retreat (Journal of Psychedelic Studies)', url: 'https://unlimitedsciences.org/research/psychedelic-integration-challenges-participant-experiences-after-a-psilocybin-truffle-retreat-in-the-netherlands/' },
      ],
    },
    blocks: [
      { type: 'p', text: 'A retreat usually ends with a flight or a drive home, and the support that was around you for several days is suddenly gone. Many people find that the weeks afterwards raise more questions than they expected. This guide is about that period: what people report, what to ask the retreat that hosted you, and how to find someone to talk to. It does not cover choosing, preparing for or taking part in a retreat.' },
      { type: 'h3', text: 'What people report after coming home' },
      { type: 'p', text: 'Experiences vary widely, and there is no standard timeline. In one interview study of thirty people who attended a legal retreat in the Netherlands, about a third described a difficulty after returning to ordinary life, such as mood swings, a sense of disconnection from the people around them, or feeling unsupported. In that study these difficulties were temporary and eased with time. Fireside Project, which runs a peer support line, reports that a significant number of its calls come from people who did not receive adequate aftercare after a retreat.' },
      { type: 'ul', items: [
        'Feeling flat or low after a period of intensity.',
        'Finding it hard to explain the experience to family, friends or colleagues.',
        'Old habits returning faster than you hoped.',
        'Questions about meaning, relationships or work that feel urgent.',
      ] },
      { type: 'p', text: 'None of these means something went wrong, and none of them has to be faced alone.' },
      { type: 'h3', text: 'Start with the retreat itself' },
      { type: 'p', text: 'If the retreat promised aftercare, it is reasonable to ask for it. Ask what follow-up is included, how to reach the people who facilitated, and whether they can refer you to someone who works where you live. If the aftercare was a single call or a group chat and you need more, you can say so.' },
      { type: 'h3', text: 'Choosing ongoing support' },
      { type: 'ul', items: [
        'One-to-one integration support: private conversations with a guide. Ask what is outside their role and how they would refer you on.',
        'Integration circles: group conversations, often lower in cost, with different privacy limits.',
        'A licensed therapist or counsellor: the right choice if distress persists, affects sleep, work or relationships, or brings up past trauma.',
        'People you already trust: a friend, partner or community who can simply listen.',
      ] },
      { type: 'p', text: 'You can combine these. A guide who is not a licensed clinician should be clear about that and willing to suggest one when it fits.' },
      { type: 'h3', text: 'When to get help quickly' },
      { type: 'p', text: 'If you have thoughts of harming yourself, cannot sleep for several nights, feel unable to tell what is real, or feel unsafe, contact a healthcare professional or a crisis line now rather than waiting for an integration appointment. The urgent-help guide lists options in the US and elsewhere.' },
      { type: 'h3', text: 'A brief question you can send' },
      { type: 'p', text: '“I recently came back from a retreat and I am looking for integration support. Could you tell me how you work with people in this situation, what is outside your role, and your session length, fees and availability?” Keep diagnoses, medication lists, substance-use history and other sensitive details out of an introductory platform message.' },
      { type: 'callout', variant: 'info', text: 'This guide concerns reflection and support after an experience, not obtaining or taking substances. TFN does not sell, source, administer or arrange access to controlled substances, and does not review or recommend retreats.' },
    ],
  },
  {
    slug: 'choosing-somatic-practitioner',
    title: 'Choosing a Somatic Practitioner',
    searchTitle: 'What Does a Somatic Practitioner Do? How to Choose One',
    subtitle: 'Body-based approaches, training, touch and consent',
    description:
      'Somatic practitioners work with body awareness, breath and movement. What training titles mean, questions about touch and consent, and when to see a therapist.',
    relatedSlugs: ['scope-of-practice', 'certificate-vs-license', 'questions-to-ask', 'red-flags'],
    nextStep: { label: 'Browse somatic profiles', href: '/facilitators?modality=Somatic+practices', description: 'Compare the services people list, then ask directly about their training, approach to touch and whether they can work with you where you live. Profiles are self-reported. Browsing needs no account, and an inquiry is not a booking.' },
    sourceCheck: {
      date: '2026-11-11',
      scope: 'Training requirements and the directory disclosure for one named method were checked against the official sources below. This is a source check, not a clinical review, and does not verify any individual practitioner.',
      sources: [
        { title: 'Somatic Experiencing International: Graduation requirements', url: 'https://traumahealing.org/graduation-requirements/' },
        { title: 'Somatic Experiencing International: Practitioner directory and disclosure', url: 'https://directory.traumahealing.org' },
      ],
    },
    blocks: [
      { type: 'p', text: '“Somatic” describes approaches that pay attention to the body: sensation, breath, posture, movement and how stress shows up physically. The word covers a wide range of practices, from gentle awareness exercises to hands-on bodywork, and from trained therapists to people with a short course. Before comparing practitioners, find out what a session would actually involve.' },
      { type: 'h3', text: 'What a session can involve' },
      { type: 'ul', items: [
        'Talking while noticing sensations in the body.',
        'Breath, grounding or movement exercises.',
        'Hands-on work, such as massage or pressure on specific points.',
        'Practices to take home between sessions.',
      ] },
      { type: 'p', text: 'Ask which of these the practitioner uses, and whether you can choose a session without touch.' },
      { type: 'h3', text: 'Training titles are not the same as a license' },
      { type: 'p', text: 'Many somatic methods have their own training programs and certificates. These can be substantial. For example, Somatic Experiencing International requires 216 contact hours of training for its Somatic Experiencing Practitioner certificate. Its directory also states that practitioners come from a variety of backgrounds, that not all of them hold a professional license with an oversight board, and that it has no oversight or authority over practitioners.' },
      { type: 'p', text: 'A certificate tells you about training in a method. It does not by itself establish a healthcare license, and it does not mean anyone is overseeing the practitioner’s work. Ask which training they completed, when, and how you can check it. If they also say they are a licensed therapist, counsellor or massage therapist, check that license with the authority that issued it.' },
      { type: 'h3', text: 'Touch and consent' },
      { type: 'ul', items: [
        'Will you explain any touch before it happens, and ask each time?',
        'Can I say no to touch, or stop at any point, without needing a reason?',
        'Which parts of the body are never touched?',
        'Can I stay clothed, keep my eyes open, or bring someone with me?',
      ] },
      { type: 'p', text: 'Consent is ongoing: agreeing at the start does not mean agreeing to everything that follows. A practitioner who treats a pause as resistance, or touches without asking, is showing you how they work.' },
      { type: 'h3', text: 'When a therapist is the better choice' },
      { type: 'p', text: 'If you are dealing with trauma symptoms, persistent anxiety or low mood, or experiences that interfere with daily life, consider a licensed mental health professional, including one trained in a body-based method. A somatic coach or bodyworker can complement that care but should not replace it.' },
      { type: 'h3', text: 'A brief question you can send' },
      { type: 'p', text: '“I am interested in somatic work. Could you tell me what a typical session with you involves, whether touch is part of it and how you handle consent, what training you have completed, and your session length, fees and availability?”' },
      { type: 'callout', variant: 'info', text: 'Profiles on TFN are self-reported. TFN does not independently verify training or licenses. Nothing here is medical advice; discuss health concerns with a qualified healthcare professional.' },
    ],
  },
  {
    slug: 'certificate-vs-license',
    title: 'Certificates, Licenses and Titles',
    searchTitle: 'Certified vs Licensed: What a Facilitator’s Credentials Actually Mean',
    subtitle: 'How to read a guide’s qualifications, and how to check them',
    description:
      'Certified, licensed, trained, accredited: these words mean different things. What each tells you about a guide, and how to check a claimed credential yourself.',
    relatedSlugs: ['questions-to-ask', 'colorado-facilitator-license-check', 'scope-of-practice', 'red-flags'],
    blocks: [
      { type: 'p', text: 'Guides describe their qualifications in many ways: certified, licensed, trained, accredited, registered. These words are often used as if they mean the same thing. They do not, and the difference matters when you are deciding whom to trust.' },
      { type: 'h3', text: 'What each word usually means' },
      { type: 'ul', items: [
        'Licensed: a government authority has authorized this person to practise a regulated profession, such as psychology, counselling, medicine or massage therapy, in a specific place. Licenses can usually be checked in a public lookup, and the authority can take complaints and discipline the holder.',
        'Certified: an organization, often a training school or professional body, says the person completed its program or met its standard. Certifications can be meaningful, but most are not issued by a government and do not authorize regulated work.',
        'Trained in: the person attended a course. This tells you little about how long, how rigorous, or whether they finished.',
        'Accredited: usually describes a school or program, not a person. Ask who accredited it.',
      ] },
      { type: 'h3', text: 'Why it matters' },
      { type: 'p', text: 'A license comes with rules, a complaint process and someone who can act on a complaint. A training certificate usually does not. That does not make an unlicensed guide unsafe, or a licensed one automatically right for you. Many good guides offer nonclinical support and hold no license, which is appropriate when they are clear about it. The concern is when the words used suggest more authority than the person has.' },
      { type: 'h3', text: 'How to check a credential' },
      { type: 'ol', items: [
        'Ask for the exact name of the credential, who issued it, the year, and any license number.',
        'For a license, find the issuing authority’s official lookup yourself, starting from a government website rather than a link the person sends.',
        'For a certificate, check whether the training organization publishes a directory of graduates, and read what it says it does and does not verify.',
        'Compare what you find with what you were told, including the place where the license applies.',
      ] },
      { type: 'p', text: 'Licenses are tied to a place. A clinician licensed in one state or country may not be permitted to provide the same clinical service to you somewhere else, including online. Ask where they are licensed and whether that covers where you will be during the session.', links: [
        { label: 'Example: checking a Colorado facilitator license', href: '/resources/colorado-facilitator-license-check' },
      ] },
      { type: 'h3', text: 'Reasons to slow down' },
      { type: 'ul', items: [
        'Calling themselves a therapist or psychologist without naming a license you can check.',
        'Vague answers about where a certificate came from or when it was earned.',
        'Treating a weekend course as equivalent to professional training.',
        'Irritation when you ask to verify something.',
      ] },
      { type: 'p', text: 'A guide who takes their role seriously will expect these questions and answer them plainly.' },
      { type: 'callout', variant: 'info', text: 'A TFN profile is not license or credential verification. Profiles and listed qualifications are self-reported, and TFN’s application review does not independently confirm them.' },
    ],
  },
]

// ─── Lookup helpers ───────────────────────────────────────────────────────────

export function getResource(slug: string): Resource | undefined {
  return resources.find((r) => r.slug === slug)
}

export const RESOURCE_NAV = resources.map(({ slug, title }) => ({ slug, title }))
