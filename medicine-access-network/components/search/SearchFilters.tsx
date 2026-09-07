"use client";

import { useTranslation } from "@/components/i18n/TranslationProvider";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { MODALITIES, MODALITY_CATEGORIES } from "@/lib/constants";
import {
  directoryHref,
  filterSearchParams,
  parseFacilitatorFilters,
} from "@/lib/facilitator-search";

const EXPERIENCE_OPTIONS = [
  { label: "Any", value: "" },
  { label: "2+ yrs", value: "2" },
  { label: "5+ yrs", value: "5" },
  { label: "10+ yrs", value: "10" },
] as const;

export function SearchFilters() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const filters = parseFacilitatorFilters(searchParams);
  const activeCount =
    filters.modalities.length +
    Number(filters.remote) +
    Number(filters.donation) +
    Number(Boolean(filters.minExperience));

  const navigate = (params: URLSearchParams) => {
    startTransition(() =>
      router.push(directoryHref(params), { scroll: false }),
    );
  };

  const toggle = (key: string, value: string, checked: boolean) => {
    const params = filterSearchParams(filters);
    if (key === "modality") {
      const current = params
        .getAll("modality")
        .filter((item) => item !== value);
      params.delete("modality");
      current.forEach((item) => params.append("modality", item));
      if (checked) params.append("modality", value);
    } else if (checked) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    navigate(params);
  };

  const clearFilters = () => {
    navigate(
      filterSearchParams({
        ...filters,
        modalities: [],
        remote: false,
        donation: false,
        minExperience: 0,
      }),
    );
  };

  return (
    <aside
      aria-label={t("Filter guides")}
      className="w-full shrink-0 rounded-2xl border border-stone-200 bg-[#f0f1e9] p-5 lg:w-64 lg:p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-medium tracking-tight text-stone-900">
          {t("Refine your search")}
        </h2>
        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            disabled={isPending}
            onClick={clearFilters}
            className="text-xs text-emerald-800"
          >
            {" "}
            {t("Clear filters")}{" "}
          </Button>
        )}
      </div>

      <fieldset
        disabled={isPending}
        aria-busy={isPending}
        className="mt-6 min-w-0 space-y-6"
      >
        <legend className="sr-only">{t("Guide search filters")}</legend>
        <fieldset className="space-y-3">
          <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-600">
            {t("Format and pricing")}
          </legend>
          <div className="flex min-h-8 items-center gap-2">
            <Checkbox
              id="remote"
              checked={filters.remote}
              onCheckedChange={(checked) => toggle("remote", "true", checked)}
            />
            <label
              htmlFor="remote"
              className="cursor-pointer text-sm text-stone-700"
            >
              {t("Online sessions available")}
            </label>
          </div>
          <div className="flex min-h-8 items-center gap-2">
            <Checkbox
              id="donation"
              checked={filters.donation}
              onCheckedChange={(checked) => toggle("donation", "true", checked)}
            />
            <label
              htmlFor="donation"
              className="cursor-pointer text-sm text-stone-700"
            >
              {t("Donation-based pricing")}
            </label>
          </div>
          <p className="text-xs leading-relaxed text-stone-600">
            {t(
              "Online support depends on where you live. Donation-based guides may set a minimum. Confirm both before arranging a session.",
            )}
          </p>
        </fieldset>

        <fieldset className="border-t border-stone-200 pt-5">
          <legend className="text-xs font-semibold uppercase tracking-wider text-stone-600">
            {t("Self-reported practice")}
          </legend>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {EXPERIENCE_OPTIONS.map(({ label, value }) => (
              <button
                key={value}
                type="button"
                aria-pressed={filters.minExperience === Number(value)}
                onClick={() => toggle("min_exp", value, Boolean(value))}
                className={cn(
                  "min-h-9 rounded-full px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700",
                  filters.minExperience === Number(value)
                    ? "bg-emerald-700 text-white"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200",
                )}
              >
                {t(label)}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-stone-600">
            {t(
              "Years may include personal practice. This is not a measure of training or professional experience.",
            )}
          </p>
        </fieldset>

        <div className="border-t border-stone-200 pt-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-600">
            {t("Type of support")}
          </h3>
          <p className="mt-1 text-xs text-stone-600">
            {t("Matches any selected type.")}
          </p>
          <div className="mt-3 space-y-2">
            {Object.entries(MODALITY_CATEGORIES).map(([key, label]) => {
              const modalities = MODALITIES.filter(
                (modality) => modality.category === key,
              );
              const selected = modalities.filter((modality) =>
                filters.modalities.includes(modality.name),
              ).length;
              return (
                <details
                  key={key}
                  open={selected > 0 ? true : undefined}
                  className="rounded-lg border border-stone-200 bg-white/60 px-3"
                >
                  <summary className="cursor-pointer py-3 text-sm font-medium text-stone-700">
                    {t(label)}
                    {selected > 0 && ` (${selected})`}
                  </summary>
                  <div className="space-y-2 pb-3">
                    {modalities.map((modality) => (
                      <div
                        key={modality.id}
                        className="flex min-h-8 items-center gap-2"
                      >
                        <Checkbox
                          id={`filter-${modality.id}`}
                          checked={filters.modalities.includes(modality.name)}
                          onCheckedChange={(checked) =>
                            toggle("modality", modality.name, checked)
                          }
                        />
                        <label
                          htmlFor={`filter-${modality.id}`}
                          className="cursor-pointer text-sm text-stone-700"
                        >
                          {t(modality.name)}
                        </label>
                      </div>
                    ))}
                  </div>
                </details>
              );
            })}
          </div>
        </div>
      </fieldset>
      <p role="status" className="sr-only">
        {isPending ? t("Updating guide results…") : ""}
      </p>
    </aside>
  );
}
