import { useSession } from "next-auth/react";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useMainContext } from "../MainContext";
import ChildComments from "./ChildComments";
import { CommentsProps, RedditComment, UseThreadReturn } from "../../types";

const Comments = ({
  comments,
  readTime,
  containerRef,
  sort,
  depth = 0,
  op = "",
  portraitMode = false,
  thread,
  locked = false,
  scoreHideMins = 0,
  setCommentsReady,
}: CommentsProps & {
  readTime?: Date;
  op?: string;
  portraitMode?: boolean;
  thread?: Pick<UseThreadReturn, 'isFetching' | 'fetchNextPage'>;
  locked?: boolean;
  scoreHideMins?: number;
  setCommentsReady?: (ready: boolean) => void;
}) => {
  const { data: session, status } = useSession();
  const context = useMainContext();
  sort ??= context.defaultSortComments;

  const [commentsData, setCommentsData] = useState<RedditComment[] | undefined>(comments);
  useEffect(() => {
    comments && setCommentsData(comments);
  }, [comments]);
  
  useEffect(() => {
    if (commentsData && setCommentsReady) {
      setCommentsReady(true);
    }
  }, [commentsData, setCommentsReady]);

  const loadChildComments = useCallback(async () => {
    if (session) {
      if (!thread) return;
      thread.fetchNextPage();
    } else {
      context.toggleLoginModal();
    }
  }, [session, thread, context]);

  const renderedComments = useMemo(() => commentsData, [commentsData]);

  return (
    <div className="">
      {renderedComments?.map((comment, i) => (
        <div key={`${i}_${comment?.data?.id}`} className="py-1 ">
          {comment?.kind === "more" && thread ? (
            <button
              aria-label="load more"
              className={
                "text-sm pl-2 text-semibold flex hover:font-semibold w-full " +
                (thread.isFetching ? " animate-pulse" : " ")
              }
              disabled={thread.isFetching}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                loadChildComments();
              }}
            >
              Load {comment?.data?.count} More...
            </button>
          ) : (
            <>
              <ChildComments
                comment={comment}
                depth={depth}
                hide={false}
                op={op}
                portraitMode={portraitMode}
                locked={locked}
                scoreHideMins={scoreHideMins}
                readTime={readTime}
              />
            </>
          )}
        </div>
      ))}
    </div>
  );
};

function areEqualComments(prev: any, next: any) {
  const sameArray = prev.comments === next.comments; // rely on new arrays to trigger
  const base = prev.sort === next.sort && prev.depth === next.depth && prev.op === next.op && prev.locked === next.locked && prev.scoreHideMins === next.scoreHideMins && prev.thread?.isFetching === next.thread?.isFetching;
  const threadEq = prev.thread?.fetchNextPage === next.thread?.fetchNextPage; // compare thread ref identity
  return sameArray && base && threadEq;
}

export default React.memo(Comments, areEqualComments);
