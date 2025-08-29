import React from 'react';
import Toggles from "../Toggles";
import DefaultSortSelector from "../DefaultSortSelector";

const CommentsSettings: React.FC = () => (
  <>
    {[
      "showUserIcons",
      "showUserFlairs",
      "autoCollapseComments",
      "ribbonCollapseOnly",
      "collapseChildrenOnly",
      "defaultCollapseChildren",
    ].map((s: any) => (
      <Toggles
        key={s}
        setting={s}
        withSubtext={true}
        externalStyles={"rounded-lg group hover:bg-th-highlight p-2 cursor-pointer"}
      />
    ))}
    <label className="flex flex-row items-center justify-between w-full p-2 my-2 hover:cursor-pointer">
      <span className="flex flex-col gap-0.5">
        <span>Default Comment Sort</span>
        <span className="mr-2 text-xs opacity-70">Default sort order for Comments on Posts</span>
      </span>
      <div className="flex-none min-w-[6rem]">
        <DefaultSortSelector mode="comments" />
      </div>
    </label>
  </>
);

export default CommentsSettings;

