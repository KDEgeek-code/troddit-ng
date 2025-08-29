import localForage from "localforage";
import { migrateStorageValue, persistToStorage } from "../utils/storage";
import React, { useState, useContext, useEffect, createContext } from "react";
import { UIContextValue, CardStyle } from "../../types";

export const UIContext = createContext<UIContextValue | undefined>(undefined);

export const useUIContext = (): UIContextValue => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUIContext must be used within UIProvider');
  }
  return context;
};

export const UIProvider = ({ children }: { children: React.ReactNode }) => {
  // UI Layout Settings
  const [wideUI, setWideUI] = useState<boolean>();
  const [saveWideUI, setSaveWideUI] = useState<boolean>();
  const [postWideUI, setPostWideUI] = useState<boolean>();
  const [syncWideUI, setSyncWideUI] = useState<boolean>(false);

  // Card and Display Settings
  const [cardStyle, setCardStyle] = useState<CardStyle>("default");
  const [columnOverride, setColumnOverride] = useState<number>();
  const [uniformHeights, setUniformHeights] = useState<boolean>();

  // Navigation and Layout Preferences
  const [autoHideNav, setAutoHideNav] = useState<boolean>();
  const [expandedSubPane, setExpandedSubPane] = useState<boolean>();

  // Content Display Options
  const [compactLinkPics, setCompactLinkPics] = useState<boolean>();
  const [preferSideBySide, setPreferSideBySide] = useState<boolean>();
  const [disableSideBySide, setDisableSideBySide] = useState<boolean>();
  const [dimRead, setDimRead] = useState<boolean>();

  // Visual Element Toggles
  const [showAwardings, setShowAwardings] = useState<boolean>();
  const [showFlairs, setShowFlairs] = useState<boolean>();
  const [showUserIcons, setShowUserIcons] = useState<boolean>();
  const [showUserFlairs, setShowUserFlairs] = useState<boolean>();

  // Toggle Functions
  const toggleWideUI = () => {
    setWideUI((w) => !w);
  };

  const toggleSyncWideUI = () => {
    setSyncWideUI((s) => !s);
  };

  const togglePostWideUI = () => {
    setPostWideUI((p) => !p);
  };

  const toggleAutoHideNav = () => {
    setAutoHideNav((a) => !a);
  };

  const toggleExpandedSubPane = () => {
    setExpandedSubPane((e) => !e);
  };

  const toggleCompactLinkPics = () => {
    setCompactLinkPics((c) => !c);
  };

  const togglePreferSideBySide = () => {
    setPreferSideBySide((p) => {
      if (!p) setDisableSideBySide(false);
      return !p;
    });
  };

  const toggleDisableSideBySide = () => {
    setDisableSideBySide((p) => {
      if (!p) setPreferSideBySide(false);
      return !p;
    });
  };

  const toggleDimRead = () => {
    setDimRead((d) => !d);
  };

  const toggleShowAwardings = () => {
    setShowAwardings((s) => !s);
  };

  const toggleShowFlairs = () => {
    setShowFlairs((s) => !s);
  };

  const toggleShowUserIcons = () => {
    setShowUserIcons((s) => !s);
  };

  const toggleShowUserFlairs = () => {
    setShowUserFlairs((s) => !s);
  };

  // Initialization useEffect - load from storage
  useEffect(() => {
    const initSettings = async () => {


      // Load UI settings with localforage fallback to localStorage pattern
      const loadWideUI = async () => {
        await migrateStorageValue("wideUI", true, setWideUI);
      };

      const loadSaveWideUI = async () => {
        await migrateStorageValue("saveWideUI", true, setSaveWideUI);
      };

      const loadPostWideUI = async () => {
        let saved_postWideUI = await localForage.getItem("postWideUI");
        if (saved_postWideUI !== null) {
          setPostWideUI(saved_postWideUI as boolean);
        }
      };

      const loadSyncWideUI = async () => {
        let saved_syncWideUI = await localForage.getItem("syncWideUI");
        if (saved_syncWideUI !== null) {
          setSyncWideUI(saved_syncWideUI as boolean);
        }
      };

      const loadCardStyle = async () => {
        let saved_cardStyle: string | null = await localForage.getItem("cardStyle");
        if (saved_cardStyle !== null) {
          saved_cardStyle && setCardStyle(saved_cardStyle as CardStyle);
          localStorage.removeItem("cardStyle");
        } else {
          let local_cardStyle = localStorage.getItem("cardStyle");
          local_cardStyle?.length > 0
            ? setCardStyle(local_cardStyle as CardStyle)
            : setCardStyle("default");
        }
      };

      const loadColumnOverride = async () => {
        let saved_columnOverride = await localForage.getItem("columnOverride");
        if (saved_columnOverride !== null) {
          setColumnOverride(saved_columnOverride as number);
        }
      };

      const loadUniformHeights = async () => {
        let saved_uniformHeights = await localForage.getItem("uniformHeights");
        if (saved_uniformHeights !== null) {
          setUniformHeights(saved_uniformHeights as boolean);
        }
      };

      const loadAutoHideNav = async () => {
        let saved_autoHideNav = await localForage.getItem("autoHideNav");
        if (saved_autoHideNav !== null) {
          setAutoHideNav(saved_autoHideNav as boolean);
        }
      };

      const loadExpandedSubPane = async () => {
        let saved_expandedSubPane = await localForage.getItem("expandedSubPane");
        if (saved_expandedSubPane !== null) {
          setExpandedSubPane(saved_expandedSubPane as boolean);
        }
      };

      const loadCompactLinkPics = async () => {
        let saved_compactLinkPics = await localForage.getItem("compactLinkPics");
        if (saved_compactLinkPics !== null) {
          setCompactLinkPics(saved_compactLinkPics as boolean);
        }
      };

      const loadPreferSideBySide = async () => {
        let saved_preferSideBySide = await localForage.getItem("preferSideBySide");
        if (saved_preferSideBySide !== null) {
          setPreferSideBySide(saved_preferSideBySide as boolean);
        }
      };

      const loadDisableSideBySide = async () => {
        let saved_disableSideBySide = await localForage.getItem("disableSideBySide");
        if (saved_disableSideBySide !== null) {
          setDisableSideBySide(saved_disableSideBySide as boolean);
        }
      };

      const loadDimRead = async () => {
        let saved_dimRead = await localForage.getItem("dimRead");
        if (saved_dimRead !== null) {
          setDimRead(saved_dimRead as boolean);
        }
      };

      const loadShowAwardings = async () => {
        let saved_showAwardings = await localForage.getItem("showAwardings");
        if (saved_showAwardings !== null) {
          setShowAwardings(saved_showAwardings as boolean);
        }
      };

      const loadShowFlairs = async () => {
        let saved_showFlairs = await localForage.getItem("showFlairs");
        if (saved_showFlairs !== null) {
          setShowFlairs(saved_showFlairs as boolean);
        }
      };

      const loadShowUserIcons = async () => {
        let saved_showUserIcons = await localForage.getItem("showUserIcons");
        if (saved_showUserIcons !== null) {
          setShowUserIcons(saved_showUserIcons as boolean);
        }
      };

      const loadShowUserFlairs = async () => {
        let saved_showUserFlairs = await localForage.getItem("showUserFlairs");
        if (saved_showUserFlairs !== null) {
          setShowUserFlairs(saved_showUserFlairs as boolean);
        }
      };

      // Load all settings
      await Promise.all([
        loadWideUI(),
        loadSaveWideUI(),
        loadPostWideUI(),
        loadSyncWideUI(),
        loadCardStyle(),
        loadColumnOverride(),
        loadUniformHeights(),
        loadAutoHideNav(),
        loadExpandedSubPane(),
        loadCompactLinkPics(),
        loadPreferSideBySide(),
        loadDisableSideBySide(),
        loadDimRead(),
        loadShowAwardings(),
        loadShowFlairs(),
        loadShowUserIcons(),
        loadShowUserFlairs(),
      ]);
    };

    initSettings();
  }, []);

  // Persistence useEffects - save to storage when values change
  useEffect(() => {
    if (wideUI !== undefined) {
      persistToStorage("wideUI", wideUI);
    }
  }, [wideUI]);

  useEffect(() => {
    if (saveWideUI !== undefined) {
      persistToStorage("saveWideUI", saveWideUI);
    }
  }, [saveWideUI]);

  useEffect(() => {
    if (postWideUI !== undefined) {
      localForage.setItem("postWideUI", postWideUI);
    }
  }, [postWideUI]);

  useEffect(() => {
    if (syncWideUI !== undefined) {
      localForage.setItem("syncWideUI", syncWideUI);
    }
  }, [syncWideUI]);

  useEffect(() => {
    if (cardStyle?.length > 0) {
      localForage.setItem("cardStyle", cardStyle);
    }
  }, [cardStyle]);

  useEffect(() => {
    if (columnOverride !== undefined) {
      localForage.setItem("columnOverride", columnOverride);
    }
  }, [columnOverride]);

  useEffect(() => {
    if (uniformHeights !== undefined) {
      localForage.setItem("uniformHeights", uniformHeights);
    }
  }, [uniformHeights]);

  useEffect(() => {
    if (autoHideNav !== undefined) {
      localForage.setItem("autoHideNav", autoHideNav);
    }
  }, [autoHideNav]);

  useEffect(() => {
    if (expandedSubPane !== undefined) {
      localForage.setItem("expandedSubPane", expandedSubPane);
    }
  }, [expandedSubPane]);

  useEffect(() => {
    if (compactLinkPics !== undefined) {
      localForage.setItem("compactLinkPics", compactLinkPics);
    }
  }, [compactLinkPics]);

  useEffect(() => {
    if (preferSideBySide !== undefined) {
      localForage.setItem("preferSideBySide", preferSideBySide);
    }
  }, [preferSideBySide]);

  useEffect(() => {
    if (disableSideBySide !== undefined) {
      localForage.setItem("disableSideBySide", disableSideBySide);
    }
  }, [disableSideBySide]);

  useEffect(() => {
    if (dimRead !== undefined) {
      localForage.setItem("dimRead", dimRead);
    }
  }, [dimRead]);

  useEffect(() => {
    if (showAwardings !== undefined) {
      localForage.setItem("showAwardings", showAwardings);
    }
  }, [showAwardings]);

  useEffect(() => {
    if (showFlairs !== undefined) {
      localForage.setItem("showFlairs", showFlairs);
    }
  }, [showFlairs]);

  useEffect(() => {
    if (showUserIcons !== undefined) {
      localForage.setItem("showUserIcons", showUserIcons);
    }
  }, [showUserIcons]);

  useEffect(() => {
    if (showUserFlairs !== undefined) {
      localForage.setItem("showUserFlairs", showUserFlairs);
    }
  }, [showUserFlairs]);

  const contextValue: UIContextValue = {
    // UI Layout Settings
    wideUI,
    setWideUI,
    saveWideUI,
    setSaveWideUI,
    postWideUI,
    setPostWideUI,
    syncWideUI,
    setSyncWideUI,
    toggleWideUI,
    toggleSyncWideUI,
    togglePostWideUI,

    // Card and Display Settings
    cardStyle,
    setCardStyle,
    columnOverride,
    setColumnOverride,
    uniformHeights,
    setUniformHeights,

    // Navigation and Layout Preferences
    autoHideNav,
    setAutoHideNav,
    toggleAutoHideNav,
    expandedSubPane,
    setExpandedSubPane,
    toggleExpandedSubPane,

    // Content Display Options
    compactLinkPics,
    setCompactLinkPics,
    toggleCompactLinkPics,
    preferSideBySide,
    setPreferSideBySide,
    togglePreferSideBySide,
    disableSideBySide,
    setDisableSideBySide,
    toggleDisableSideBySide,
    dimRead,
    setDimRead,
    toggleDimRead,

    // Visual Element Toggles
    showAwardings,
    setShowAwardings,
    toggleShowAwardings,
    showFlairs,
    setShowFlairs,
    toggleShowFlairs,
    showUserIcons,
    setShowUserIcons,
    toggleShowUserIcons,
    showUserFlairs,
    setShowUserFlairs,
    toggleShowUserFlairs,
  };

  return (
    <UIContext.Provider value={contextValue}>
      {children}
    </UIContext.Provider>
  );
};