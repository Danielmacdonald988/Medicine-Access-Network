"use client";

import { isInternalQa } from "@/lib/internal-qa";
import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";

function removePrivateParameters(event: BeforeSendEvent) {
  if (isInternalQa()) return null;
  const url = new URL(event.url);
  url.search = "";
  url.hash = "";
  return { ...event, url: url.toString() };
}

export function TrafficAnalytics() {
  return <Analytics beforeSend={removePrivateParameters} />;
}
