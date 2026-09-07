import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Flower2,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  Sprout,
  Waves,
  Wind,
} from "lucide-react";
import { APP_NAME, APP_TAGLINE, SITE_URL } from "@/lib/constants";
import { HomeSearch } from "@/components/search/HomeSearch";
import styles from "./home.module.css";

export const metadata: Metadata = {
  title: `Psychedelic Preparation & Integration — ${APP_NAME}`,
  description: APP_TAGLINE,
  alternates: { canonical: "/" },
  openGraph: {
    title: `Psychedelic Preparation & Integration — ${APP_NAME}`,
    description: APP_TAGLINE,
    url: SITE_URL,
  },
};

const practices = [
  {
    name: "Psychedelic support",
    icon: Sparkles,
    color: "peach",
    description:
      "A thoughtful starting point for preparation, education, and integration.",
    href: "/facilitators?modality=Preparation+Coaching&modality=Ceremony+Preparation&modality=Integration+Coaching&modality=Psychedelic+Integration&modality=Harm+Reduction+Education",
  },
  {
    name: "Breathwork",
    icon: Wind,
    color: "yellow",
    description:
      "Make space to slow down, breathe, and reconnect with yourself.",
    href: "/facilitators?q=breathwork",
  },
  {
    name: "Integration",
    icon: Sprout,
    color: "green",
    description: "Bring your experiences into the everyday, at your own pace.",
    href: "/facilitators?q=integration",
  },
  {
    name: "Somatic practices",
    icon: Waves,
    color: "lavender",
    description: "Explore a more connected relationship with your body.",
    href: "/facilitators?q=somatic",
  },
];

const steps = [
  {
    title: "Find your starting point",
    body: "Explore practices and facilitator profiles. Browse freely, without creating an account.",
    href: "/facilitators",
    action: "Explore the directory",
  },
  {
    title: "Get to know the person",
    body: "Read about their approach, training, safety practices, and fees. Save a few guides to compare.",
    href: "/resources/questions-to-ask",
    action: "Questions worth asking",
  },
  {
    title: "Start a conversation",
    body: "Use a guide’s messaging link or send an inquiry. Discuss fit and boundaries before deciding together.",
    href: "/resources/red-flags",
    action: "Know what to look for",
  },
];

const faqs = [
  [
    "Do I need to know exactly what I’m looking for?",
    "No. Start with the safety library or browse profiles. Take time to learn about different practices before reaching out. You do not need an account to explore or contact a guide.",
  ],
  [
    "What does profile review mean?",
    "Profiles require admin approval before publication. This is an administrative review, not independent verification of qualifications or a guarantee of safety. Ask about relevant training and check any claimed license with its issuing body.",
  ],
  [
    "Does reaching out book or charge me?",
    "No. An inquiry starts a conversation about fit. It does not confirm a session, and there is no fee to send one. Agree on the service, cost, and cancellation terms directly with the facilitator.",
  ],
  [
    "What should I share in a first message?",
    "A brief introduction, the support you want, and your preferred format are enough. Leave out diagnoses, medications, trauma details, and other sensitive information. Discuss necessary screening directly with an appropriately qualified professional.",
  ],
  [
    "Can I find or buy substances here?",
    "No. This platform is for legal support services, including education, preparation, and integration. It does not sell, source, or coordinate access to controlled substances.",
  ],
];

