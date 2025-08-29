import React from 'react';
import ToggleFilters from "../../ToggleFilters";
import FilterEntities from "../FilterEntities";

type FilterSetting = "self" | "links" | "images" | "videos" | "portrait" | "landscape" | "read" | "seen";

const externalStyles = "rounded-lg group hover:bg-th-highlight p-2 cursor-pointer";

const FiltersSettings: React.FC = () => (
  <>
    {([
      "self",
      "links",
      "images",
      "videos",
      "portrait",
      "landscape",
      "read",
      "seen",
    ] as FilterSetting[]).map((f) => (
      <div key={f}>
        {/* Quick filter toggles */}
        <ToggleFilters filter={f as any} withSubtext={true} />
      </div>
    ))}
    <div className={"py-1 "}>
      <FilterEntities />
    </div>
  </>
);

export default FiltersSettings;
