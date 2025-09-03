import "../../styles/globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";

import {
  PremiumAuthContextProvider,
  PremiumAuthContextFreeProvider,
} from "../PremiumAuthContext";
import { AppProviders } from "../contexts/AppProviders";
import { MySubsProvider } from "../MySubs";
import { MyCollectionsProvider } from "../components/collections/CollectionContext";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import type {
  Persister,
  PersistedClient,
} from "@tanstack/react-query-persist-client";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import PlausibleProvider from "next-plausible";
import Head from "next/head";
import { Analytics } from "@vercel/analytics/react";

import toast, { Toaster } from "react-hot-toast";
import NavBar from "../components/NavBar";
import React, { useEffect, useRef, useState } from "react";
import packageInfo from "../../package.json";
import { checkVersion } from "../../lib/utils";
import ToastCustom from "../components/toast/ToastCustom";
import { usePlausible } from "next-plausible";
import ModalProvider from "../components/LazyModals";

const NO_AUTH_FREE_ACCESS = JSON.parse(
  process?.env?.NEXT_PUBLIC_FREE_ACCESS ?? "true",
);

const VERSION = packageInfo.version;

// Create query client - Comment 1: Using Option B to keep longer cache but default staleness
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      cacheTime: 1000 * 60 * 60 * 24, // 24 hours cache
      // Removed global staleTime to avoid affecting unrelated queries
    },
  },
});

// Comment 5: Set specific cache and stale times for feed and thread queries (7 days cache, 2 minutes stale)
// This provides more appropriate refresh behavior for Reddit content vs the global 5 minute staleTime
queryClient.setQueryDefaults(["feed"], {
  cacheTime: 1000 * 60 * 60 * 24 * 7, // 7 days for feed queries
  staleTime: 1000 * 60 * 2, // 2 minutes stale time for feed (fresher than global default)
  networkMode: "offlineFirst",
});

queryClient.setQueryDefaults(["thread"], {
  cacheTime: 1000 * 60 * 60 * 24 * 7, // 7 days for thread queries
  staleTime: 1000 * 60 * 2, // 2 minutes stale time for threads (fresher than global default)
  networkMode: "offlineFirst",
});

// Define props interface for SafePersistProvider (Comment 2)
interface SafePersistProviderProps {
  children: React.ReactNode;
}

// SafePersistProvider component that handles persistence failures gracefully
const SafePersistProvider: React.FC<SafePersistProviderProps> = ({
  children,
}) => {
  const [persister, setPersister] = useState<Persister | null>(null);
  const [isPersistenceReady, setIsPersistenceReady] = useState(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    const initializePersistence = async () => {
      try {
        // Dynamically import localforage to avoid SSR issues
        const localforage = (await import("localforage")).default;

        // Comment 4: Configure localforage with explicit driver order for broader browser compatibility
        localforage.config({
          name: "troddit",
          storeName: "rq_cache",
          driver: [
            localforage.INDEXEDDB,
            localforage.WEBSQL,
            localforage.LOCALSTORAGE,
          ],
        });

        // Test if localforage is available and working
        const testKey = "__test_persistence__";
        await localforage.setItem(testKey, "test");
        await localforage.removeItem(testKey);

        // Create typed persister with proper error handling
        const localforagePersister: Persister = {
          persistClient: async (client: PersistedClient) => {
            try {
              await localforage.setItem("REACT_QUERY_OFFLINE_CACHE", client);
            } catch (error) {
              console.warn("Failed to persist React Query cache:", error);
            }
          },
          restoreClient: async () => {
            try {
              const client = await localforage.getItem<PersistedClient>(
                "REACT_QUERY_OFFLINE_CACHE",
              );
              return client;
            } catch (error) {
              console.warn("Failed to restore React Query cache:", error);
              return null;
            }
          },
          removeClient: async () => {
            try {
              await localforage.removeItem("REACT_QUERY_OFFLINE_CACHE");
            } catch (error) {
              console.warn("Failed to remove React Query cache:", error);
            }
          },
        };

        setPersister(localforagePersister);
        setIsPersistenceReady(true);
      } catch (error) {
        console.warn(
          "Persistence initialization failed, falling back to in-memory cache:",
          error,
        );
        setIsPersistenceReady(true); // Still ready, but without persistence
      }
    };

    initializePersistence();
  }, []);

  // Comment 3: Gate children until persistence is ready to avoid offline flicker
  if (!isPersistenceReady) {
    // Return minimal skeleton to prevent flicker while persistence loads
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  // Use PersistQueryClientProvider if persister is available, otherwise fallback to QueryClientProvider
  if (persister) {
    return (
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister,
          maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
          buster: VERSION, // Cache buster tied to app version

          dehydrateOptions: {
            shouldDehydrateQuery: (query) => {
              // Comment 2: Persist when data exists, not only on status==='success'
              const firstKey = Array.isArray(query.queryKey)
                ? query.queryKey[0]
                : undefined;
              const isTarget = firstKey === "feed" || firstKey === "thread";
              const data = query.state.data as any;
              const hasPages =
                Array.isArray(data?.pages) && data.pages.length > 0;
              return isTarget && hasPages;
            },
          },
        }}
      >
        {children}
      </PersistQueryClientProvider>
    );
  }

  // Fallback to standard QueryClientProvider if persistence fails
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const App = ({ Component, pageProps }) => {
  return (
    <SessionProvider session={pageProps.session}>
      <ThemeProvider attribute="class" defaultTheme="system">
        <SafePersistProvider>
          <AppProviders>
            <MySubsProvider>
              <MyCollectionsProvider>
                <NavBar />
                <Component {...pageProps} />
                <ModalProvider />
                <Toaster position="bottom-center" />
                <Analytics />
                <ReactQueryDevtools initialIsOpen={false} />
              </MyCollectionsProvider>
            </MySubsProvider>
          </AppProviders>
        </SafePersistProvider>
      </ThemeProvider>
    </SessionProvider>
  );
};

function MyApp({ Component, pageProps }) {
  const plausible = usePlausible();
  useEffect(() => {
    const curVersion = VERSION;
    const prevVersion = localStorage.getItem("trodditVersion");
    if (prevVersion) {
      let compare = checkVersion(curVersion, prevVersion);
      // if (compare === 1) {
      //   const toastId = toast.custom(
      //     (t) => (
      //       <ToastCustom
      //         t={t}
      //         message={`Troddit updated! Click to see changelog`}
      //         mode={"version"}
      //       />
      //     ),
      //     { position: "bottom-center", duration: 8000 }
      //   );
      // }
    }
    localStorage.setItem("trodditVersion", curVersion);
  }, []);
  return (
    <PlausibleProvider domain="troddit.com">
      <Head>
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, viewport-fit=cover" //user-scalable="no"
        />
        <link rel="shortcut icon" href="/favicon.ico" />
      </Head>

      {NO_AUTH_FREE_ACCESS ? (
        <PremiumAuthContextFreeProvider>
          <App Component={Component} pageProps={pageProps} />
        </PremiumAuthContextFreeProvider>
      ) : (
        <>
          <ClerkProvider {...pageProps}>
            <PremiumAuthContextProvider>
              <App Component={Component} pageProps={pageProps} />
            </PremiumAuthContextProvider>
          </ClerkProvider>
        </>
      )}
    </PlausibleProvider>
  );
}

export default MyApp;
