"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import {
  GUIDE_HUB,
  GUIDE_STEPS,
  GUIDE_TOTAL,
  guideNextHref,
  guidePrevHref,
  isGuideMode,
  parseGuideStep,
  type GuideStepId,
} from "@/lib/hydro-guide";
import { trackCta } from "@/lib/analytics";

export function HydroGuideBar({ stepHint }: { stepHint?: number }) {
  const search = useSearchParams();
  const active = isGuideMode(search);
  const step = parseGuideStep(search.get("step")) ?? (active ? (stepHint as GuideStepId | undefined) : null);

  useEffect(() => {
    if (!active || !step) return;
    trackCta(`guide-step-${step}`, GUIDE_STEPS[step - 1]?.title || `步骤${step}`);
  }, [active, step]);

  if (!active || !step) return null;

  const meta = GUIDE_STEPS[step - 1];

  return (
    <div className="hydro-guide-bar" role="navigation" aria-label="5 分钟导览">
      <span>
        导览 <strong>{step}/{GUIDE_TOTAL}</strong>
        {meta ? ` · ${meta.title}` : ""}
      </span>
      <div className="hg-actions">
        <Link href={guidePrevHref(step)} className="ghost">
          上一步
        </Link>
        <Link
          href={guideNextHref(step)}
          onClick={() =>
            trackCta(
              step >= GUIDE_TOTAL ? "guide-complete" : "guide-next",
              step >= GUIDE_TOTAL ? "导览完成" : `下一步-from-${step}`,
            )
          }
        >
          {step >= GUIDE_TOTAL ? "完成导览" : "下一步"}
        </Link>
        <Link href={GUIDE_HUB} className="ghost">
          返回总览
        </Link>
      </div>
    </div>
  );
}
