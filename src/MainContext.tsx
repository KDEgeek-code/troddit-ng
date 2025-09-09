import localForage from "localforage";
import React, { useState, useContext, useEffect, useReducer } from "react";
import { useTAuth } from "./PremiumAuthContext";
import { useUserPrefs, type PreferenceMap } from "./hooks/useUserPrefs";
import type { AppContextValue, RedditPost, PostType, RedditSubreddit } from "../types";
import { useUIContext } from "./contexts/UIContext";
import { useMediaContext } from "./contexts/MediaContext";
import { useFilterContext } from "./contexts/FilterContext";

export const localRead = localForage.createInstance({ name: "troddit", storeName: "readPosts" });
export const localSeen = localForage.createInstance({ name: "troddit", storeName: "seenPosts" });

export const localSubInfoCache = localForage.createInstance({
  name: "troddit",
  storeName: "subInfoCache",
});
export const subredditFilters = localForage.createInstance({
  name: "troddit",
  storeName: "subredditFilters",
});
export const userFilters = localForage.createInstance({
  name: "troddit",
  storeName: "userFilters",
});

export const MainContext = React.createContext<AppContextValue | undefined>(undefined);

export const useMainContext = (): AppContextValue => {
  const context = useContext(MainContext);
  if (!context) {
    throw new Error('useMainContext must be used within MainProvider');
  }
  return context;
};

