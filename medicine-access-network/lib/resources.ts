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
    relatedSlugs: ['questions-to-ask', 'scope-of-practice'],
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
]

// ─── Lookup helpers ───────────────────────────────────────────────────────────

export function getResource(slug: string): Resource | undefined {
  return resources.find((r) => r.slug === slug)
}

export const RESOURCE_NAV = resources.map(({ slug, title }) => ({ slug, title }))
