import localForage from "localforage";
import React, { useState, useContext, useEffect, createContext } from "react";
import type { MediaContextValue } from "../../types";

export const MediaContext = createContext<MediaContextValue | undefined>(undefined);

export const useMediaContext = (): MediaContextValue => {
  const context = useContext(MediaContext);
  if (!context) {
    throw new Error('useMediaContext must be used within MediaProvider');
  }
  return context;
};

export const MediaProvider = ({ children }: { children: React.ReactNode }) => {
  // Audio/Video Settings
  const [volume, setVolume] = useState<number | undefined>(undefined);
  const [nsfw, setNSFW] = useState<boolean>();
  const [autoplay, setAutoplay] = useState<boolean>();
  const [hoverplay, setHoverPlay] = useState<boolean>();
  const [audioOnHover, setAudioOnHover] = useState<boolean>();

  // Media Quality and Preferences
  const [highRes, setHighRes] = useState(false);
  const [disableEmbeds, setDisableEmbeds] = useState<boolean>();
  const [preferEmbeds, setPreferEmbeds] = useState<boolean>();
  const [embedsEverywhere, setEmbedsEverywhere] = useState<boolean>();
  const [expandImages, setExpandImages] = useState<boolean>();

  // Auto-play Settings
  const [autoPlayInterval, setAutoPlayInterval] = useState<number>();
  const [waitForVidInterval, setWaitForVidInterval] = useState<boolean>();
  const [autoPlayMode, setAutoPlayMode] = useState<boolean>();

  // Toggle Functions
  const toggleNSFW = () => {
    setNSFW((n) => !n);
  };

  const toggleAutoplay = () => {
    setAutoplay((a) => !a);
  };

  const toggleHoverPlay = () => {
    setHoverPlay((h) => !h);
  };

  const toggleAudioOnHover = () => {
    setAudioOnHover((a) => !a);
  };

  const toggleDisableEmbeds = () => {
    setDisableEmbeds((d) => !d);
  };

  const togglePreferEmbeds = () => {
    setPreferEmbeds((p) => !p);
  };

  const toggleEmbedsEverywhere = () => {
    setEmbedsEverywhere((e) => !e);
  };

  const toggleExpandImages = () => {
    setExpandImages((e) => !e);
  };

  // Initialization useEffect - load from storage
  useEffect(() => {
    const initSettings = async () => {
      try {
        // Load media settings with localforage fallback to localStorage pattern
        const loadVolume = async () => {
          try {
            let saved_volume = await localForage.getItem("volume");
            if (saved_volume !== null) {
              setVolume(saved_volume as number);
              localStorage.removeItem("volume");
            } else {
              let local_volume = localStorage.getItem("volume");
              if (local_volume) {
                setVolume(parseFloat(local_volume));
              }
            }
          } catch (error) {
            console.error("Error loading volume:", error);
          }
        };

      const loadNSFW = async () => {
        try {
          let saved_nsfw = await localForage.getItem("nsfw");
          if (saved_nsfw !== null) {
            setNSFW(saved_nsfw as boolean);
            localStorage.removeItem("nsfw");
          } else {
            let local_nsfw = localStorage.getItem("nsfw");
            if (local_nsfw?.includes("false")) {
              setNSFW(false);
            } else {
              setNSFW(true);
            }
          }
        } catch (error) {
          console.error("Error loading NSFW setting:", error);
        }
      };

      const loadAutoplay = async () => {
        let saved_autoplay = await localForage.getItem("autoplay");
        if (saved_autoplay !== null) {
          setAutoplay(saved_autoplay as boolean);
          localStorage.removeItem("autoplay");
        } else {
          let local_autoplay = localStorage.getItem("autoplay");
          if (local_autoplay?.includes("false")) {
            setAutoplay(false);
          } else {
            setAutoplay(true);
          }
        }
      };

      const loadHoverPlay = async () => {
        let saved_hoverplay = await localForage.getItem("hoverplay");
        if (saved_hoverplay !== null) {
          setHoverPlay(saved_hoverplay as boolean);
          localStorage.removeItem("hoverplay");
        } else {
          let local_hoverplay = localStorage.getItem("hoverplay");
          if (local_hoverplay?.includes("false")) {
            setHoverPlay(false);
          } else {
            setHoverPlay(true);
          }
        }
      };

      const loadAudioOnHover = async () => {
        let saved_audioOnHover = await localForage.getItem("audioOnHover");
        if (saved_audioOnHover !== null) {
          setAudioOnHover(saved_audioOnHover as boolean);
        }
      };

      const loadHighRes = async () => {
        let saved_highRes = await localForage.getItem("highRes");
        if (saved_highRes !== null) {
          setHighRes(saved_highRes as boolean);
        }
      };

      const loadDisableEmbeds = async () => {
        let saved_disableEmbeds = await localForage.getItem("disableEmbeds");
        if (saved_disableEmbeds !== null) {
          setDisableEmbeds(saved_disableEmbeds as boolean);
        }
      };

      const loadPreferEmbeds = async () => {
        let saved_preferEmbeds = await localForage.getItem("preferEmbeds");
        if (saved_preferEmbeds !== null) {
          setPreferEmbeds(saved_preferEmbeds as boolean);
        }
      };

      const loadEmbedsEverywhere = async () => {
        let saved_embedsEverywhere = await localForage.getItem("embedsEverywhere");
        if (saved_embedsEverywhere !== null) {
          setEmbedsEverywhere(saved_embedsEverywhere as boolean);
        }
      };

      const loadExpandImages = async () => {
        let saved_expandImages = await localForage.getItem("expandImages");
        if (saved_expandImages !== null) {
          setExpandImages(saved_expandImages as boolean);
        }
      };

      const loadAutoPlayInterval = async () => {
        let saved_autoPlayInterval = await localForage.getItem("autoPlayInterval");
        if (saved_autoPlayInterval !== null) {
          setAutoPlayInterval(saved_autoPlayInterval as number);
        }
      };

      const loadWaitForVidInterval = async () => {
        let saved_waitForVidInterval = await localForage.getItem("waitForVidInterval");
        if (saved_waitForVidInterval !== null) {
          setWaitForVidInterval(saved_waitForVidInterval as boolean);
        }
      };

      const loadAutoPlayMode = async () => {
        let saved_autoPlayMode = await localForage.getItem("autoPlayMode");
        if (saved_autoPlayMode !== null) {
          setAutoPlayMode(saved_autoPlayMode as boolean);
        }
      };

      // Load all settings
      await Promise.all([
        loadVolume(),
        loadNSFW(),
        loadAutoplay(),
        loadHoverPlay(),
        loadAudioOnHover(),
        loadHighRes(),
        loadDisableEmbeds(),
        loadPreferEmbeds(),
        loadEmbedsEverywhere(),
        loadExpandImages(),
        loadAutoPlayInterval(),
        loadWaitForVidInterval(),
        loadAutoPlayMode(),
      ]);
    } catch (error) {
      console.error("Error initializing media settings:", error);
    }
    // Close initSettings function before invoking it
    };

    initSettings();
  }, []);

  // Persistence useEffects - save to storage when values change
  useEffect(() => {
    if (volume !== undefined) {
      localForage.setItem("volume", volume);
    }
  }, [volume]);

  useEffect(() => {
    if (nsfw !== undefined) {
      localForage.setItem("nsfw", nsfw);
    }
  }, [nsfw]);

  useEffect(() => {
    if (autoplay !== undefined) {
      localForage.setItem("autoplay", autoplay);
    }
  }, [autoplay]);

  useEffect(() => {
    if (hoverplay !== undefined) {
      localForage.setItem("hoverplay", hoverplay);
    }
  }, [hoverplay]);

  useEffect(() => {
    if (audioOnHover !== undefined) {
      localForage.setItem("audioOnHover", audioOnHover);
    }
  }, [audioOnHover]);

  useEffect(() => {
    if (highRes !== undefined) {
      localForage.setItem("highRes", highRes);
    }
  }, [highRes]);

  useEffect(() => {
    if (disableEmbeds !== undefined) {
      localForage.setItem("disableEmbeds", disableEmbeds);
    }
  }, [disableEmbeds]);

  useEffect(() => {
    if (preferEmbeds !== undefined) {
      localForage.setItem("preferEmbeds", preferEmbeds);
    }
  }, [preferEmbeds]);

  useEffect(() => {
    if (embedsEverywhere !== undefined) {
      localForage.setItem("embedsEverywhere", embedsEverywhere);
    }
  }, [embedsEverywhere]);

  useEffect(() => {
    if (expandImages !== undefined) {
      localForage.setItem("expandImages", expandImages);
    }
  }, [expandImages]);

  useEffect(() => {
    if (autoPlayInterval !== undefined) {
      localForage.setItem("autoPlayInterval", autoPlayInterval);
    }
  }, [autoPlayInterval]);

  useEffect(() => {
    if (waitForVidInterval !== undefined) {
      localForage.setItem("waitForVidInterval", waitForVidInterval);
    }
  }, [waitForVidInterval]);

  useEffect(() => {
    if (autoPlayMode !== undefined) {
      localForage.setItem("autoPlayMode", autoPlayMode);
    }
  }, [autoPlayMode]);

  const contextValue: MediaContextValue = {
    // Audio/Video Settings
    volume,
    setVolume,
    nsfw,
    setNSFW,
    toggleNSFW,
    autoplay,
    setAutoplay,
    toggleAutoplay,
    hoverplay,
    setHoverPlay,
    toggleHoverPlay,
    audioOnHover,
    setAudioOnHover,
    toggleAudioOnHover,

    // Media Quality and Preferences
    highRes,
    setHighRes,
    disableEmbeds,
    setDisableEmbeds,
    toggleDisableEmbeds,
    preferEmbeds,
    setPreferEmbeds,
    togglePreferEmbeds,
    embedsEverywhere,
    setEmbedsEverywhere,
    toggleEmbedsEverywhere,
    expandImages,
    setExpandImages,
    toggleExpandImages,

    // Auto-play Settings
    autoPlayInterval,
    setAutoPlayInterval,
    waitForVidInterval,
    setWaitForVidInterval,
    autoPlayMode,
    setAutoPlayMode,
  };

  return (
    <MediaContext.Provider value={contextValue}>
      {children}
    </MediaContext.Provider>
  );
};
