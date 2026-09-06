// ─── Content types ────────────────────────────────────────────────────────────

export type Block =
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'h3'; text: string }
  | { type: 'callout'; variant: 'warning' | 'info' | 'emergency'; text: string }

export interface Resource {
  slug: string
  title: string
  subtitle: string
  description: string // for <meta>
  blocks: Block[]
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
        text: 'Listings on this platform describe coaching, preparation support, integration conversations, and related legal wellness services. A listing does not establish a professional license or a clinical care relationship. Ask what capacity the guide is working in, check any claimed license with its issuing body, and confirm that the service matches your needs.',
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
        text: 'This platform does not coordinate, facilitate, source, or have any involvement in the use of controlled substances. Guides here offer legal coaching and support services only.',
      },
    ],
  },

  {
    slug: 'integration-basics',
    title: 'Integration Basics',
    subtitle: 'How to process and ground what arises in your work',
    description:
      'An introduction to integration — what it means, why it matters, and how to support yourself after any significant personal or wellness experience.',
    blocks: [
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
        text: 'Insight without integration tends to fade. A meaningful experience — whether in a breathwork session, a somatic session, or any other deep personal work — can surface material that is new, confusing, or emotionally charged. Without time and support to process it, that material can be left unresolved.',
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
    subtitle: 'How to vet a guide before committing',
    description:
      'A practical list of questions to ask any integration coach, guide, or facilitator before working with them — covering background, safety, scope, and logistics.',
    blocks: [
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
        text: 'Most guides working in this space are doing so with genuine care and integrity. But as with any unregulated field, there are people who cause harm — sometimes through incompetence, sometimes through exploitation. Knowing what to look for protects you.',
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
        text: 'Coaching is a future-focused, goal-oriented practice. Coaches help clients identify what they want, build clarity and accountability, and take steps toward change. Coaching is generally unregulated — there is no licensing body, no protected title, and no minimum training requirement, though many coaches pursue certification programmes.',
      },
      {
        type: 'ul',
        items: [
          'Future-focused: oriented toward where you want to go, not where you came from',
          'Does not diagnose or treat mental health conditions',
          'Not a substitute for therapy when clinical support is needed',
          'No protected title — anyone can call themselves a coach',
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
        text: 'Psychotherapy is a licensed, regulated clinical practice. Therapists, psychotherapists, counsellors, psychologists, and social workers are trained and licensed to assess, diagnose, and treat mental health conditions. They operate within a formal ethical and legal framework including mandatory confidentiality, duty of care, and professional accountability.',
      },
      {
        type: 'ul',
        items: [
          'Can diagnose and treat mental health conditions',
          'Licensed and regulated by professional bodies',
          'Subject to mandatory ethical standards and disciplinary processes',
          'Often past-oriented — explores roots of current patterns',
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
        text: 'Guides here offer legal coaching and support services — preparation conversations, integration support, breathwork facilitation, somatic coaching, harm reduction education, and similar practices. This is meaningful, valuable work. It is also distinct from therapy and medicine.',
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
        type: 'ul',
        items: [
          '988 Suicide & Crisis Lifeline — call or text 988 (US). Available 24/7 for anyone in emotional distress or suicidal crisis.',
          'Crisis Text Line — text HOME to 741741 in the US for free crisis support, available 24/7.',
        ],
      },
      {
        type: 'h3',
        text: 'Psychedelic peer support — limited hours',
      },
      {
        type: 'p',
        text: 'Fireside Project — call or text 623-473-7433 in the US, daily from 11 a.m. to 11 p.m. Pacific. It offers non-clinical emotional support during or after psychedelic experiences. It is not an emergency service, a suicide hotline, or medical care. For immediate danger or a medical emergency, call 911; for suicidal crisis, call or text 988.',
      },
      {
        type: 'h3',
        text: 'Treatment information and event support',
      },
      {
        type: 'ul',
        items: [
          'SAMHSA National Helpline — 1-800-662-4357. A free, confidential US treatment referral and information service, available 24/7. Use 988 for immediate crisis support.',
          'Zendo Project — peer support at participating events, plus harm reduction training and educational resources. It is not a general emergency phone line; check its website for current event services.',
        ],
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
      date: '2026-09-06',
      scope: 'Support-line numbers, hours, and service scope checked against the providers below.',
      sources: [
        { title: '988 Suicide & Crisis Lifeline', url: 'https://988lifeline.org/' },
        { title: 'Crisis Text Line', url: 'https://www.crisistextline.org/' },
        { title: 'Fireside Project: Psychedelic Support Line', url: 'https://firesideproject.org/support-line' },
        { title: 'SAMHSA National Helpline', url: 'https://www.samhsa.gov/find-help/helplines/national-helpline' },
        { title: 'Zendo Project: Event Services', url: 'https://zendoproject.org/volunteer/' },
      ],
    },
  },
]

// ─── Lookup helpers ───────────────────────────────────────────────────────────

export function getResource(slug: string): Resource | undefined {
  return resources.find((r) => r.slug === slug)
}

export const RESOURCE_NAV = resources.map(({ slug, title }) => ({ slug, title }))
