import React from 'react';
import Toggles from "../Toggles";
import IntInput from "../IntInput";

type BehaviorSetting = "autoRead" | "autoSeen" | "infiniteLoading" | "autoRefreshFeed" | "slowRefreshInterval" | "fastRefreshInterval" | "refreshOnFocus" | "askToUpdateFeed" | "autoRefreshComments";

const externalStyles = "rounded-lg group hover:bg-th-highlight p-2 cursor-pointer";

const BehaviorSettings: React.FC = () => (
  <>
    {(["autoRead", "autoSeen", "infiniteLoading", "autoRefreshFeed"] as const).map((s) => (
      <Toggles
        key={s}
        setting={s}
        withSubtext={true}
        externalStyles={externalStyles}
      />
    ))}
    {(["slowRefreshInterval", "fastRefreshInterval"] as const).map((s) => (
      <IntInput key={s} setting={s} />
    ))}
    {(["refreshOnFocus", "askToUpdateFeed", "autoRefreshComments"] as const).map((s) => (
      <Toggles
        key={s}
        setting={s}
        withSubtext={true}
        externalStyles={externalStyles}
      />
    ))}
  </>
);

export default BehaviorSettings;