export const MainProvider = ({ children }: { children: React.ReactNode }) => {
  const { premium } = useTAuth();

  // Get contexts for preference syncing
  const uiContext = useUIContext();
  const mediaContext = useMediaContext();
  const filterContext = useFilterContext();

  // Basic App State (core only)
  const [pauseAll, setPauseAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [postOpen, setPostOpen] = useState(false);
  const [mediaMode, setMediaMode] = useState(false);

  // Modals and UI State
  const [loginModal, setLoginModal] = useState(false);
  const [premiumModal, setPremiumModal] = useState(false);
  const [rateLimitModal, setRateLimitModal] = useState({
    show: false,
    timeout: 0,
    start: new Date(),
  });
  const [replyFocus, setReplyFocus] = useState(false);

  // Core Data Management
  const [columns, setColumns] = useState(3);
  const [posts, setPosts] = useState<RedditPost[]>([]);
  const [postNum, setPostNum] = useState(0);
  const [token, setToken] = useState<{ expires?: number; accessToken?: string } | null>(null);
  const [gAfter, setGAfter] = useState("");
  const [safeSearch, setSafeSearch] = useState(true);
  const [progressKey, setProgressKey] = useState(0);
  const [fastRefresh, setFastRefresh] = useState(0);

  // App-Level Settings (not moved to other contexts)
  const [mediaOnly, setMediaOnly] = useState<boolean>();
  const [autoCollapseComments, setAutoCollapseComments] = useState<boolean>();
  const [collapseChildrenOnly, setCollapseChildrenOnly] = useState<boolean>();
  const [defaultCollapseChildren, setDefaultCollapseChildren] = useState<boolean>();
  const [ribbonCollapseOnly, setRibbonCollapseOnly] = useState<boolean>();
  const [infiniteLoading, setInfiniteLoading] = useState<boolean>();
  const [autoRead, setAutoRead] = useState<boolean>();
  const [autoSeen, setAutoSeen] = useState<boolean>();
  const [autoRefreshFeed, setAutoRefreshFeed] = useState<boolean>();
  const [autoRefreshComments, setAutoRefreshComments] = useState<boolean>();
  const [askToUpdateFeed, setAskToUpdateFeed] = useState<boolean>();
  const [refreshOnFocus, setRefreshOnFocus] = useState<boolean>();
  const [fastRefreshInterval, setFastRefreshInterval] = useState<number>();
  const [slowRefreshInterval, setSlowRefreshInterval] = useState<number>();
  const [defaultSortComments, setDefaultSortComments] = useState<string>();

  // User and Post Management
  const [userPostType, setUserPostType] = useState<PostType>("links");
  const [readPosts, setReadPosts] = useState<Record<string, { postId: string; numComments: number; time: Date; }>>({});
  const [readPostsChange, setReadPostsChange] = useState(0);

  // Local Subs Management
  const [localSubs, setLocalSubs] = useState<string[]>([]);
  const [localFavoriteSubs, setLocalFavoriteSubs] = useState<string[]>([]);

  // Toggle Functions
  const toggleLoginModal = (forceOn?: boolean) => {
    setLoginModal(forceOn ?? !loginModal);
  };

  const toggleUserPostType = () => {
    setUserPostType((p) => (p === "links" ? "comments" : "links"));
  };

  const toggleMediaOnly = () => {
    setMediaOnly((m) => !m);
  };

  const toggleAutoCollapseComments = () => {
    setAutoCollapseComments((a) => !a);
  };

  const toggleCollapseChildrenOnly = () => {
    setCollapseChildrenOnly((c) => !c);
  };

  const toggleDefaultCollapseChildren = () => {
    setDefaultCollapseChildren((d) => !d);
  };

  const toggleRibbonCollapseOnly = () => {
    setRibbonCollapseOnly((r) => !r);
  };

  const toggleInfiniteLoading = () => {
    setInfiniteLoading((i) => !i);
  };

  const toggleAutoRead = () => {
    setAutoRead((a) => !a);
  };

  const toggleAutoSeen = () => {
    setAutoSeen((a) => !a);
  };

  // Post interaction functions
  const updateLikes = (id: string, likes: boolean | null) => {
    if (posts?.length > 0) {
      setPosts((p) => {
        const postIndex = p.findIndex(post => post?.data?.id === id);
        if (postIndex >= 0 && p[postIndex]?.data) {
          const newPosts = [...p];
          const newPostData = { ...newPosts[postIndex].data };
          newPostData.likes = likes;
          newPosts[postIndex] = { ...newPosts[postIndex], data: newPostData };
          return newPosts;
        }
        return p;
      });
    }
  };

  const updateSaves = (id: string, saved: boolean) => {
    if (posts?.length > 0) {
      setPosts((p) => {
        const postIndex = p.findIndex(post => post?.data?.id === id);
        if (postIndex >= 0 && p[postIndex]?.data) {
          const newPosts = [...p];
          const newPostData = { ...newPosts[postIndex].data };
          newPostData.saved = saved;
          newPosts[postIndex] = { ...newPosts[postIndex], data: newPostData };
          return newPosts;
        }
        return p;
      });
    }
  };

  const updateHidden = (id: string, hidden: boolean) => {
    if (posts?.[id]?.data) {
      setPosts((p) => {
        const newPosts = [...p];
        if (newPosts[parseInt(id)]?.data) {
          newPosts[parseInt(id)].data.hidden = hidden;
        }
        return newPosts;
      });
    }
  };

  // Read posts management
  const clearReadPosts = async (): Promise<boolean> => {
    try {
      setReadPosts({});
      await localRead.clear();
      setReadPostsChange((r) => r + 1);
      return true;
    } catch (error) {
      return false;
    }
  };

  const bulkAddReadPosts = (posts: { postId: string; numComments: number; }[]) => {
    const newReadPosts = { ...readPosts };
    posts.forEach((post) => {
      newReadPosts[post.postId] = {
        postId: post.postId,
        numComments: post.numComments,
        time: new Date(),
      };
    });
    setReadPosts(newReadPosts);
  };

  const addReadPost = (params: { postId: string; numComments: number; }) => {
    setReadPosts((prev) => ({
      ...prev,
      [params.postId]: {
        postId: params.postId,
        numComments: params.numComments,
        time: new Date(),
      },
    }));
    localRead.setItem(params.postId, {
      postId: params.postId,
      numComments: params.numComments,
      time: new Date(),
    });
  };

  const toggleReadPost = async (params: { postId: string; numComments: number; }) => {
    if (readPosts[params.postId]) {
      // Remove from read posts
      setReadPosts((prev) => {
        const newPosts = { ...prev };
        delete newPosts[params.postId];
        return newPosts;
      });
      await localRead.removeItem(params.postId);
    } else {
      // Add to read posts
      addReadPost(params);
    }
    setReadPostsChange((r) => r + 1);
  };

  // Local subs management
  const subToSub = async (action: string, sub: string) => {
    if (action === "sub") {
      return await addLocalSub(sub);
    } else if (action === "unsub") {
      return await removeLocalSub(sub);
    } else return false;
  };

  const addLocalSub = async (sub: string) => {
    let found = localSubs.find((s) => s?.toUpperCase() === sub?.toUpperCase());
    if (!found) {
      setLocalSubs((p) => [...p, sub]);
    }
    return true;
  };

  const removeLocalSub = async (sub: string) => {
    setLocalSubs((p) => {
      let filtered = p.filter((s) => s?.toUpperCase() !== sub?.toUpperCase());
      if (!(filtered.length > 0)) {
        localStorage.removeItem("localSubs");
        localForage.setItem("localSubs", []);
      }
      return filtered;
    });
    return true;
  };

  const favoriteLocalSub = async (makeFavorite: boolean, subname: string) => {
    if (makeFavorite === true) {
      let found = localFavoriteSubs.find(
        (s) => s?.toUpperCase() === subname?.toUpperCase()
      );
      if (!found) {
        setLocalFavoriteSubs((p) => [...p, subname]);
      }
    } else {
      setLocalFavoriteSubs((p) => {
        let filtered = p.filter(
          (s) => s?.toUpperCase() !== subname?.toUpperCase()
        );
        if (!(filtered.length > 0)) {
          localForage.setItem("localFavoriteSubs", []);
        }
        return filtered;
      });
    }
  };

  // Create preference map for server sync - UPDATED to use all contexts
  const preferenceMap: Partial<PreferenceMap> = {
    // UI settings - from UIContext
    wideUI: [uiContext.wideUI, uiContext.setWideUI],
    saveWideUI: [uiContext.saveWideUI, uiContext.setSaveWideUI],
    postWideUI: [uiContext.postWideUI, uiContext.setPostWideUI],
    syncWideUI: [uiContext.syncWideUI, uiContext.setSyncWideUI],
    cardStyle: [uiContext.cardStyle, uiContext.setCardStyle],
    columnOverride: [uiContext.columnOverride, uiContext.setColumnOverride],
    uniformHeights: [uiContext.uniformHeights, uiContext.setUniformHeights],
    autoHideNav: [uiContext.autoHideNav, uiContext.setAutoHideNav],
    expandedSubPane: [uiContext.expandedSubPane, uiContext.setExpandedSubPane],
    compactLinkPics: [uiContext.compactLinkPics, uiContext.setCompactLinkPics],
    preferSideBySide: [uiContext.preferSideBySide, uiContext.setPreferSideBySide],
    disableSideBySide: [uiContext.disableSideBySide, uiContext.setDisableSideBySide],
    dimRead: [uiContext.dimRead, uiContext.setDimRead],
    showAwardings: [uiContext.showAwardings, uiContext.setShowAwardings],
    showFlairs: [uiContext.showFlairs, uiContext.setShowFlairs],
    showUserIcons: [uiContext.showUserIcons, uiContext.setShowUserIcons],
    showUserFlairs: [uiContext.showUserFlairs, uiContext.setShowUserFlairs],

    // Media settings - from MediaContext
    nsfw: [mediaContext.nsfw, mediaContext.setNSFW],
    autoplay: [mediaContext.autoplay, mediaContext.setAutoplay],
    hoverplay: [mediaContext.hoverplay, mediaContext.setHoverPlay],
    volume: [mediaContext.volume, mediaContext.setVolume],
    audioOnHover: [mediaContext.audioOnHover, mediaContext.setAudioOnHover],
    highRes: [mediaContext.highRes, mediaContext.setHighRes],
    disableEmbeds: [mediaContext.disableEmbeds, mediaContext.setDisableEmbeds],
    preferEmbeds: [mediaContext.preferEmbeds, mediaContext.setPreferEmbeds],
    embedsEverywhere: [mediaContext.embedsEverywhere, mediaContext.setEmbedsEverywhere],
    expandImages: [mediaContext.expandImages, mediaContext.setExpandImages],
    autoPlayInterval: [mediaContext.autoPlayInterval, mediaContext.setAutoPlayInterval],
    waitForVidInterval: [mediaContext.waitForVidInterval, mediaContext.setWaitForVidInterval],
    autoPlayMode: [mediaContext.autoPlayMode, mediaContext.setAutoPlayMode],

    // Filter settings - from FilterContext
    seenFilter: [filterContext.seenFilter, filterContext.setSeenFilter],
    readFilter: [filterContext.readFilter, filterContext.setReadFilter],
    imgFilter: [filterContext.imgFilter, filterContext.setImgFilter],
    vidFilter: [filterContext.vidFilter, filterContext.setVidFilter],
    galFilter: [filterContext.galFilter, filterContext.setGalFilter],
    selfFilter: [filterContext.selfFilter, filterContext.setSelfFilter],
    linkFilter: [filterContext.linkFilter, filterContext.setLinkFilter],
    imgPortraitFilter: [filterContext.imgPortraitFilter, filterContext.setImgPortraitFilter],
    imgLandscapeFilter: [filterContext.imgLandscapeFilter, filterContext.setImgLandScapeFilter],
    imgResFilter: [filterContext.imgResFilter, filterContext.setImgResFilter],
    imgResXFilter: [filterContext.imgResXFilter, filterContext.setImgResXFilter],
    imgResYFilter: [filterContext.imgResYFilter, filterContext.setImgResYFilter],
    imgResExactFilter: [filterContext.imgResExactFilter, filterContext.setImgResExactFilter],
    scoreFilter: [filterContext.scoreFilter, filterContext.setScoreFilter],
    scoreFilterNum: [filterContext.scoreFilterNum, filterContext.setScoreFilterNum],
    scoreGreater: [filterContext.scoreGreater, filterContext.setScoreGreater],

    // App-level settings - remain in MainContext
    mediaOnly: [mediaOnly, setMediaOnly],
    autoCollapseComments: [autoCollapseComments, setAutoCollapseComments],
    collapseChildrenOnly: [collapseChildrenOnly, setCollapseChildrenOnly],
    defaultCollapseChildren: [defaultCollapseChildren, setDefaultCollapseChildren],
    ribbonCollapseOnly: [ribbonCollapseOnly, setRibbonCollapseOnly],
    infiniteLoading: [infiniteLoading, setInfiniteLoading],
    autoRead: [autoRead, setAutoRead],
    autoSeen: [autoSeen, setAutoSeen],
    autoRefreshFeed: [autoRefreshFeed, setAutoRefreshFeed],
    autoRefreshComments: [autoRefreshComments, setAutoRefreshComments],
    askToUpdateFeed: [askToUpdateFeed, setAskToUpdateFeed],
    refreshOnFocus: [refreshOnFocus, setRefreshOnFocus],
    fastRefreshInterval: [fastRefreshInterval, setFastRefreshInterval],
    slowRefreshInterval: [slowRefreshInterval, setSlowRefreshInterval],
    defaultSortComments: [defaultSortComments, setDefaultSortComments],
  };

  // Integrate user preferences sync hook (SSR-compatible)
  const { loading: prefsLoading, lastSyncError } = useUserPrefs(preferenceMap);

  // Initialization useEffect - load settings
  useEffect(() => {
    const initSettings = async () => {
      // Load app-level settings that remain in MainContext
      const loadMediaOnly = async () => {
        let saved_mediaOnly = await localForage.getItem("mediaOnly");
        if (saved_mediaOnly !== null) {
          setMediaOnly(saved_mediaOnly as boolean);
        }
      };

      const loadAutoCollapseComments = async () => {
        let saved_autoCollapseComments = await localForage.getItem("autoCollapseComments");
        if (saved_autoCollapseComments !== null) {
          setAutoCollapseComments(saved_autoCollapseComments as boolean);
        }
      };

      const loadCollapseChildrenOnly = async () => {
        let saved_collapseChildrenOnly = await localForage.getItem("collapseChildrenOnly");
        if (saved_collapseChildrenOnly !== null) {
          setCollapseChildrenOnly(saved_collapseChildrenOnly as boolean);
        }
      };

      const loadDefaultCollapseChildren = async () => {
        let saved_defaultCollapseChildren = await localForage.getItem("defaultCollapseChildren");
        if (saved_defaultCollapseChildren !== null) {
          setDefaultCollapseChildren(saved_defaultCollapseChildren as boolean);
        }
      };

      const loadRibbonCollapseOnly = async () => {
        let saved_ribbonCollapseOnly = await localForage.getItem("ribbonCollapseOnly");
        if (saved_ribbonCollapseOnly !== null) {
          setRibbonCollapseOnly(saved_ribbonCollapseOnly as boolean);
        }
      };

      const loadInfiniteLoading = async () => {
        let saved_infiniteLoading = await localForage.getItem("infiniteLoading");
        if (saved_infiniteLoading !== null) {
          setInfiniteLoading(saved_infiniteLoading as boolean);
        }
      };

      const loadAutoRead = async () => {
        let saved_autoRead = await localForage.getItem("autoRead");
        if (saved_autoRead !== null) {
          setAutoRead(saved_autoRead as boolean);
        }
      };

      const loadAutoSeen = async () => {
        let saved_autoSeen = await localForage.getItem("autoSeen");
        if (saved_autoSeen !== null) {
          setAutoSeen(saved_autoSeen as boolean);
        }
      };

      const loadAutoRefreshFeed = async () => {
        let saved_autoRefreshFeed = await localForage.getItem("autoRefreshFeed");
        if (saved_autoRefreshFeed !== null) {
          setAutoRefreshFeed(saved_autoRefreshFeed as boolean);
        }
      };

      const loadAutoRefreshComments = async () => {
        let saved_autoRefreshComments = await localForage.getItem("autoRefreshComments");
        if (saved_autoRefreshComments !== null) {
          setAutoRefreshComments(saved_autoRefreshComments as boolean);
        }
      };

      const loadAskToUpdateFeed = async () => {
        let saved_askToUpdateFeed = await localForage.getItem("askToUpdateFeed");
        if (saved_askToUpdateFeed !== null) {
          setAskToUpdateFeed(saved_askToUpdateFeed as boolean);
        }
      };

      const loadRefreshOnFocus = async () => {
        let saved_refreshOnFocus = await localForage.getItem("refreshOnFocus");
        if (saved_refreshOnFocus !== null) {
          setRefreshOnFocus(saved_refreshOnFocus as boolean);
        }
      };

      const loadFastRefreshInterval = async () => {
        let saved_fastRefreshInterval = await localForage.getItem("fastRefreshInterval");
        if (saved_fastRefreshInterval !== null) {
          setFastRefreshInterval(saved_fastRefreshInterval as number);
        }
      };

      const loadSlowRefreshInterval = async () => {
        let saved_slowRefreshInterval = await localForage.getItem("slowRefreshInterval");
        if (saved_slowRefreshInterval !== null) {
          setSlowRefreshInterval(saved_slowRefreshInterval as number);
        }
      };

      const loadDefaultSortComments = async () => {
        let saved_defaultSortComments = await localForage.getItem("defaultSortComments");
        if (saved_defaultSortComments !== null) {
          setDefaultSortComments(saved_defaultSortComments as string);
        }
      };

      const loadLocalSubs = async () => {
        let saved_localSubs: [] = await localForage.getItem("localSubs");
        if (saved_localSubs !== null) {
          saved_localSubs && setLocalSubs(saved_localSubs);
          localStorage.removeItem("localSubs");
        } else {
          let local_localSubs = JSON.parse(localStorage.getItem("localSubs") || "[]");
          local_localSubs && setLocalSubs(local_localSubs);
        }
      };

      const loadLocalFavoriteSubs = async () => {
        let saved_favs: [] = await localForage.getItem("localFavoriteSubs");
        if (saved_favs !== null) {
          saved_favs && setLocalFavoriteSubs(saved_favs);
        }
      };

      const loadReadPosts = async () => {
        try {
          const keys = await localRead.keys();
          const readPostsData: Record<string, { postId: string; numComments: number; time: Date; }> = {};
          
          for (const key of keys) {
            const postData = await localRead.getItem(key);
            if (postData) {
              readPostsData[key] = postData as { postId: string; numComments: number; time: Date; };
            }
          }
          
          setReadPosts(readPostsData);
        } catch (error) {
          console.error("Error loading read posts:", error);
        }
      };

      await Promise.all([
        loadMediaOnly(),
        loadAutoCollapseComments(),
        loadCollapseChildrenOnly(),
        loadDefaultCollapseChildren(),
        loadRibbonCollapseOnly(),
        loadInfiniteLoading(),
        loadAutoRead(),
        loadAutoSeen(),
        loadAutoRefreshFeed(),
        loadAutoRefreshComments(),
        loadAskToUpdateFeed(),
        loadRefreshOnFocus(),
        loadFastRefreshInterval(),
        loadSlowRefreshInterval(),
        loadDefaultSortComments(),
        loadLocalSubs(),
        loadLocalFavoriteSubs(),
        loadReadPosts(),
      ]);

      setReady(true);
    };

    initSettings();
  }, []);

  // Persistence useEffects for app-level settings
  useEffect(() => {
    if (mediaOnly !== undefined) {
      localForage.setItem("mediaOnly", mediaOnly);
    }
  }, [mediaOnly]);

  useEffect(() => {
    if (autoCollapseComments !== undefined) {
      localForage.setItem("autoCollapseComments", autoCollapseComments);
    }
  }, [autoCollapseComments]);

  useEffect(() => {
    if (collapseChildrenOnly !== undefined) {
      localForage.setItem("collapseChildrenOnly", collapseChildrenOnly);
    }
  }, [collapseChildrenOnly]);

  useEffect(() => {
    if (defaultCollapseChildren !== undefined) {
      localForage.setItem("defaultCollapseChildren", defaultCollapseChildren);
    }
  }, [defaultCollapseChildren]);

  useEffect(() => {
    if (ribbonCollapseOnly !== undefined) {
      localForage.setItem("ribbonCollapseOnly", ribbonCollapseOnly);
    }
  }, [ribbonCollapseOnly]);

  useEffect(() => {
    if (infiniteLoading !== undefined) {
      localForage.setItem("infiniteLoading", infiniteLoading);
    }
  }, [infiniteLoading]);

  useEffect(() => {
    if (autoRead !== undefined) {
      localForage.setItem("autoRead", autoRead);
    }
  }, [autoRead]);

  useEffect(() => {
    if (autoSeen !== undefined) {
      localForage.setItem("autoSeen", autoSeen);
    }
  }, [autoSeen]);

  useEffect(() => {
    if (autoRefreshFeed !== undefined) {
      localForage.setItem("autoRefreshFeed", autoRefreshFeed);
    }
  }, [autoRefreshFeed]);

  useEffect(() => {
    if (autoRefreshComments !== undefined) {
      localForage.setItem("autoRefreshComments", autoRefreshComments);
    }
  }, [autoRefreshComments]);

  useEffect(() => {
    if (askToUpdateFeed !== undefined) {
      localForage.setItem("askToUpdateFeed", askToUpdateFeed);
    }
  }, [askToUpdateFeed]);

  useEffect(() => {
    if (refreshOnFocus !== undefined) {
      localForage.setItem("refreshOnFocus", refreshOnFocus);
    }
  }, [refreshOnFocus]);

  useEffect(() => {
    if (fastRefreshInterval !== undefined) {
      localForage.setItem("fastRefreshInterval", fastRefreshInterval);
    }
  }, [fastRefreshInterval]);

  useEffect(() => {
    if (slowRefreshInterval !== undefined) {
      localForage.setItem("slowRefreshInterval", slowRefreshInterval);
    }
  }, [slowRefreshInterval]);

  useEffect(() => {
    if (defaultSortComments !== undefined) {
      localForage.setItem("defaultSortComments", defaultSortComments);
    }
  }, [defaultSortComments]);

  useEffect(() => {
    if (localSubs.length > 0) {
      localForage.setItem("localSubs", localSubs);
    }
  }, [localSubs]);

  useEffect(() => {
    if (localFavoriteSubs.length > 0) {
      localForage.setItem("localFavoriteSubs", localFavoriteSubs);
    }
  }, [localFavoriteSubs]);

  // Expose minimal MainContext in dev builds for debug helpers
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
      (window as any).__APP_MAIN_CONTEXT__ = { rateLimitModal, setRateLimitModal };
    }
  }, [rateLimitModal]);

  const contextValue: AppContextValue = {
    // Basic App State
    pauseAll,
    setPauseAll,
    loading,
    setLoading,
    ready,
    setReady,
    postOpen,
    setPostOpen,
    mediaMode,
    setMediaMode,

    // Modals and UI State
    loginModal,
    setLoginModal,
    premiumModal,
    setPremiumModal,
    rateLimitModal,
    setRateLimitModal,
    replyFocus,
    setReplyFocus,
    toggleLoginModal,

    // Core Data Management
    columns,
    setColumns,
    posts,
    setPosts,
    postNum,
    setPostNum,
    token,
    setToken,
    gAfter,
    setGAfter,
    safeSearch,
    setSafeSearch,
    progressKey,
    setProgressKey,
    fastRefresh,
    setFastRefresh,

    // User and Post Management
    userPostType,
    setUserPostType,
    toggleUserPostType,
    readPosts,
    setReadPosts,
    readPostsChange,
    setReadPostsChange,
    clearReadPosts,
    bulkAddReadPosts,
    addReadPost,
    toggleReadPost,

    // Local Subs Management
    localSubs,
    localFavoriteSubs,
    subToSub,
    favoriteLocalSub,

    // Post Interactions
    updateLikes,
    updateSaves,
    updateHidden,

    // App-Level Settings
    mediaOnly,
    setMediaOnly,
    toggleMediaOnly,
    autoCollapseComments,
    setAutoCollapseComments,
    toggleAutoCollapseComments,
    collapseChildrenOnly,
    setCollapseChildrenOnly,
    toggleCollapseChildrenOnly,
    defaultCollapseChildren,
    setDefaultCollapseChildren,
    toggleDefaultCollapseChildren,
    ribbonCollapseOnly,
    setRibbonCollapseOnly,
    toggleRibbonCollapseOnly,
    infiniteLoading,
    setInfiniteLoading,
    toggleInfiniteLoading,
    autoRead,
    setAutoRead,
    toggleAutoRead,
    autoSeen,
    setAutoSeen,
    toggleAutoSeen,
    autoRefreshFeed,
    setAutoRefreshFeed,
    autoRefreshComments,
    setAutoRefreshComments,
    askToUpdateFeed,
    setAskToUpdateFeed,
    refreshOnFocus,
    setRefreshOnFocus,
    fastRefreshInterval,
    setFastRefreshInterval,
    slowRefreshInterval,
    setSlowRefreshInterval,
    defaultSortComments,
    setDefaultSortComments,

    // User Preferences Sync Error
    lastSyncError,
  };

  return (
    <MainContext.Provider value={contextValue}>
      {children}
    </MainContext.Provider>
  );
};