export default function Home() {
  return (
    <div className={styles.home}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: APP_NAME,
            url: SITE_URL,
          }).replace(/</g, "\\u003c"),
        }}
      />
      <section
        className={`network-shell ${styles.hero}`}
        aria-labelledby="hero-title"
      >
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>
            <span className={styles.dot} aria-hidden />
            Human connection. New possibilities.
          </p>
          <h1 id="hero-title">
            Your next chapter.
            <br />
            The right <em>support.</em>
          </h1>
          <p className={styles.heroDescription}>
            Find your people in psychedelic preparation, integration,
            breathwork, and beyond. A more personal path starts here.
          </p>
          <p className={styles.heroNote}>
            <HeartHandshake size={20} strokeWidth={1.5} aria-hidden />
            Wherever you are in your journey, you belong.
          </p>
        </div>
        <div className={styles.heroImage}>
          <Image
            src="/forest-path-hero.webp"
            alt="Morning sunlight across a quiet forest path with a distant walker"
            fill
            sizes="(max-width: 760px) calc(100vw - 40px), (max-width: 1340px) 42vw, 510px"
            preload
            className={styles.forestImage}
          />
          <div className={styles.imageCaption}>
            <span>
              <Flower2 size={24} strokeWidth={1.4} aria-hidden />
            </span>
            <p>
              A little guidance.
              <br />A world of possibility.
            </p>
          </div>
          <span className={styles.imageOverline}>Room to grow</span>
        </div>
        <HomeSearch />
      </section>

      <section
        id="explore"
        className={`network-shell ${styles.section}`}
        aria-labelledby="practice-heading"
      >
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>Many paths. One place to begin.</p>
            <h2 id="practice-heading">
              Support that meets you <em>where you are.</em>
            </h2>
          </div>
          <p className={styles.aside}>Follow your curiosity.</p>
        </div>
        <div className={styles.practiceGrid}>
          {practices.map(({ name, icon: Icon, color, description, href }) => (
            <Link
              key={name}
              href={href}
              className={`${styles.practiceCard} ${styles[color]}`}
            >
              <div className={styles.practiceTop}>
                <span className={styles.practiceIcon}>
                  <Icon size={26} strokeWidth={1.35} aria-hidden />
                </span>
                <ArrowUpRight size={22} aria-hidden />
              </div>
              <h3>{name}</h3>
              <p>{description}</p>
              <span className={styles.cardLink}>
                Explore {name.toLowerCase()}{" "}
                <ArrowRight size={16} aria-hidden />
              </span>
            </Link>
          ))}
        </div>
        <p className={styles.exploreFootnote}>
          You don’t need to have it all figured out.{" "}
          <Link href="/resources" className={styles.inlineLink}>
            Start with a little curiosity <ArrowRight size={16} aria-hidden />
          </Link>
        </p>
      </section>

      <section
        id="how-it-works"
        className={styles.howSection}
        aria-labelledby="process-heading"
      >
        <div className="network-shell">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Less searching. More connecting.</p>
              <h2 id="process-heading">
                A human way <em>forward.</em>
              </h2>
            </div>
            <p className={styles.sectionIntro}>
              A little clarity.
              <br />A connection on your terms.
            </p>
          </div>
          <div className={styles.steps}>
            {steps.map(({ title, body, href, action }, i) => (
              <article key={title}>
                <span className={styles.stepNumber} aria-hidden>
                  0{i + 1}
                </span>
                <h3>{title}</h3>
                <p>{body}</p>
                <Link href={href} className={styles.inlineLink}>
                  {action}
                  <ArrowRight size={15} aria-hidden />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="our-approach"
        className={`network-shell ${styles.approach}`}
        aria-labelledby="approach-heading"
      >
        <div className={styles.approachCopy}>
          <p className={styles.eyebrow}>Open minds. Grounded values.</p>
          <h2 id="approach-heading">
            Big possibilities.
            <br />
            <em>Human first. Always.</em>
          </h2>
          <p>
            Finding support is personal. The process should feel clear,
            welcoming, and entirely yours.
          </p>
          <Link href="/about#profile-review" className={styles.inlineLink}>
            Our approach to profile review <ArrowRight size={17} aria-hidden />
          </Link>
        </div>
        <div className={styles.values}>
          <article>
            <ShieldCheck aria-hidden />
            <div>
              <h3>Clarity before commitment</h3>
              <p>
                Ask about training, boundaries, costs, and consent. Profile
                review is a starting point, not a guarantee of safety or
                qualifications.
              </p>
            </div>
          </article>
          <article>
            <HeartHandshake aria-hidden />
            <div>
              <h3>Your pace. Your choice.</h3>
              <p>
                Explore without pressure. You decide what fits, who you connect
                with, and when. It’s always okay to pause or say no.
              </p>
            </div>
          </article>
          <article>
            <Sprout aria-hidden />
            <div>
              <h3>Room for different paths</h3>
              <p>
                From a first breathwork session to integration support, your
                starting point is welcome. Services and legal availability vary
                by location.
              </p>
            </div>
          </article>
        </div>
      </section>

      <section
        className={`network-shell ${styles.facilitatorSection}`}
        aria-labelledby="facilitator-heading"
      >
        <div className={styles.facilitatorBanner}>
          <div>
            <p className={styles.eyebrow}>For the people who hold space</p>
            <h2 id="facilitator-heading">
              Your work matters.
              <br />
              <em>Let’s help people find you.</em>
            </h2>
            <p>
              Bring your practice to a growing community.
              <br />
              Free to apply. Every profile is reviewed before publication.
            </p>
            <Link href="/onboarding/facilitator" className={styles.creamButton}>
              List your practice <ArrowUpRight size={18} aria-hidden />
            </Link>
          </div>
          <div className={styles.foundingNote}>
            <Flower2 strokeWidth={0.8} aria-hidden />
            <p>
              Rooted in connection.
              <br />
              Growing together.
            </p>
          </div>
        </div>
      </section>

      <section
        className={`network-shell ${styles.faq}`}
        aria-labelledby="questions-heading"
      >
        <div>
          <BookOpen size={25} strokeWidth={1.5} aria-hidden />
          <p className={styles.eyebrow}>A little more clarity</p>
          <h2 id="questions-heading">
            Good questions.
            <br />
            <em>Clear answers.</em>
          </h2>
          <Link href="/contact" className={styles.inlineLink}>
            Contact us <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
        <div>
          {faqs.map(([question, answer]) => (
            <details key={question}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
