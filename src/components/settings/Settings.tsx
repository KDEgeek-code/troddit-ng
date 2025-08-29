import { Tab } from "@headlessui/react";
import React from "react";
import { useState, useRef, useEffect, createRef, useMemo, useCallback } from "react";
import { AiOutlineQuestionCircle } from "react-icons/ai";

import {
  BiImages,
  BiComment,
  BiDetail,
  BiCog,
  BiPaint,
  BiHistory,
} from "react-icons/bi";
import { BsColumnsGap } from "react-icons/bs";
import { FiFilter } from "react-icons/fi";
import LazySettingsPanel from "./LazySettings";

class SettingsErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch() {}
  render() {
    if (this.state.hasError) {
      return <div className="py-4 text-sm opacity-70">Failed to load settings panel.</div>;
    }
    return this.props.children as any;
  }
}

const Settings = () => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const icons = "w-6 h-6 flex-none ";
  const categories = useMemo(
    () => ({
      Appearance: { icon: <BiPaint className={icons} /> },
      Layout: { icon: <BsColumnsGap className={icons} /> },
      Media: { icon: <BiImages className={icons} /> },
      Comments: { icon: <BiComment className={icons} /> },
      Filters: { icon: <FiFilter className={icons} /> },
      Behavior: { icon: <BiCog className={icons} /> },
      History: { icon: <BiHistory className={icons} /> },
    }),
    []
  );

  const refs = useMemo(() => {
    return Object.keys(categories).reduce((acc: any, value) => {
      acc[value] = createRef<HTMLDivElement>();
      return acc;
    }, {} as Record<string, React.RefObject<HTMLDivElement>>);
  }, [categories]);

  const handleCategoryChange = useCallback((id) => {
    refs[id].current.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [refs]);

  return (
    <Tab.Group
      as={"div"}
      vertical
      className="relative flex w-full max-w-3xl max-h-[80vh]  "
      selectedIndex={selectedIndex}
      onChange={(index) => {
        setSelectedIndex(index);
        handleCategoryChange(Object.keys(categories)[index]);
      }}
    >
      <h1 className="absolute ml-0.5 mr-auto text-xl font-semibold -top-10">
        Settings
      </h1>
      <Tab.List
        className={
          "flex flex-col border rounded-lg overflow-y-auto  py-4 w-16 sm:w-44 px-0 pb-0 flex-none  sm:mr-4 overflow-hidden border-r-0 sm:border-r  rounded-r-none sm:rounded-r-lg bg-th-post border-th-border2 shadow-md " +
          " scrollbar-thin scrollbar-thumb-th-scrollbar scrollbar-track-transparent scrollbar-thumb-rounded-full scrollbar-track-rounded-full bg-th-post border-th-border2"
        }
      >
        {Object.keys(categories).map((category, i) => (
          <Tab key={category} className={" outline-none "}>
            {({ selected }) => (
              <div
                className={
                  (selected ? " font-bold opacity-100 bg-th-highlight " : "") +
                  " cursor-pointer opacity-50 hover:opacity-80 select-none flex my-1 "
                }
                onClick={() => {
                  refs[category].current.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }}
              >
                <div className="w-1 h-12 mt-0 mr-2 bg-th-scrollbar "></div>

                <div className="flex items-center justify-start py-2 pl-1">
                  <span className="">{categories[category]?.icon}</span>
                  <span className="hidden sm:block sm:pl-3">{category}</span>
                </div>
              </div>
            )}
          </Tab>
        ))}
      </Tab.List>
      <Tab.Panels
        className={
          "border  shadow-md  rounded-lg rounded-l-none sm:rounded-l-lg p-2 pt-5   overflow-y-auto  flex-grow select-none outline-none" +
          " scrollbar-thin scrollbar-thumb-th-scrollbar scrollbar-track-transparent scrollbar-thumb-rounded-full scrollbar-track-rounded-full bg-th-post border-th-border2"
        }
      >
        {Object.keys(categories).map((category, i) => (
          <div
            ref={refs[category]}
            key={category}
            className={" sm:px-5  py-2 pt-6 "}
          >
            <h1 className="text-xl font-semibold ">{category}</h1>
            <SettingsErrorBoundary>
              <LazySettingsPanel category={category as any} />
            </SettingsErrorBoundary>
        </div>
      ))}
      </Tab.Panels>
    </Tab.Group>
  );
};

export default React.memo(Settings);
