import { getTranslation } from "@/lib/i18n/server";
import { AlertTriangle } from "lucide-react";
import { SAFETY_DISCLAIMER } from "@/lib/constants";

interface SafetyDisclaimerProps {
  compact?: boolean;
}

export async function SafetyDisclaimer({
  compact = false,
}: SafetyDisclaimerProps) {
  const { t } = await getTranslation();
  if (compact) {
    return (
      <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
        <p>{t(SAFETY_DISCLAIMER)}</p>
      </div>
    );
  }

  return (
    <div className="bg-background pb-7">
      <div className="network-shell">
        <div className="flex items-start gap-3">
          <AlertTriangle
            className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <p className="max-w-5xl text-xs leading-relaxed text-muted-foreground">
            {t(SAFETY_DISCLAIMER)}
          </p>
        </div>
      </div>
    </div>
  );
}
