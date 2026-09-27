import { getTranslation } from "@/lib/i18n/server";
import Link from "next/link";
import FacilitatorsPage from "./facilitators/page";
import type { DirectorySearchParams } from "@/lib/facilitator-search";
import type { Metadata } from "next";
import {
  ArrowRight,

  BookOpen,







} from "lucide-react";
import { APP_NAME, APP_TAGLINE, SITE_URL } from "@/lib/constants";

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

export default async function Home({ searchParams }: { searchParams: Promise<DirectorySearchParams> }) {
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
      <FacilitatorsPage searchParams={searchParams} />

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

      <section className="network-shell py-10">
        <h2 className="text-2xl font-medium">{t('A little guidance goes a long way.')}</h2>
        <div className="mt-5 flex flex-wrap gap-6 text-sm text-emerald-800 underline underline-offset-4">
          <Link href="/resources/questions-to-ask">{t('Questions worth asking')}</Link>
          <Link href="/resources/red-flags">{t('Recognizing red flags')}</Link>
          <Link href="/resources">{t('Explore the resource library')}</Link>
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
