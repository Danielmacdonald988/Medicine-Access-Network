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
        text: 'Guides on this platform offer coaching, preparation support, integration conversations, and related legal wellness services. They are not therapists, psychiatrists, or medical providers. Before working with anyone, confirm that what they offer matches what you need.',
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
        text: 'Certain health conditions and medications affect how coaching and wellness work may land for you. This is especially true if your preparation relates to any kind of altered state practice. Talk with your doctor or psychiatrist about your plans before beginning. Be honest about your full health picture with any guide you consider working with.',
      },
      {
        type: 'ul',
        items: [
          'Disclose any psychiatric diagnosis, including depression, anxiety, bipolar disorder, PTSD, or psychosis',
          'List all medications — including antidepressants, antipsychotics, mood stabilisers, and heart medications',
          'Mention any relevant physical health conditions, especially cardiovascular',
          'Be honest about your recent substance use history',
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
          'Know your crisis resources in advance (see our Emergency Disclaimer)',
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
        text: 'If you are in acute distress or crisis, stop and reach out to a crisis service now. In the US, call or text 988. The Fireside Project (62-FIRESIDE) specialises in difficult psychedelic experiences.',
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
        text: 'Integration coaches are not licensed mental health professionals and cannot diagnose, treat, or prescribe. If you need clinical support, please see a licensed therapist or psychiatrist.',
      },
    ],
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
        text: 'Guides on this platform are not licensed therapists or medical providers. They offer coaching, preparation support, integration conversations, and related legal wellness services. If you need clinical care, please seek a licensed professional.',
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
        text: 'A guide who accepts anyone without any intake process — no questions about your history, your medications, your mental health, or your reasons for reaching out — is not operating safely. Screening is not a barrier; it is evidence of care.',
      },
      {
        type: 'h3',
        text: 'Substance-related red flags',
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Any guide who offers to source, provide, supply, or administer controlled substances is operating outside the law and outside the scope of what this platform supports. Remove yourself from that situation.',
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
    title: 'Contraindications & Safety',
    subtitle: 'Health factors that increase risk in intensive wellness work',
    description:
      'An overview of health conditions and medications that may interact with intensive wellness practices, and why honest disclosure to both your doctor and any guide matters.',
    blocks: [
      {
        type: 'callout',
        variant: 'warning',
        text: 'This page is for general information only. It is not medical advice, diagnosis, or treatment. Always consult a licensed doctor, psychiatrist, or other qualified healthcare provider before pursuing any wellness or coaching work, especially if you have a health condition or take medications.',
      },
      {
        type: 'p',
        text: 'A contraindication is a factor that increases the risk of harm in a given practice. Responsible guides screen for contraindications before working with anyone. You should also understand them yourself — so you can make informed decisions and have honest conversations with both your doctor and any guide you consider working with.',
      },
      {
        type: 'h3',
        text: 'Psychiatric and neurological conditions',
      },
      {
        type: 'p',
        text: 'Certain mental health conditions significantly affect how intensive wellness practices land. This does not mean people with these conditions can never engage in personal growth work — but they require more careful support, and some practices may not be appropriate at all.',
      },
      {
        type: 'ul',
        items: [
          'Personal or family history of psychosis, schizophrenia, or schizoaffective disorder',
          'Bipolar disorder — especially if unmedicated or recently destabilised',
          'Active suicidal ideation or recent suicide attempt',
          'Severe dissociative disorders',
          'Active, untreated PTSD with significant instability',
          'Borderline personality disorder in acute crisis',
        ],
      },
      {
        type: 'h3',
        text: 'Medications',
      },
      {
        type: 'p',
        text: 'Many psychiatric and cardiovascular medications interact in ways that matter — both with altered state practices and with the physiological demands of intensive bodywork such as breathwork. The following are frequently cited in safety literature; this is not an exhaustive list.',
      },
      {
        type: 'ul',
        items: [
          'MAOIs (monoamine oxidase inhibitors) — used for depression, social anxiety, and Parkinson\'s',
          'Lithium — used for bipolar disorder',
          'Antipsychotics (e.g. quetiapine, olanzapine, risperidone)',
          'SSRIs and SNRIs — the most commonly prescribed antidepressants',
          'Tricyclic antidepressants',
          'Beta-blockers and other cardiovascular medications',
          'Blood thinners',
          'Stimulants (e.g. those prescribed for ADHD)',
        ],
      },
      {
        type: 'p',
        text: 'Do not stop or adjust any medication without speaking to your prescribing doctor first. Do not assume a guide will know your full medication picture — tell them explicitly.',
      },
      {
        type: 'h3',
        text: 'Physical health conditions',
      },
      {
        type: 'ul',
        items: [
          'Cardiovascular conditions, including heart disease, hypertension, or arrhythmias',
          'Epilepsy or seizure disorders',
          'Pregnancy or possibility of pregnancy',
          'Active infection, fever, or significant illness',
          'Recent surgery or acute physical injury',
          'Severe respiratory conditions (particularly relevant for breathwork)',
          'Glaucoma (particularly relevant for some body-based practices)',
        ],
      },
      {
        type: 'h3',
        text: 'Why disclosure matters',
      },
      {
        type: 'p',
        text: 'Guides who conduct proper intake will ask about your health history. Answer honestly. Withholding information does not protect you — it removes the guide\'s ability to make an informed decision about whether and how to work with you, and removes your own ability to give informed consent.',
      },
      {
        type: 'p',
        text: 'A guide who agrees to work with you without gathering any health history is not operating safely, regardless of how skilled or experienced they appear.',
      },
      {
        type: 'h3',
        text: 'When to see a doctor first',
      },
      {
        type: 'p',
        text: 'If any of the above apply to you — or if you are uncertain — speak with your doctor or psychiatrist before beginning any intensive wellness work. Bring them specific information about what you are planning so they can give you informed guidance.',
      },
      {
        type: 'callout',
        variant: 'emergency',
        text: 'If you or someone you know is in crisis: call 988 (US Suicide & Crisis Lifeline), text HOME to 741741 (Crisis Text Line), or call your local emergency services. Do not wait.',
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
        text: 'Guides on this platform are not licensed therapists, psychologists, or medical doctors. They do not diagnose or treat conditions, prescribe medication, or provide clinical mental health care. If you need those services, please seek a licensed professional.',
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
    title: 'Emergency Disclaimer',
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
        text: 'Crisis resources',
      },
      {
        type: 'p',
        text: 'If you are in the United States and are experiencing a mental health crisis — including suicidal thoughts, severe distress, or a difficult psychedelic or altered-state experience — the following services are available around the clock:',
      },
      {
        type: 'ul',
        items: [
          '988 Suicide & Crisis Lifeline — call or text 988 (US). Available 24/7 for anyone in emotional distress or suicidal crisis.',
          'Crisis Text Line — text HOME to 741741 to reach a trained crisis counsellor.',
          'Fireside Project — call or text 62-FIRESIDE (623-473-7433). Specialises in supporting people through difficult psychedelic and non-ordinary state experiences.',
          'Zendo Project — psychedelic harm reduction support and training. zendoproject.org',
          'SAMHSA Helpline — 1-800-662-4357. Free, confidential treatment referrals and information about mental health and substance use.',
        ],
      },
      {
        type: 'h3',
        text: 'What this platform is not',
      },
      {
        type: 'p',
        text: 'Guides on this platform are coaches and practitioners offering legal wellness services. They are not emergency responders, licensed therapists, or medical providers. They cannot provide emergency intervention, crisis stabilisation, or clinical assessment.',
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
        text: 'This platform does not coordinate, facilitate, source, or have any involvement in the use of controlled substances. If you have consumed a substance and are experiencing a medical emergency, call 911 (or your local emergency number) immediately. Many jurisdictions have medical amnesty laws — your safety is more important than legal concerns in a medical emergency.',
      },
    ],
  },
]

// ─── Lookup helpers ───────────────────────────────────────────────────────────

export function getResource(slug: string): Resource | undefined {
  return resources.find((r) => r.slug === slug)
}

export const RESOURCE_NAV = resources.map(({ slug, title }) => ({ slug, title }))
