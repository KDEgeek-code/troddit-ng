import { useTheme } from "next-themes";
import ReactSwitch from "react-switch";
import { BsX, BsCheck } from "react-icons/bs";
import { useFilterContext } from "../contexts/FilterContext";
import React, { useEffect, useState, useCallback } from "react";
import useRefresh from "../hooks/useRefresh";
import { ToggleFiltersProps, FilterType, FilterContextValue } from "../../types";

const ToggleFilters = ({ 
  filter, 
  withSubtext = false, 
  quickToggle = false,
  name,
  tooltip,
  disabled = false
}: ToggleFiltersProps & {
  withSubtext?: boolean;
  quickToggle?: boolean;
}) => {
  const context = useFilterContext();
  const {invalidateKey} = useRefresh(); 
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [toggled, setToggled] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Type-safe mapping of FilterType to FilterContextValue keys
  const keyMap: Record<FilterType, keyof FilterContextValue> = {
    seen: 'seenFilter',
    read: 'readFilter', 
    images: 'imgFilter',
    videos: 'vidFilter',
    galleries: 'galFilter',
    self: 'selfFilter',
    links: 'linkFilter',
    score: 'scoreFilter',
    portrait: 'imgPortraitFilter',
    landscape: 'imgLandscapeFilter',
    imgRes: 'imgResFilter'
  } as const;

  // Derive values directly from context
  const filterKey = keyMap[filter];
  const filterValue = context[filterKey];
  const checked = !!filterValue;
  
  const subtext = (() => {
    switch (filter) {
      case "seen": return "Will attempt to filter seen posts if toggled off";
      case "read": return "Filter or show read posts";
      case "images": return "Filter or show images";
      case "videos": return "Filter or show videos (or gifs). Only applies to native videos.";
      case "galleries": return "Filter or show image galleries";
      case "self": return "Filter or show 'self' posts.";
      case "links": return "Filter or show posts with an external link source";
      case "score": return "Filter by score threshold";
      case "portrait": return "Filter or show images / videos with portrait orientation";
      case "landscape": return "Filter or show images / videos with landscape orientation";
      case "imgRes": return "Filter by image resolution";
      default: return "";
    }
  })();

  const title = `${filterValue ? "Showing" : "Filtering"} ${
    filter === "links"
      ? "link posts"
      : filter === "self"
      ? "self posts"
      : filter === "read"
      ? "read posts"
      : filter === "portrait" || filter === "landscape"
      ? `${filter} images/videos`
      : filter
  }`;

  useEffect(() => {
    if (quickToggle && toggled) {
      context.applyFilters(); 
      context.setUpdateFilters(n => n + 1);
      invalidateKey(["feed"], true); 
    }
  }, [quickToggle, toggled, context, invalidateKey]);
  

  const [onHandleColor, setOnHandleColor] = useState<string>();
  const [offHandleColor, setOffHandleColor] = useState<string>();
  const [onColor, setOnColor] = useState<string>();
  const [offColor, setOffColor] = useState<string>();
  const [updateTheme, setUpdateTheme] = useState(0);
  useEffect(() => {
    setUpdateTheme((t) => t + 1);
  }, [resolvedTheme]);
  useEffect(() => {
    let toggleColor = window
      .getComputedStyle(document.documentElement)
      .getPropertyValue("--toggleColor")
      .trim();
    let toggleHandleColor = window
      .getComputedStyle(document.documentElement)
      .getPropertyValue("--toggleHandleColor")
      .trim();

    setOnHandleColor(() => toggleHandleColor
    );
    setOffHandleColor(() => toggleHandleColor
    );
    setOnColor(() => toggleColor);
    setOffColor(() =>toggleColor
    );
  }, [updateTheme]);


  if (!mounted) return null;

  return (
    <div
      title={title}
      onClick={(e) => e.stopPropagation()}
      className="rounded-lg group hover:bg-th-highlight"
    >
      <label className="flex flex-row items-center justify-between p-2 cursor-pointer ">
        <span className="flex flex-col">
          <span className="capitalize ">{filter}</span>
          {withSubtext && (
            <span className="mr-2 text-xs opacity-70">{subtext}</span>
          )}
        </span>
        <ReactSwitch
          onChange={useCallback(() => {
            context.toggleFilter(filter);
            if (quickToggle) {
              context.applyFilters(); 
              context.setUpdateFilters(n => n + 1); 
              invalidateKey(["feed"], true);
            } else {
              setToggled(t => !t);
            }
          }, [context, filter, quickToggle, invalidateKey])}
          checked={checked}
          checkedHandleIcon={<div></div>}
          checkedIcon={
            <div className="flex items-center justify-center h-full text-lg ">
              <BsCheck />
            </div>
          }
          uncheckedHandleIcon={<div></div>}
          uncheckedIcon={
            <div className="flex items-center justify-center h-full text-lg ">
              <BsX />
            </div>
          }
          offColor={offColor}
          onColor={onColor}
          offHandleColor={offHandleColor}
          onHandleColor={onHandleColor}
        />
      </label>
    </div>
  );
};

export default ToggleFilters;
