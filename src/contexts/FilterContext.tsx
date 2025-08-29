import localForage from "localforage";
import React, { useState, useContext, useEffect, createContext } from "react";
import { FilterContextValue, FilterType } from "../../types";

export const FilterContext = createContext<FilterContextValue | undefined>(undefined);

export const useFilterContext = (): FilterContextValue => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilterContext must be used within FilterProvider');
  }
  return context;
};

export const FilterProvider = ({ children }: { children: React.ReactNode }) => {
  // Content Type Filters
  const [seenFilter, setSeenFilter] = useState<boolean>(true);
  const [readFilter, setReadFilter] = useState<boolean>(true);
  const [imgFilter, setImgFilter] = useState<boolean>(true);
  const [vidFilter, setVidFilter] = useState<boolean>(true);
  const [galFilter, setGalFilter] = useState<boolean>(true);
  const [selfFilter, setSelfFilter] = useState<boolean>(true);
  const [linkFilter, setLinkFilter] = useState<boolean>(true);

  // Image Orientation Filters
  const [imgPortraitFilter, setImgPortraitFilter] = useState<boolean>(true);
  const [imgLandscapeFilter, setImgLandScapeFilter] = useState<boolean>(true);

  // Image Resolution Filters
  const [imgResFilter, setImgResFilter] = useState(false);
  const [imgResXFilter, setImgResXFilter] = useState(0);
  const [imgResYFilter, setImgResYFilter] = useState(0);
  const [imgResExactFilter, setImgResExactFilter] = useState(false);

  // Score Filters
  const [scoreFilter, setScoreFilter] = useState(false);
  const [scoreFilterNum, setScoreFilterNum] = useState<number>();
  const [scoreGreater, setScoreGreater] = useState(false);

  // Filter Management State
  const [updateFilters, setUpdateFilters] = useState(0);
  const [filtersApplied, setFiltersApplied] = useState(0);

  // Complex toggle filter logic from MainContext
  const toggleFilter = (filter: FilterType) => {
    switch (filter) {
      case "seen":
        setSeenFilter((r) => !r);
        break;
      case "read":
        setReadFilter((r) => !r);
        break;
      case "images":
        // Toggle off orientation filters if no videos and images
        if (imgFilter === true && vidFilter === false) {
          setImgPortraitFilter(false);
          setImgLandScapeFilter(false);
        }
        // Toggle orientation filters on automatically if enabling images
        if (
          imgFilter === false &&
          vidFilter === false &&
          imgPortraitFilter === false &&
          imgLandscapeFilter === false
        ) {
          setImgPortraitFilter(true);
          setImgLandScapeFilter(true);
        }
        setImgFilter((i) => !i);
        break;
      case "videos":
        // Toggle off orientation filters if no videos and images
        if (imgFilter === false && vidFilter === true) {
          setImgPortraitFilter(false);
          setImgLandScapeFilter(false);
        }
        // Toggle orientation filter on automatically if enabling videos
        if (
          vidFilter === false &&
          imgFilter === false &&
          imgPortraitFilter === false &&
          imgLandscapeFilter === false
        ) {
          setImgPortraitFilter(true);
          setImgLandScapeFilter(true);
        }
        setVidFilter((v) => !v);
        break;
      case "galleries":
        setGalFilter((g) => !g);
        break;
      case "self":
        setSelfFilter((s) => !s);
        break;
      case "links":
        setLinkFilter((l) => !l);
        break;
      case "score":
        setScoreFilter((s) => !s);
        break;
      case "portrait":
        // If orientation toggled on and video+images toggled off, toggle them on
        if (
          imgPortraitFilter === false &&
          imgFilter === false &&
          vidFilter === false
        ) {
          setImgFilter(true);
          setVidFilter(true);
        }
        // If both orientations toggled off, also toggle off image/video filter
        if (imgPortraitFilter === true && imgLandscapeFilter === false) {
          setImgFilter(false);
          setVidFilter(false);
        }
        setImgPortraitFilter((p) => !p);
        break;
      case "landscape":
        // If orientation toggled on and video+images toggled off, toggle them on
        if (
          imgLandscapeFilter === false &&
          imgFilter === false &&
          vidFilter === false
        ) {
          setImgFilter(true);
          setVidFilter(true);
        }
        // If both orientations toggled off, also toggle off image/video filter
        if (imgLandscapeFilter === true && imgPortraitFilter === false) {
          setImgFilter(false);
          setVidFilter(false);
        }
        setImgLandScapeFilter((l) => !l);
        break;
    }
  };

  // Apply filters logic from MainContext
  const applyFilters = (
    filters = {
      seenFilter,
      readFilter,
      imgFilter,
      vidFilter,
      galFilter,
      selfFilter,
      linkFilter,
      imgPortraitFilter,
      imgLandscapeFilter,
    }
  ): void => {
    // Need filtersApplied number to be unique each time filters are applied to prevent shortening items array for Masonic when react-query updates stale feed
    // Positive will be used to determine if any filters are active

    setFiltersApplied((f) => {
      // Any filter on
      const {
        seenFilter,
        readFilter,
        imgFilter,
        vidFilter,
        galFilter,
        selfFilter,
        linkFilter,
        imgPortraitFilter,
        imgLandscapeFilter,
      } = filters;
      if (
        seenFilter === false ||
        readFilter === false ||
        imgFilter === false ||
        vidFilter === false ||
        galFilter === false ||
        selfFilter === false ||
        linkFilter === false ||
        imgPortraitFilter === false ||
        imgLandscapeFilter === false
      ) {
        return Math.abs(f) + 1;
      }
      return (Math.abs(f) + 1) * -1;
    });
  };

  // Initialization useEffect - load from storage
  useEffect(() => {
    const initSettings = async () => {


      // Load filter settings with localforage fallback to localStorage pattern
      const loadSeenFilter = async () => {
        let saved_seenFilter = await localForage.getItem("seenFilter");
        if (saved_seenFilter !== null) {
          if (saved_seenFilter === false) {
            setSeenFilter(false);
          } else {
            setSeenFilter(true);
          }
          localStorage.removeItem("seenFilter");
        } else {

          let local_seenFilter = localStorage.getItem("seenFilter");
          if (local_seenFilter?.includes("false")) {
            setSeenFilter(false);
          } else {
            setSeenFilter(true);
          }
        }
      };

      const loadReadFilter = async () => {
        let saved_readFilter = await localForage.getItem("readFilter");
        if (saved_readFilter !== null) {
          if (saved_readFilter === false) {
            setReadFilter(false);
          } else {
            setReadFilter(true);
          }
          localStorage.removeItem("readFilter");
        } else {
          let local_readFilter = localStorage.getItem("readFilter");
          if (local_readFilter?.includes("false")) {
            setReadFilter(false);
          } else {
            setReadFilter(true);
          }
        }
      };

      const loadImgFilter = async () => {
        let saved_imgFilter = await localForage.getItem("imgFilter");
        if (saved_imgFilter !== null) {
          if (saved_imgFilter === false) {
            setImgFilter(false);
          } else {
            setImgFilter(true);
          }
          localStorage.removeItem("imgFilter");
        } else {
          let local_imgFilter = localStorage.getItem("imgFilter");
          if (local_imgFilter?.includes("false")) {
            setImgFilter(false);
          } else {
            setImgFilter(true);
          }
        }
      };

      const loadVidFilter = async () => {
        let saved_vidFilter = await localForage.getItem("vidFilter");
        if (saved_vidFilter !== null) {
          if (saved_vidFilter === false) {
            setVidFilter(false);
          } else {
            setVidFilter(true);
          }
          localStorage.removeItem("vidFilter");
        } else {
          let local_vidFilter = localStorage.getItem("vidFilter");
          if (local_vidFilter?.includes("false")) {
            setVidFilter(false);
          } else {
            setVidFilter(true);
          }
        }
      };

      const loadGalFilter = async () => {
        let saved_galFilter = await localForage.getItem("galFilter");
        if (saved_galFilter !== null) {
          if (saved_galFilter === false) {
            setGalFilter(false);
          } else {
            setGalFilter(true);
          }
          localStorage.removeItem("galFilter");
        } else {
          let local_galFilter = localStorage.getItem("galFilter");
          if (local_galFilter?.includes("false")) {
            setGalFilter(false);
          } else {
            setGalFilter(true);
          }
        }
      };

      const loadSelfFilter = async () => {
        let saved_selfFilter = await localForage.getItem("selfFilter");
        if (saved_selfFilter !== null) {
          if (saved_selfFilter === false) {
            setSelfFilter(false);
          } else {
            setSelfFilter(true);
          }
          localStorage.removeItem("selfFilter");
        } else {
          let local_selfFilter = localStorage.getItem("selfFilter");
          if (local_selfFilter?.includes("false")) {
            setSelfFilter(false);
          } else {
            setSelfFilter(true);
          }
        }
      };

      const loadLinkFilter = async () => {
        let saved_linkFilter = await localForage.getItem("linkFilter");
        if (saved_linkFilter !== null) {
          if (saved_linkFilter === false) {
            setLinkFilter(false);
          } else {
            setLinkFilter(true);
          }
          localStorage.removeItem("linkFilter");
        } else {
          let local_linkFilter = localStorage.getItem("linkFilter");
          if (local_linkFilter?.includes("false")) {
            setLinkFilter(false);
          } else {
            setLinkFilter(true);
          }
        }
      };

      const loadImgPortraitFilter = async () => {
        let saved_imgPortraitFilter = await localForage.getItem("imgPortraitFilter");
        if (saved_imgPortraitFilter !== null) {
          if (saved_imgPortraitFilter === false) {
            setImgPortraitFilter(false);
          } else {
            setImgPortraitFilter(true);
          }
          localStorage.removeItem("imgPortraitFilter");
        } else {
          let local_imgPortraitFilter = localStorage.getItem("imgPortraitFilter");
          if (local_imgPortraitFilter?.includes("false")) {
            setImgPortraitFilter(false);
          } else {
            setImgPortraitFilter(true);
          }
        }
      };

      const loadImgLandscapeFilter = async () => {
        let saved_imgLandscapeFilter = await localForage.getItem("imgLandscapeFilter");
        if (saved_imgLandscapeFilter !== null) {
          if (saved_imgLandscapeFilter === false) {
            setImgLandScapeFilter(false);
          } else {
            setImgLandScapeFilter(true);
          }
          localStorage.removeItem("imgLandscapeFilter");
        } else {
          let local_imgLandscapeFilter = localStorage.getItem("imgLandscapeFilter");
          if (local_imgLandscapeFilter?.includes("false")) {
            setImgLandScapeFilter(false);
          } else {
            setImgLandScapeFilter(true);
          }
        }
      };

      const loadImgResFilter = async () => {
        let saved_imgResFilter = await localForage.getItem("imgResFilter");
        if (saved_imgResFilter !== null) {
          setImgResFilter(saved_imgResFilter as boolean);
        }
      };

      const loadImgResXFilter = async () => {
        let saved_imgResXFilter = await localForage.getItem("imgResXFilter");
        if (saved_imgResXFilter !== null) {
          setImgResXFilter(saved_imgResXFilter as number);
        }
      };

      const loadImgResYFilter = async () => {
        let saved_imgResYFilter = await localForage.getItem("imgResYFilter");
        if (saved_imgResYFilter !== null) {
          setImgResYFilter(saved_imgResYFilter as number);
        }
      };

      const loadImgResExactFilter = async () => {
        let saved_imgResExactFilter = await localForage.getItem("imgResExactFilter");
        if (saved_imgResExactFilter !== null) {
          setImgResExactFilter(saved_imgResExactFilter as boolean);
        }
      };

      const loadScoreFilter = async () => {
        let saved_scoreFilter = await localForage.getItem("scoreFilter");
        if (saved_scoreFilter !== null) {
          setScoreFilter(saved_scoreFilter as boolean);
        }
      };

      const loadScoreFilterNum = async () => {
        let saved_scoreFilterNum = await localForage.getItem("scoreFilterNum");
        if (saved_scoreFilterNum !== null) {
          setScoreFilterNum(saved_scoreFilterNum as number);
        }
      };

      const loadScoreGreater = async () => {
        let saved_scoreGreater = await localForage.getItem("scoreGreater");
        if (saved_scoreGreater !== null) {
          setScoreGreater(saved_scoreGreater as boolean);
        }
      };

      // Load all settings
      await Promise.all([
        loadSeenFilter(),
        loadReadFilter(),
        loadImgFilter(),
        loadVidFilter(),
        loadGalFilter(),
        loadSelfFilter(),
        loadLinkFilter(),
        loadImgPortraitFilter(),
        loadImgLandscapeFilter(),
        loadImgResFilter(),
        loadImgResXFilter(),
        loadImgResYFilter(),
        loadImgResExactFilter(),
        loadScoreFilter(),
        loadScoreFilterNum(),
        loadScoreGreater(),
      ]);
    };

    initSettings();
  }, []);

  // Persistence useEffects - save to storage when values change
  useEffect(() => {
    if (seenFilter !== undefined) {
      localForage.setItem("seenFilter", seenFilter);
    }
  }, [seenFilter]);

  useEffect(() => {
    if (readFilter !== undefined) {
      localForage.setItem("readFilter", readFilter);
    }
  }, [readFilter]);

  useEffect(() => {
    if (imgFilter !== undefined) {
      localForage.setItem("imgFilter", imgFilter);
    }
  }, [imgFilter]);

  useEffect(() => {
    if (vidFilter !== undefined) {
      localForage.setItem("vidFilter", vidFilter);
    }
  }, [vidFilter]);

  useEffect(() => {
    if (galFilter !== undefined) {
      localForage.setItem("galFilter", galFilter);
    }
  }, [galFilter]);

  useEffect(() => {
    if (selfFilter !== undefined) {
      localForage.setItem("selfFilter", selfFilter);
    }
  }, [selfFilter]);

  useEffect(() => {
    if (linkFilter !== undefined) {
      localForage.setItem("linkFilter", linkFilter);
    }
  }, [linkFilter]);

  useEffect(() => {
    if (imgPortraitFilter !== undefined) {
      localForage.setItem("imgPortraitFilter", imgPortraitFilter);
    }
  }, [imgPortraitFilter]);

  useEffect(() => {
    if (imgLandscapeFilter !== undefined) {
      localForage.setItem("imgLandscapeFilter", imgLandscapeFilter);
    }
  }, [imgLandscapeFilter]);

  useEffect(() => {
    if (imgResFilter !== undefined) {
      localForage.setItem("imgResFilter", imgResFilter);
    }
  }, [imgResFilter]);

  useEffect(() => {
    if (imgResXFilter !== undefined) {
      localForage.setItem("imgResXFilter", imgResXFilter);
    }
  }, [imgResXFilter]);

  useEffect(() => {
    if (imgResYFilter !== undefined) {
      localForage.setItem("imgResYFilter", imgResYFilter);
    }
  }, [imgResYFilter]);

  useEffect(() => {
    if (imgResExactFilter !== undefined) {
      localForage.setItem("imgResExactFilter", imgResExactFilter);
    }
  }, [imgResExactFilter]);

  useEffect(() => {
    if (scoreFilter !== undefined) {
      localForage.setItem("scoreFilter", scoreFilter);
    }
  }, [scoreFilter]);

  useEffect(() => {
    if (scoreFilterNum !== undefined) {
      localForage.setItem("scoreFilterNum", scoreFilterNum);
    }
  }, [scoreFilterNum]);

  useEffect(() => {
    if (scoreGreater !== undefined) {
      localForage.setItem("scoreGreater", scoreGreater);
    }
  }, [scoreGreater]);

  const contextValue: FilterContextValue = {
    // Content Type Filters
    seenFilter,
    setSeenFilter,
    readFilter,
    setReadFilter,
    imgFilter,
    setImgFilter,
    vidFilter,
    setVidFilter,
    galFilter,
    setGalFilter,
    selfFilter,
    setSelfFilter,
    linkFilter,
    setLinkFilter,

    // Image Orientation Filters
    imgPortraitFilter,
    setImgPortraitFilter,
    imgLandscapeFilter,
    setImgLandScapeFilter,

    // Image Resolution Filters
    imgResFilter,
    setImgResFilter,
    imgResXFilter,
    setImgResXFilter,
    imgResYFilter,
    setImgResYFilter,
    imgResExactFilter,
    setImgResExactFilter,

    // Score Filters
    scoreFilter,
    setScoreFilter,
    scoreFilterNum,
    setScoreFilterNum,
    scoreGreater,
    setScoreGreater,

    // Filter Management
    toggleFilter,
    updateFilters,
    setUpdateFilters,
    applyFilters,
    filtersApplied,
    filtersActive: filtersApplied > 0,
    filtersAppliedCount: Math.abs(filtersApplied),
  };

  return (
    <FilterContext.Provider value={contextValue}>
      {children}
    </FilterContext.Provider>
  );
};