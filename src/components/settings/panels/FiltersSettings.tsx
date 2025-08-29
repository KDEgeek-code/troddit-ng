import React from 'react';
import Toggles from "../Toggles";
import FilterEntities from "../FilterEntities";

const FiltersSettings: React.FC = () => (
  <>
    {[
      "self",
      "links",
      "images",
      "videos",
      "portrait",
      "landscape",
      "read",
      "seen",
    ].map((f) => (
      <div key={f}>
        {/* Quick filter toggles */}
        {/* @ts-ignore */}
        <Toggles setting={f} withSubtext={true} externalStyles="rounded-lg group hover:bg-th-highlight p-2 cursor-pointer" />
      </div>
    ))}
    <div className={"py-1 "}>
      <FilterEntities />
    </div>
  </>
);

export default FiltersSettings;

