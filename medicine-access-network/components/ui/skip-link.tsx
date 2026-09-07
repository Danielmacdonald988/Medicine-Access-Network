import { getTranslation } from "@/lib/i18n/server";
export async function SkipLink() {
  const { t } = await getTranslation();
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[9999] focus:rounded-md focus:bg-emerald-700 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:shadow-lg focus:outline-none"
    >
      {" "}
      {t("Skip to main content")}{" "}
    </a>
  );
}
