"use client";

import { useTranslation } from "@/components/i18n/TranslationProvider";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen } from "lucide-react";
import { RESOURCE_NAV } from "@/lib/resources";

export function ResourceNav() {
  const { t } = useTranslation();
  const pathname = usePathname();

  return (
    <nav aria-label={t("Safety library")}>
      <div className="mb-3 flex items-center gap-2">
        <BookOpen className="size-4 text-emerald-700" />
        <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
          {" "}
          {t("Safety Library")}{" "}
        </span>
      </div>
      <ul className="space-y-0.5">
        {RESOURCE_NAV.map(({ slug, title }) => {
          const href = `/resources/${slug}`;
          const active = pathname === href;
          return (
            <li key={slug}>
              <Link
                href={href}
                className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-emerald-50 font-medium text-emerald-800"
                    : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                }`}
              >
                {t(title)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
