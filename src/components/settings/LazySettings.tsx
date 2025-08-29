import React, { Suspense } from "react";
import dynamic from "next/dynamic";

// Use next/dynamic to avoid SSR warnings
const AppearanceSettings = dynamic(() => import('./panels/AppearanceSettings'), {
  ssr: false,
  suspense: true
});
const LayoutSettings = dynamic(() => import('./panels/LayoutSettings'), {
  ssr: false,
  suspense: true
});
const MediaSettings = dynamic(() => import('./panels/MediaSettings'), {
  ssr: false,
  suspense: true
});
const CommentsSettings = dynamic(() => import('./panels/CommentsSettings'), {
  ssr: false,
  suspense: true
});
const FiltersSettings = dynamic(() => import('./panels/FiltersSettings'), {
  ssr: false,
  suspense: true
});
const BehaviorSettings = dynamic(() => import('./panels/BehaviorSettings'), {
  ssr: false,
  suspense: true
});
const HistorySettings = dynamic(() => import('./panels/HistorySettings'), {
  ssr: false,
  suspense: true
});

export type LazySettingsPanelProps = {
  category:
    | "Appearance"
    | "Layout"
    | "Media"
    | "Comments"
    | "Filters"
    | "Behavior"
    | "History";
};

export const LazySettingsPanel = ({ category }: LazySettingsPanelProps) => {
  const panel = (() => {
    switch (category) {
      case "Appearance":
        return <AppearanceSettings />;
      case "Layout":
        return <LayoutSettings />;
      case "Media":
        return <MediaSettings />;
      case "Comments":
        return <CommentsSettings />;
      case "Filters":
        return <FiltersSettings />;
      case "Behavior":
        return <BehaviorSettings />;
      case "History":
        return <HistorySettings />;
      default:
        console.warn(`Unknown settings category: ${category}`);
        return <div className="py-4 text-sm opacity-70">Unknown settings category</div>;
    }
  })();

  return (
    <Suspense
      fallback={<div className="py-4 text-sm opacity-70">Loading settings…</div>}
    >
      {panel}
    </Suspense>
  );
};

export default LazySettingsPanel;
