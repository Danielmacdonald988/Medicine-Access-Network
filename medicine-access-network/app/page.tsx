import { getTranslation } from "@/lib/i18n/server";
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

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslation();
  const title = t("Psychedelic Preparation & Integration — {appName}", {
    appName: APP_NAME,
  });
  const description = t(APP_TAGLINE);
  return {
    title,
    description,
    alternates: { canonical: "/" },
    openGraph: { title, description, url: SITE_URL },
  };
}

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

export default async function Home() {
  const { t } = await getTranslation();
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

          <h1 id="hero-title">
            {" "}
            {t("Your next chapter.")} <br />
            <em>{t("The right support.")}</em>
          </h1>
          <p className={styles.eyebrow}>
            <span className={styles.dot} aria-hidden />{" "}
            {t("Human connection. New possibilities.")}{" "}
          </p>
          <p className={styles.heroDescription}>
            {" "}
            {t(
              "Find your people in psychedelic preparation, integration, breathwork, and beyond. A more personal path starts here.",
            )}{" "}
          </p>
          <p className={styles.heroNote}>
            <HeartHandshake size={20} strokeWidth={1.5} aria-hidden />{" "}
            {t("Wherever you are in your journey, you belong.")}{" "}
          </p>
        </div>
        <div className={styles.heroImage}>
          <Image
            src="/forest-path-hero.webp"
            alt={t(
              "Morning sunlight across a quiet forest path with a distant walker",
            )}
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
              {" "}
              {t("A little guidance.")} <br />
              {t("A world of possibility.")}{" "}
            </p>
          </div>
          <span className={styles.imageOverline}>{t("Room to grow")}</span>
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
            <p className={styles.eyebrow}>
              {t("Many paths. One place to begin.")}
            </p>
            <h2 id="practice-heading">
              <em>{t("Support that meets you where you are.")}</em>
            </h2>
          </div>
          <p className={styles.aside}>{t("Follow your curiosity.")}</p>
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
              <h3>{t(name)}</h3>
              <p>{t(description)}</p>
              <span className={styles.cardLink}>
                {t("Explore {practice}", { practice: t(name) })}{" "}
                <ArrowRight size={16} aria-hidden />
              </span>
            </Link>
          ))}
        </div>
        <p className={styles.exploreFootnote}>
          {" "}
          {t("You don’t need to have it all figured out.")}{" "}
          <Link href="/resources" className={styles.inlineLink}>
            {" "}
            {t("Start with a little curiosity")}{" "}
            <ArrowRight size={16} aria-hidden />
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
              <p className={styles.eyebrow}>
                {t("Less searching. More connecting.")}
              </p>
              <h2 id="process-heading">
                <em>{t("A human way forward.")}</em>
              </h2>
            </div>
            <p className={styles.sectionIntro}>
              {" "}
              {t("A little clarity.")} <br />
              {t("A connection on your terms.")}{" "}
            </p>
          </div>
          <div className={styles.steps}>
            {steps.map(({ title, body, href, action }, i) => (
              <article key={title}>
                <span className={styles.stepNumber} aria-hidden>
                  {" "}
                  0{i + 1}
                </span>
                <h3>{t(title)}</h3>
                <p>{t(body)}</p>
                <Link href={href} className={styles.inlineLink}>
                  {t(action)}
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
          <p className={styles.eyebrow}>{t("Open minds. Grounded values.")}</p>
          <h2 id="approach-heading">
            {" "}
            {t("Big possibilities.")} <br />
            <em>{t("Human first. Always.")}</em>
          </h2>
          <p>
            {" "}
            {t(
              "Finding support is personal. The process should feel clear, welcoming, and entirely yours.",
            )}{" "}
          </p>
          <Link href="/about#profile-review" className={styles.inlineLink}>
            {" "}
            {t("Our approach to profile review")}{" "}
            <ArrowRight size={17} aria-hidden />
          </Link>
        </div>
        <div className={styles.values}>
          <article>
            <ShieldCheck aria-hidden />
            <div>
              <h3>{t("Clarity before commitment")}</h3>
              <p>
                {" "}
                {t(
                  "Ask about training, boundaries, costs, and consent. Profile review is a starting point, not a guarantee of safety or qualifications.",
                )}{" "}
              </p>
            </div>
          </article>
          <article>
            <HeartHandshake aria-hidden />
            <div>
              <h3>{t("Your pace. Your choice.")}</h3>
              <p>
                {" "}
                {t(
                  "Explore without pressure. You decide what fits, who you connect with, and when. It’s always okay to pause or say no.",
                )}{" "}
              </p>
            </div>
          </article>
          <article>
            <Sprout aria-hidden />
            <div>
              <h3>{t("Room for different paths")}</h3>
              <p>
                {" "}
                {t(
                  "From a first breathwork session to integration support, your starting point is welcome. Services and legal availability vary by location.",
                )}{" "}
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
            <p className={styles.eyebrow}>
              {t("For the people who hold space")}
            </p>
            <h2 id="facilitator-heading">
              {" "}
              {t("Your work matters.")} <br />
              <em>{t("Let’s help people find you.")}</em>
            </h2>
            <p>
              {" "}
              {t("Bring your practice to a growing community.")} <br />{" "}
              {t(
                "Free to apply. Every profile is reviewed before publication.",
              )}{" "}
            </p>
            <Link href="/onboarding/facilitator" className={styles.creamButton}>
              {" "}
              {t("List your practice")} <ArrowUpRight size={18} aria-hidden />
            </Link>
          </div>
          <div className={styles.foundingNote}>
            <Flower2 strokeWidth={0.8} aria-hidden />
            <p>
              {" "}
              {t("Rooted in connection.")} <br /> {t("Growing together.")}{" "}
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
          <p className={styles.eyebrow}>{t("A little more clarity")}</p>
          <h2 id="questions-heading">
            {" "}
            {t("Good questions.")} <br />
            <em>{t("Clear answers.")}</em>
          </h2>
          <Link href="/contact" className={styles.inlineLink}>
            {" "}
            {t("Contact us")} <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
        <div>
          {faqs.map(([question, answer]) => (
            <details key={question}>
              <summary>{t(question)}</summary>
              <p>{t(answer)}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
