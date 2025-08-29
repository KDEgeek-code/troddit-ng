import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { debounce } from '../../lib/utils';
import toast from 'react-hot-toast';
import ToastCustom from '../components/toast/ToastCustom';

// Type definitions
export interface UserPreferences {
  // UI settings
  nsfw?: boolean;
  autoplay?: boolean;
  hoverplay?: boolean;
  wideUI?: boolean;
  saveWideUI?: boolean;
  postWideUI?: boolean;
  syncWideUI?: boolean;
  cardStyle?: string;
  mediaOnly?: boolean;
  columnOverride?: number;
  audioOnHover?: boolean;
  autoHideNav?: boolean;
  uniformHeights?: boolean;
  
  // Media settings
  volume?: number;
  compactLinkPics?: boolean;
  preferSideBySide?: boolean;
  disableSideBySide?: boolean;
  
  // Comment settings
  autoCollapseComments?: boolean;
  collapseChildrenOnly?: boolean;
  defaultCollapseChildren?: boolean;
  ribbonCollapseOnly?: boolean;
  showUserIcons?: boolean;
  showAwardings?: boolean;
  showFlairs?: boolean;
  showUserFlairs?: boolean;
  expandedSubPane?: boolean;
  
  // Behavior settings
  infiniteLoading?: boolean;
  dimRead?: boolean;
  autoRead?: boolean;
  autoSeen?: boolean;
  disableEmbeds?: boolean;
  preferEmbeds?: boolean;
  embedsEverywhere?: boolean;
  expandImages?: boolean;
  
  // Refresh settings
  autoRefreshFeed?: boolean;
  autoRefreshComments?: boolean;
  askToUpdateFeed?: boolean;
  refreshOnFocus?: boolean;
  fastRefreshInterval?: number;
  slowRefreshInterval?: number;
  autoPlayInterval?: number;
  waitForVidInterval?: boolean;
  autoPlayMode?: boolean;
  defaultSortComments?: string;
  
  // Filter settings
  seenFilter?: boolean;
  readFilter?: boolean;
  imgFilter?: boolean;
  vidFilter?: boolean;
  galFilter?: boolean;
  selfFilter?: boolean;
  linkFilter?: boolean;
  imgPortraitFilter?: boolean;
  imgLandscapeFilter?: boolean;
  imgResFilter?: boolean;
  imgResXFilter?: number;
  imgResYFilter?: number;
  imgResExactFilter?: boolean;
  scoreFilter?: boolean;
  scoreFilterNum?: number;
  scoreGreater?: boolean;
}

export type PreferenceMap = {
  [K in keyof UserPreferences]: [UserPreferences[K], (value: UserPreferences[K]) => void];
};

export interface UseUserPrefsReturn {
  loading: boolean;
  lastSyncError: string | null;
  isOnline: boolean;
  queuedChanges: number;
}

// Persistable preferences whitelist
const PERSISTABLE_KEYS: (keyof UserPreferences)[] = [
  // UI settings
  'nsfw', 'autoplay', 'hoverplay', 'wideUI', 'saveWideUI', 'postWideUI', 'syncWideUI',
  'cardStyle', 'mediaOnly', 'columnOverride', 'audioOnHover', 'autoHideNav', 'uniformHeights',
  
  // Media settings
  'volume', 'compactLinkPics', 'preferSideBySide', 'disableSideBySide',
  
  // Comment settings
  'autoCollapseComments', 'collapseChildrenOnly', 'defaultCollapseChildren', 'ribbonCollapseOnly',
  'showUserIcons', 'showAwardings', 'showFlairs', 'showUserFlairs', 'expandedSubPane',
  
  // Behavior settings
  'infiniteLoading', 'dimRead', 'autoRead', 'autoSeen', 'disableEmbeds', 'preferEmbeds',
  'embedsEverywhere', 'expandImages',
  
  // Refresh settings
  'autoRefreshFeed', 'autoRefreshComments', 'askToUpdateFeed', 'refreshOnFocus',
  'fastRefreshInterval', 'slowRefreshInterval', 'autoPlayInterval', 'waitForVidInterval',
  'autoPlayMode', 'defaultSortComments',
  
  // Filter settings
  'seenFilter', 'readFilter', 'imgFilter', 'vidFilter', 'galFilter', 'selfFilter',
  'linkFilter', 'imgPortraitFilter', 'imgLandscapeFilter', 'imgResFilter',
  'imgResXFilter', 'imgResYFilter', 'imgResExactFilter', 'scoreFilter',
  'scoreFilterNum', 'scoreGreater'
];

