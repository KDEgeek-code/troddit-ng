import { useSession } from "next-auth/react";
import React, { useCallback } from "react";
import {
  QueryFunctionContext,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { fixCommentFormat } from "../../lib/utils";
import { useMainContext } from "../MainContext";
import { loadMoreComments, loadPost } from "../RedditAPI";
import { useTAuth } from "../PremiumAuthContext";
import type { RedditPost, RedditComment, UseThreadReturn, ThreadPage } from "../../types";

const useThread = (
  permalink: string, 
  sort: string, 
  initialData?: RedditPost, 
  withContext = false
): UseThreadReturn => {
  const { isLoaded, premium } = useTAuth();
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const context = useMainContext();
  const loading = status === "loading";
  const splitPermalink = permalink?.split("/");
  const threadId =
    splitPermalink?.[3] === "comments" && splitPermalink?.[4]
      ? splitPermalink?.[4]
      : permalink;
  const commentId =
    splitPermalink?.[3] === "comments" &&
    splitPermalink?.[4] &&
    splitPermalink?.[6]
      ? splitPermalink?.[6]
      : ""; //for direct comments

  const updateComments = useCallback((prevComments: RedditComment[], newComments: RedditComment[]) => {
    // let update = queryClient.setQueryData(["thread", threadId, sort, commentId, withContext], (newData:any) => {
    const getPrevState = (prevComments: RedditComment[]): Map<string, RedditComment> => {
      const prevState = new Map<string, RedditComment>();
      const checkCommentChildren = (comment: RedditComment) => {
        if (comment?.kind === "t1") {
          prevState.set(comment?.data?.name, comment);
          const replies = typeof comment?.data?.replies === 'string' ? undefined : comment?.data?.replies;
          const len = replies?.data?.children?.length || 0;
          for (let i = 0; i < len; i++) {
            checkCommentChildren((replies as any).data.children[i]);
          }
        }
      };
      prevComments.forEach((comment) => checkCommentChildren(comment));
      return prevState;
    };

    const processChildren = (prevState: Map<string, RedditComment>, newComment: RedditComment): RedditComment => {
      let prevComment: RedditComment | undefined = prevState.get(newComment?.data?.name);
      let repliesData = newComment?.data?.replies;
      if (typeof repliesData === 'string') return newComment;
      if (newComment?.data?.replies && typeof repliesData !== 'string') {
        let children = repliesData?.data?.children ?? [];
        const prevReplies = typeof prevComment?.data?.replies === 'string' ? undefined : prevComment?.data?.replies;
        if (prevReplies?.data?.children) {
          if (children?.length > 0) {
            let newChildren = prevReplies?.data?.children as any[];
            newChildren = Array.from(
              [...newChildren, ...children?.filter((c) => c?.kind === "t1")]
                .reduce((m, o) => m.set(o?.data?.name, o), new Map())
                .values()
            );
            repliesData["data"]["children"] = newChildren;
          }
        }
      }

      let comment = {
        ...newComment,
        data: {
          ...newComment.data,
          replies: repliesData,
          collapsed: prevComment?.data?.collapsed
            ? true
            : newComment?.data?.collapsed,
        },
      };
      const replies = typeof comment?.data?.replies === 'string' ? undefined : comment?.data?.replies;
      const clen = replies?.data?.children?.length || 0;
      if (clen > 0 && prevComment && replies) {
        for (let i = 0; i < clen; i++) {
          (replies as any).data.children[i] = processChildren(
            prevState,
            (replies as any).data.children[i]
          );
        }
      }
      return comment;
    };

    const prevState = getPrevState(prevComments);
    const newCommentsEdit = newComments.map((comment) => {
      return processChildren(prevState, comment);
    });

    return newCommentsEdit;
  }, []);

  const loadChildComments = useCallback(async (children: string[], link_id: string) => {
    let childrenstring = children.join(",");
    if (session) {
      const data = await loadMoreComments({
        children: childrenstring,
        link_id,
        loggedIn: !!session,
        token: context.token,
        sort,
        isPremium: premium?.isPremium,
      });
      let morecomments = await fixCommentFormat(data?.data);
      return {
        post_comments: morecomments,
        token: data?.token,
      };
    } else {
      throw new Error("Unable to fetch more comments, must be logged in");
    }
  }, [session, context.token, sort, premium]);

  const processComments = useCallback((newComments: RedditComment[]) => {
    const prevQueryData = queryClient.getQueryData<import('@tanstack/react-query').InfiniteData<ThreadPage>>([
      "thread",
      threadId,
      sort,
      commentId,
      withContext,
      session?.user?.name,
    ]);
    const prevComments = prevQueryData?.pages
      ?.map((page) => page.comments)
      ?.flat();
    let comments = newComments;
    if (newComments?.length > 0 && prevComments?.length > 0) {
      comments = updateComments(prevComments, newComments);
    }
    return comments;
  }, [queryClient, threadId, sort, commentId, withContext, updateComments]);

  const fetchThread = useCallback(async (feedParams: QueryFunctionContext) => {
    try {
      if (feedParams?.pageParam?.children?.length > 0) {
        const { post_comments, token } = await loadChildComments(
          feedParams.pageParam.children,
          feedParams?.pageParam?.link_id
        );
        token && context.setToken(token as any);
        const comments = processComments(post_comments)?.map((c) => ({
          ...c,
          data: { ...c?.data },
        }));

        return {
          comments,
        };
      }

      const { post, post_comments, token } = await loadPost({
        permalink,
        sort,
        withcontext: withContext,
        loggedIn: !!session,
        token: context.token as any,
        isPremium: premium?.isPremium,
      });
      token && context.setToken(token as any);
      if (!post) {
        throw new Error("Error fetching post");
      }

      const comments = processComments(post_comments);

      return { post, comments };
    } catch (err) {
      if (err?.message === "PREMIUM REQUIRED") {
        // context.setPremiumModal(true);
        return { post: undefined, comments: [] };
      } else {
        throw err;
      }
    }
  }, [loadChildComments, processComments, permalink, sort, withContext, session, context, premium]);

  const thread = useInfiniteQuery<ThreadPage, Error>(
    ["thread", threadId, sort, commentId, withContext, session?.user?.name],
    fetchThread,
    {
      enabled: isLoaded && threadId && !loading,
      staleTime: context?.autoRefreshComments ? 0 : Infinity, // 5 * 60 * 1000, //5 min
      getNextPageParam: (lastpage: ThreadPage) => {
        const lastComment: any =
          lastpage?.comments?.[lastpage?.comments?.length - 1];
        if (lastComment?.kind === "more") {
          return {
            children: lastComment?.data?.children,
            link_id: lastComment?.data?.parent_id,
          };
        } else return undefined;
      },
    }
  );

  const loadMore = useCallback(() => {
    // Implementation for loading more comments
    thread.fetchNextPage();
  }, [thread]);

  const updateVote = useCallback((id: string, vote: number) => {
    // TODO: Implement vote update functionality
    // This should:
    // 1. Update local state/cache optimistically
    // 2. Make API call to update vote
    // 3. Handle errors and rollback if needed
    // 4. Update the thread/comments state
    console.log(`Updating vote for comment ${id} to ${vote}`);
  }, []);

  // Extract post and comments from thread data
  const post = thread.data?.pages?.[0]?.post ?? null;
  const comments = thread.data?.pages?.flatMap(page => page.comments ?? []) ?? [];

  return {
    data: thread.data,
    isLoading: thread.isLoading,
    isFetching: thread.isFetching,
    isError: thread.isError,
    error: thread.error,
    hasNextPage: thread.hasNextPage ?? false,
    isFetchingNextPage: thread.isFetchingNextPage,
    fetchNextPage: thread.fetchNextPage,
    refetch: thread.refetch,
    post,
    comments,
    loadMore,
    updateVote,
  };
};

export default useThread;
