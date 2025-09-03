import { useSession } from "next-auth/react";
import React, { useState, useEffect, useCallback } from "react";
import { QueryFunctionContext, useInfiniteQuery } from "@tanstack/react-query";
import { filterPosts } from "../../lib/utils";
import { useMainContext } from "../MainContext";
import {
  getRedditSearch,
  getUserMultiPosts,
  loadFront,
  loadSubreddits,
  loadUserPosts,
  loadUserSelf,
} from "../RedditAPI";
import useLocation from "./useLocation";
import { useTAuth } from "../PremiumAuthContext";
import type {
  RedditPost,
  FlattenedListing,
  UseFeedReturn,
  FeedPageData,
  PostSeenMap,
  Filters,
} from "../../types";

interface Params {
  // Allow runtime shape from loaders (no 'kind' field)
  initialPosts?: any;
}

const useFeed = (params?: Params): UseFeedReturn => {
  const { data: session, status } = useSession();
  const { isLoaded, premium } = useTAuth();
  const sessloading = status === "loading";
  const context = useMainContext();

  const {
    key,
    ready,
    mode,
    sort,
    range,
    subreddits,
    userMode,
    searchQuery,
    domain,
  } = useLocation(params);

  interface FeedParams {
    loggedIn: boolean;
    after?: string;
    count?: number;
    mode: "HOME" | "SUBREDDIT" | "USER" | "SELF" | "SEARCH" | "FLAIR" | "MULTI";
    sort: string;
    range?: string;
    subreddits: string;
    userMode?: string;
    searchQuery?: string;
    safeSearch?: boolean;
    prevPosts?: PostSeenMap;
    filters: Filters;
  }

  const fetchFeed = useCallback(
    async (fetchParams: QueryFunctionContext): Promise<FeedPageData> => {
      const feedParams = {
        loggedIn: status === "authenticated" ? true : false,
        after: fetchParams.pageParam?.after ?? "",
        count: fetchParams.pageParam?.count ?? 0,
        mode: mode,
        sort: sort,
        range: range,
        subreddits: subreddits,
        userMode: userMode,
        searchQuery: searchQuery,
        safeSearch: context.safeSearch ? undefined : true,
        prevPosts: fetchParams.pageParam?.prevPosts ?? {},
        filters: fetchParams?.queryKey?.[
          fetchParams?.queryKey?.length - 1
        ] as Filters,
      };
      //console.log("fetchParams?", fetchParams);
      //console.log("feedParms", feedParams);

      let data: any;
      //short circuiting with initialData here instead of using param in infinite query hook..
      try {
        if (
          params?.initialPosts?.children?.length > 0 &&
          fetchParams?.pageParam === undefined
        ) {
          data = params?.initialPosts;
          data["after"] = "";
        } else if (feedParams.mode === "HOME") {
          data = await loadFront({
            after: feedParams.after,
            range: feedParams.range,
            count: feedParams.count,
            sort: feedParams.sort,
            localSubs: context.localSubs as any, //home feed is invalidated on subs change
            token: context.token as any,
            loggedIn: feedParams.loggedIn,
            isPremium: premium?.isPremium,
          });
        } else if (mode === "SUBREDDIT") {
          data = await loadSubreddits({
            after: feedParams.after,
            range: feedParams.range,
            count: feedParams.count,
            sort: feedParams.sort,
            subreddits: feedParams.subreddits,
            token: context.token as any,
            loggedIn: feedParams.loggedIn,
            sr_detail: true,
            isPremium: premium?.isPremium,
          });
        } else if (mode === "FLAIR") {
          data = await getRedditSearch({
            after: feedParams.after,
            range: feedParams.range,
            count: feedParams.count,
            sort: feedParams.sort,
            params: { q: feedParams.searchQuery },
            include_over_18: feedParams.safeSearch,
            subreddit: feedParams.subreddits,
            token: context.token as any,
            loggedIn: feedParams.loggedIn,
            isPremium: premium?.isPremium,
          });
        } else if (mode === "SEARCH") {
          data = await getRedditSearch({
            after: feedParams.after,
            range: feedParams.range,
            count: feedParams.count,
            sort: feedParams.sort,
            params: { q: feedParams.searchQuery },
            include_over_18: feedParams.safeSearch,
            subreddit: undefined,
            token: context.token as any,
            loggedIn: feedParams.loggedIn,
            isPremium: premium?.isPremium,
          });
        } else if (mode === "MULTI") {
          data = await getUserMultiPosts({
            after: feedParams.after,
            range: feedParams.range,
            sort: feedParams.sort,
            multiname: feedParams.userMode,
            user: feedParams.subreddits,
            isPremium: premium?.isPremium,
          });
        } else if (mode === "SELF") {
          data = await loadUserSelf({
            after: feedParams.after,
            range: feedParams.range,
            count: feedParams.count,
            sort: feedParams.sort,
            username: session?.user?.name ?? "",
            type: context.userPostType === "comments" ? "comments" : "links",
            where: feedParams.userMode?.toLowerCase(),
            token: context.token as any,
            loggedIn: feedParams.loggedIn,
            isPremium: premium?.isPremium,
          });
        } else if (mode === "USER") {
          data = await loadUserPosts({
            after: feedParams.after,
            range: feedParams.range,
            count: feedParams.count,
            sort: feedParams.sort,
            username: feedParams.subreddits as string,
            type: feedParams.userMode,
            isPremium: premium?.isPremium,
          });
        }
      } catch (error) {
        if (error?.message === "PREMIUM REQUIRED") {
          context.setPremiumModal(true);
          return {
            posts: [],
            after: null,
            before: null,
          };
        } else if (error?.["response"]?.["status"] === 429) {
          //rate limited
          const timeout = parseInt(
            error?.["response"]?.["headers"]?.["x-ratelimit-reset"] ?? "300",
          );
          context.setRateLimitModal({
            show: true,
            timeout,
            start: new Date(),
          });
          await new Promise((resolve) =>
            setTimeout(() => resolve("foo"), timeout * 1000),
          );
          return {
            posts: [],
            after: feedParams.after,
            before: null,
          };
        }
        throw error;
      }

      const manageData = async (
        data: FlattenedListing<RedditPost>,
        filters: import("../../types").Filters,
        prevPosts: import("../../types").PostSeenMap,
        filterSubs: boolean,
      ) => {
        data?.token && context.setToken(data?.token as any);

        const { filtered, filtercount } = await filterPosts(
          data?.children,
          filters,
          prevPosts,
          filterSubs,
          feedParams.mode === "USER" ? false : true,
          domain,
        );

        return {
          filtered,
          filtercount,
        };
      };

      const filterSubs =
        mode === "HOME" ||
        feedParams.subreddits
          ?.split(" ")
          ?.join("+")
          ?.split(",")
          ?.join("+")
          ?.split("%20")
          ?.join("+")
          ?.split("+")?.length > 1 ||
        feedParams.subreddits?.toUpperCase() == "ALL" ||
        feedParams.subreddits?.toUpperCase() == "POPULAR";

      const { filtered, filtercount } = await manageData(
        data,
        feedParams.filters,
        feedParams.prevPosts,
        filterSubs,
      );



      return {
        posts: filtered,
        after: data.after,
        before: data.before || null,
      };
    },
    [
      status,
      mode,
      sort,
      range,
      subreddits,
      userMode,
      searchQuery,
      context,
      premium,
      params,
      domain,
      session,
    ],
  );

  const feed = useInfiniteQuery<FeedPageData, Error>(key, fetchFeed, {
    enabled: isLoaded && ready && key?.[0] == "feed" && !!domain,
    refetchOnWindowFocus:
      ((premium?.isPremium && context.refreshOnFocus) ?? true) ? true : false,
    refetchOnMount: false,
    staleTime: 0,
    cacheTime: Infinity,
    refetchInterval: premium?.isPremium
      ? Infinity
      : context.autoRefreshFeed
        ? sort === "new" || sort === "rising"
          ? (context.fastRefreshInterval ?? 10 * 1000)
          : (context.slowRefreshInterval ?? 30 * 60 * 1000)
        : Infinity,
    getNextPageParam: (lastPage, allPages) => {
      //console.log('lastPage?ß', lastPage)
      if (lastPage.after || lastPage.after === "") {
        const count = allPages.reduce(
          (total, page) => total + page.posts.length,
          0,
        );
        const prevPosts = allPages.reduce(
          (acc, page) => {
            page.posts.forEach((post) => {
              acc[post?.data?.name] = 1;
            });
            return acc;
          },
          {} as PostSeenMap,
        );

        return {
          after: lastPage?.after ?? "",
          count,
          prevPosts,
        };
      }
      return undefined;
    },

    // setting initial data directly in fetchFeed() instead
    // initialData: () => {
    //   return formatInitialData();
    // },
  });

  // Extract posts from all pages
  const posts: RedditPost[] =
    feed.data?.pages?.flatMap((page) => page.posts) ?? [];

  const invalidate = useCallback(() => feed.refetch(), [feed]);

  return {
    data: feed.data,
    isLoading: feed.isLoading,
    isFetching: feed.isFetching,
    isError: feed.isError,
    error: feed.error,
    hasNextPage: feed.hasNextPage ?? false,
    isFetchingNextPage: feed.isFetchingNextPage,
    fetchNextPage: feed.fetchNextPage,
    refetch: feed.refetch,
    invalidate,
    posts,
  };
};

export default useFeed;