// SSR-safe storage utilities
const createSSRSafeStorage = () => {
  if (typeof window === 'undefined') {
    // SSR fallback - return no-op functions
    return {
      getItem: async () => null,
      setItem: async () => void 0,
      removeItem: async () => void 0,
    };
  }

  // Client-side - dynamically import localforage
  let localforage: any;
  
  const getLocalForage = async () => {
    if (!localforage) {
      localforage = (await import('localforage')).default;
    }
    return localforage.createInstance({
      name: 'troddit',
      storeName: 'userPrefs'
    });
  };

  return {
    getItem: async (key: string) => {
      try {
        const store = await getLocalForage();
        return await store.getItem(key);
      } catch (error) {
        console.error('Storage getItem error:', error);
        return null;
      }
    },
    setItem: async (key: string, value: any) => {
      try {
        const store = await getLocalForage();
        return await store.setItem(key, value);
      } catch (error) {
        console.error('Storage setItem error:', error);
      }
    },
    removeItem: async (key: string) => {
      try {
        const store = await getLocalForage();
        return await store.removeItem(key);
      } catch (error) {
        console.error('Storage removeItem error:', error);
      }
    }
  };
};

const userPrefsStore = createSSRSafeStorage();

// Utility to extract persistable preferences from preference map
const extractPersistablePrefs = (preferenceMap: Partial<PreferenceMap>): UserPreferences => {
  const prefs: UserPreferences = {};

  PERSISTABLE_KEYS.forEach(key => {
    if (preferenceMap[key]) {
      const [value] = preferenceMap[key];
      if (value !== undefined && value !== null) {
        (prefs as any)[key] = value;
      }
    }
  });

  return prefs;
};

// Structural equivalence comparison using PERSISTABLE_KEYS
const prefsEqual = (a: UserPreferences, b: UserPreferences): boolean => {
  return PERSISTABLE_KEYS.every(key => {
    const valueA = a[key] ?? undefined;
    const valueB = b[key] ?? undefined;
    return valueA === valueB;
  });
};

