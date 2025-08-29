import React from 'react';
import Toggles from "../Toggles";
import IntInput from "../IntInput";

const BehaviorSettings: React.FC = () => (
  <>
    {["autoRead", "autoSeen", "infiniteLoading", "autoRefreshFeed"].map((s: any) => (
      <Toggles
        key={s}
        setting={s}
        withSubtext={true}
        externalStyles="rounded-lg group hover:bg-th-highlight p-2 cursor-pointer"
      />
    ))}
    {["slowRefreshInterval", "fastRefreshInterval"].map((s: any) => (
      <IntInput key={s} setting={s} />
    ))}
    {["refreshOnFocus", "askToUpdateFeed", "autoRefreshComments"].map((s: any) => (
      <Toggles
        key={s}
        setting={s}
        withSubtext={true}
        externalStyles="rounded-lg group hover:bg-th-highlight p-2 cursor-pointer"
      />
    ))}
  </>
);

export default BehaviorSettings;

