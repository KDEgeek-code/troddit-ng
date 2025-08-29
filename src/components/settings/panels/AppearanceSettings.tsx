import React from 'react';
import ThemeSelector from "../ThemeSelector";
import CardStyleDemo from "../CardStyleDemo";
import ColumnCardOptions from "../ColumnCardOptions";
import Toggles from "../Toggles";

const AppearanceSettings: React.FC = () => (
  <>
    <label className="flex flex-row items-center justify-between w-full p-2 my-2 hover:cursor-pointer">
      <span className="flex flex-col gap-0.5">
        <span>Theme</span>
        <span className="mr-2 text-xs opacity-70">
          Select a theme. System defaults to light or dark from your system settings.
        </span>
      </span>
      <div className="flex-none w-24">
        <ThemeSelector />
      </div>
    </label>
    <label className="flex flex-row items-center justify-between w-full p-2 my-2 hover:cursor-pointer">
      <span className="flex flex-col gap-0.5">
        <span>Card Style</span>
        <span className="mr-2 text-xs opacity-70">
          <CardStyleDemo />
        </span>
      </span>
      <div className="flex-none w-24">
        <ColumnCardOptions mode="cards" />
      </div>
    </label>
    {["compactLinkPics", "dimRead", "showAwardings", "showFlairs"].map((s: any) => (
      <Toggles
        key={s}
        setting={s}
        withSubtext={true}
        externalStyles="rounded-lg group hover:bg-th-highlight p-2 cursor-pointer"
      />
    ))}
  </>
);

export default AppearanceSettings;

