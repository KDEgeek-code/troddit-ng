import React from 'react';
import ColumnCardOptions from "../ColumnCardOptions";
import Toggles from "../Toggles";

const LayoutSettings: React.FC = () => (
  <>
    <label className="flex flex-row items-center justify-between w-full p-2 my-2 hover:cursor-pointer">
      <span className="flex flex-col gap-0.5">
        <span>Column Count</span>
        <span className="mr-2 text-xs opacity-70">
          Sets column count in your feeds. "Auto" changes columns by window width
        </span>
      </span>
      <div className="flex-none w-24">
        <ColumnCardOptions mode="columns" />
      </div>
    </label>

    {[
      "expandedSubPane",
      "autoHideNav",
      "uniformHeights",
      "wideUI",
      // "syncWideUI",
      "postWideUI",
      "preferSideBySide",
      "disableSideBySide",
    ].map((s: any) => (
      <Toggles
        key={s}
        setting={s}
        withSubtext={true}
        externalStyles="rounded-lg group hover:bg-th-highlight p-2 cursor-pointer"
      />
    ))}
  </>
);

export default LayoutSettings;

