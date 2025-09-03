import localForage from "localforage";
import { migrateStorageValue, persistToStorage } from "../utils/storage";
import React, { useState, useContext, useEffect, createContext } from "react";
import type { UIContextValue, CardStyle } from "../../types";

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
      // Generic helper for loading settings
      // Note: add trailing comma in `<T,>` to avoid TSX parsing this as JSX
      const loadSetting = async <T,>(
        key: string,
        setter: (value: T) => void,
        defaultValue?: T,
        migrateFn?: (
          key: string,
          defaultValue: T,
          setter: (value: T) => void,
        ) => Promise<void>,
      ) => {
        if (migrateFn) {
          await migrateFn(key, defaultValue!, setter);
        } else {
          try {
            const savedValue = await localForage.getItem(key);
            if (savedValue !== null) {
              setter(savedValue as T);
            } else if (defaultValue !== undefined) {
              setter(defaultValue);
            }
          } catch (error) {
            console.error(`Error loading ${key}:`, error);
            if (defaultValue !== undefined) {
              setter(defaultValue);
            }
          }
        }
      };

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
          setCardStyle(saved_cardStyle as CardStyle);
          localStorage.removeItem("cardStyle");
        } else {
          let local_cardStyle = localStorage.getItem("cardStyle");
          if (local_cardStyle?.length > 0) {
            setCardStyle(local_cardStyle as CardStyle);
          } else {
            setCardStyle("default");
          }
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

      // Load all settings using generic helper
      await Promise.all([
        loadSetting("wideUI", setWideUI, true, migrateStorageValue),
        loadSetting("saveWideUI", setSaveWideUI, true, migrateStorageValue),
        loadSetting("postWideUI", setPostWideUI),
        loadSetting("syncWideUI", setSyncWideUI),
        loadSetting("cardStyle", setCardStyle, "default"),
        loadSetting("columnOverride", setColumnOverride),
        loadSetting("uniformHeights", setUniformHeights),
        loadSetting("autoHideNav", setAutoHideNav),
        loadSetting("expandedSubPane", setExpandedSubPane),
        loadSetting("compactLinkPics", setCompactLinkPics),
        loadSetting("preferSideBySide", setPreferSideBySide),
        loadSetting("disableSideBySide", setDisableSideBySide),
        loadSetting("dimRead", setDimRead),
        loadSetting("showAwardings", setShowAwardings),
        loadSetting("showFlairs", setShowFlairs),
        loadSetting("showUserIcons", setShowUserIcons),
        loadSetting("showUserFlairs", setShowUserFlairs),
      ]);
    };

    initSettings();
  }, []);

  // Single useEffect for persisting all UI settings
  useEffect(() => {
    const persistSettings = async () => {
      const settingsToPersist = [
        { key: "wideUI", value: wideUI, usePersistToStorage: true },
        { key: "saveWideUI", value: saveWideUI, usePersistToStorage: true },
        { key: "postWideUI", value: postWideUI },
        { key: "syncWideUI", value: syncWideUI },
        { key: "cardStyle", value: cardStyle, condition: cardStyle?.length > 0 },
        { key: "columnOverride", value: columnOverride },
        { key: "uniformHeights", value: uniformHeights },
        { key: "autoHideNav", value: autoHideNav },
        { key: "expandedSubPane", value: expandedSubPane },
        { key: "compactLinkPics", value: compactLinkPics },
        { key: "preferSideBySide", value: preferSideBySide },
        { key: "disableSideBySide", value: disableSideBySide },
        { key: "dimRead", value: dimRead },
      ];

      await Promise.all(
        settingsToPersist
          .filter(setting => setting.value !== undefined && (setting.condition === undefined || setting.condition))
          .map(setting => 
            setting.usePersistToStorage 
              ? persistToStorage(setting.key, setting.value)
              : localForage.setItem(setting.key, setting.value)
          )
      );
    };

    persistSettings();
  }, [
    wideUI,
    saveWideUI,
    postWideUI,
    syncWideUI,
    cardStyle,
    columnOverride,
    uniformHeights,
    autoHideNav,
    expandedSubPane,
    compactLinkPics,
    preferSideBySide,
    disableSideBySide,
    dimRead,
  ]);

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