export const useUserPrefs = (preferenceMap: Partial<PreferenceMap>): UseUserPrefsReturn => {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true); // Default to online for SSR
  const [queuedChanges, setQueuedChanges] = useState(0);
  
  // Client-side hydration state
  const [isClient, setIsClient] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Set initial online status after hydration
    if (typeof navigator !== 'undefined') {
      setIsOnline(navigator.onLine);
    }
    setIsHydrated(true);
  }, []);
  
  const lastSyncedPrefs = useRef<UserPreferences>({});
  const isInitialized = useRef(false);
  const sessionRef = useRef(session);
  const isOnlineRef = useRef(isOnline);

  // Track online/offline status (client-side only)
  useEffect(() => {
    if (!isClient || !isHydrated) return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, [isClient, isHydrated]);

  // Sync refs when session changes
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  // Sync refs when isOnline changes
  useEffect(() => {
    isOnlineRef.current = isOnline;
  }, [isOnline]);

  // Server sync mutation with SSR safety
  const syncMutation = useMutation({
    mutationFn: async (preferences: UserPreferences) => {
      // Skip during SSR or before client hydration
      if (typeof window === 'undefined' || !isClient || !isHydrated) {
        return Promise.resolve(null);
      }
      const response = await axios.post('/api/user/prefs', preferences);
      return response.data;
    },
    networkMode: 'offlineFirst',
    onSuccess: (_, preferences) => {
      // Skip during SSR or before client hydration
      if (typeof window === 'undefined' || !isClient || !isHydrated) return;
      
      lastSyncedPrefs.current = { ...preferences };
      setLastSyncError(null);
      
      // Safe toast notification
      try {
        toast.custom((t) => (
          <ToastCustom
            t={t}
            message="Preferences synced"
            mode="success"
          />
        ), { duration: 2000 });
      } catch (error) {
        console.warn('Toast notification failed:', error);
      }
    },
    onError: (error: any) => {
      // Skip during SSR or before client hydration
      if (typeof window === 'undefined' || !isClient || !isHydrated) return;
      
      console.error('Failed to sync preferences:', error);
      const errorMessage = error.response?.data?.error || 'Failed to sync preferences';
      setLastSyncError(errorMessage);

      // Safe toast notification
      try {
        toast.custom((t) => (
          <ToastCustom
            t={t}
            message={errorMessage}
            mode="error"
          />
        ), { duration: 4000 });
      } catch (error) {
        console.warn('Toast notification failed:', error);
      }
    }
  });

  // Debounced sync function
  const debouncedSync = useRef<any>(
    debounce((preferences: UserPreferences) => {
      if (sessionRef.current?.user && !prefsEqual(preferences, lastSyncedPrefs.current)) {
        if (isOnlineRef.current) {
          syncMutation.mutate(preferences);
        } else {
          // Queue for later sync when online (single snapshot, not incremental)
          userPrefsStore.setItem('unsentPrefs', preferences).then(() => {
            setQueuedChanges(1); // Always 1 when there are unsent prefs
          }).catch(console.error);

          // Safe toast notification
          try {
            toast.custom((t) => (
              <ToastCustom
                t={t}
                message="Preferences queued (offline)"
                mode="alert"
              />
            ), { duration: 3000 });
          } catch (error) {
            console.warn('Toast notification failed:', error);
          }
        }
      }
    }, 1000, false)
  );

  // Flush queued changes when coming online
  useEffect(() => {
    if (!isClient || !isHydrated) return;
    
    if (isOnline && session?.user && queuedChanges > 0) {
      userPrefsStore.getItem('unsentPrefs').then((queuedPrefs: UserPreferences | null) => {
        if (queuedPrefs) {
          syncMutation.mutate(queuedPrefs);
          userPrefsStore.removeItem('unsentPrefs').then(() => {
            setQueuedChanges(0);
            lastSyncedPrefs.current = { ...queuedPrefs };
          }).catch(console.error);
        }
      }).catch(console.error);
    }
  }, [isOnline, session?.user, queuedChanges, syncMutation, isClient, isHydrated]);

  // Initial load and merge logic
  useEffect(() => {
    if (!isClient || !isHydrated || status === 'loading' || isInitialized.current) return;
    
    const initializePrefs = async () => {
      try {
        setLoading(true);
        
        let serverPrefs: UserPreferences = {};
        let localPrefs: UserPreferences = {};
        
        // Load local preferences
        try {
          const stored = await userPrefsStore.getItem('preferences') as UserPreferences | null;
          if (stored) {
            localPrefs = stored;
          }
        } catch (error) {
          console.error('Failed to load local preferences:', error);
        }
        
        // Load server preferences if authenticated
        if (session?.user) {
          try {
            const response = await axios.get('/api/user/prefs');
            serverPrefs = response.data || {};
          } catch (error: any) {
            console.error('Failed to load server preferences:', error);
            if (error.response?.status !== 401) {
              setLastSyncError('Failed to load server preferences');
            }
          }
        }
        
        // Merge with server precedence
        const merged = { ...localPrefs, ...serverPrefs };
        
        // Apply merged preferences to MainContext
        PERSISTABLE_KEYS.forEach(key => {
          if (merged[key] !== undefined && preferenceMap[key]) {
            const [, setter] = preferenceMap[key];
            (setter as any)(merged[key]);
          }
        });
        
        // Save merged result to local storage
        await userPrefsStore.setItem('preferences', merged);
        lastSyncedPrefs.current = { ...merged };
        
      } catch (error) {
        console.error('Failed to initialize preferences:', error);
        setLastSyncError('Failed to initialize preferences');
      } finally {
        setLoading(false);
        isInitialized.current = true;
      }
    };
    
    initializePrefs();
  }, [session, status, preferenceMap, isClient, isHydrated]);

  // Watch for preference changes and sync
  useEffect(() => {
    if (!isClient || !isHydrated || !isInitialized.current || loading) return;
    
    const currentPrefs = extractPersistablePrefs(preferenceMap);
    
    // Skip local storage write - MainContext individual effects handle this
    // to avoid double-write race condition
    // userPrefsStore.setItem('preferences', currentPrefs).catch(console.error);
    
    // Debounced server sync only
    if (session?.user) {
      debouncedSync.current(currentPrefs);
    }
  }, [
    // Include all persistable preference values as dependencies
    ...PERSISTABLE_KEYS.map(key => preferenceMap[key]?.[0]),
    session?.user,
    loading,
    isClient,
    isHydrated
  ]);

  // Initialize queued changes count
  useEffect(() => {
    if (!isClient || !isHydrated) return;

    userPrefsStore.getItem('unsentPrefs').then((queuedPrefs: UserPreferences | null) => {
      setQueuedChanges(queuedPrefs ? 1 : 0);
    }).catch(() => setQueuedChanges(0));
  }, [isClient, isHydrated]);

  return {
    loading,
    lastSyncError,
    isOnline,
    queuedChanges
  };
};