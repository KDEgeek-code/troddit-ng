import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/dist/client/router";
import { useSession } from "next-auth/react";
import Card1 from "./cards/Card1";
import Card2 from "./cards/Card2";
import Row1 from "./cards/Row1";
import CommentCard from "./cards/CommentCard";
import { useRead } from "../hooks/useRead";
import useCardHeightTrigger from "../hooks/useCardHeightTrigger";
import { PostProps } from "../../types";

const Post = ({
  post,
  columns,
  postClick,
  postNum = 0,
  openPost,
  uniformMediaMode = false,
  mediaDimensions = [0, 0] as [number, number],
  showNSFW,
  cardStyle,
  inView = true,
  handleSizeChange,
  initHeight = 0,
}: PostProps & {
  postClick?: (name: string, postNum: number) => void;
  uniformMediaMode?: boolean;
  mediaDimensions?: [number, number];
  showNSFW?: boolean;
  cardStyle?: string;
  inView?: boolean;
  handleSizeChange?: (name: string, height: number) => void;
  initHeight?: number;
}) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const postCardRef = useRef<HTMLDivElement>(null);
  const { read } = useRead(post?.data?.name);
  const checkCardHeight = useCardHeightTrigger({
    handleSizeChange,
    postCardRef,
    postName: post?.data?.name,
  });
  const [hideNSFW, setHideNSFW] = useState(false);
  const [forceMute, setforceMute] = useState(0);
  const [origCommentCount, setOrigCommentCount] = useState<number>();

  useEffect(() => {
    showNSFW === false && post?.data?.over_18
      ? setHideNSFW(true)
      : setHideNSFW(false);
    post?.data.spoiler && setHideNSFW(true);
    return () => {
      setHideNSFW(false);
    };
  }, [showNSFW, post]);

  const handleClick = useCallback((e: React.MouseEvent, nav: { toComments?: boolean; toMedia?: boolean }) => {
    e.stopPropagation();
    if (!e.ctrlKey && !e.metaKey) {
      openPost(post, postNum, nav, router.asPath);
      const multi = router.query?.m ?? "";
      const queryParams = `${multi ? `?m=${multi}` : ``}`;
      if (router.query?.frontsort) {
        router.push("", `${post?.data.id}`, { shallow: true });
      } else if (
        router.pathname?.includes("/u/") &&
        session?.user?.name?.toUpperCase() ===
          router?.query?.slug?.[0]?.toUpperCase()
      ) {
        router.push(
          "",
          `/u/${router?.query?.slug?.[0]}/${post.data.permalink}${queryParams}`,
          { shallow: true }
        );
      } else if (router.pathname?.includes("/u/")) {
        if (
          router.query?.slug?.[1]?.toUpperCase() === "M" &&
          router?.query?.slug?.[2]
        ) {
          router.push(
            "",
            `/u/${router.query?.slug?.[0]}/m/${router.query.slug[2]}${post.data.permalink}${queryParams}`,
            {
              shallow: true,
            }
          );
        } else {
          router.push(
            "",
            `/u/${post?.data.author}/${post.data.permalink}${queryParams}`,
            {
              shallow: true,
            }
          );
        }
      } else {
        router.push("", `${post?.data.permalink}${queryParams}`, {
          shallow: true,
        });
      }
    } else {
      window.open(`${post?.data.permalink}`, "_blank");
    }
  }, [openPost, post, postNum, router, session?.user?.name]);

  const onPostClick = useCallback(() => {
    postClick && postClick(post?.data?.name, postNum);
  }, [postClick, post?.data?.name, postNum]);

  const isComment = useMemo(() => post?.kind === "t1", [post?.kind]);

  const memoMediaDims = useMemo(() => mediaDimensions, [mediaDimensions?.[0], mediaDimensions?.[1]]);

  useEffect(() => {
    if (read) {
      setOrigCommentCount(read?.numComments);
    } else {
      setOrigCommentCount(undefined);
    }
  }, [read]);

  return (
    <div ref={postCardRef} className={""}>

      {/* Click wrapper */}
      <div className={"select-none"} onClickCapture={onPostClick}>
        {isComment ? (
          <CommentCard
            data={post?.data}
            postNum={postNum}
            handleClick={handleClick}
          />
        ) : cardStyle === "row1" ? (
          <Row1
            post={post?.data}
            columns={columns}
            hasMedia={post?.data?.mediaInfo?.hasMedia}
            hideNSFW={hideNSFW}
            forceMute={forceMute}
            postNum={postNum}
            read={read}
            handleClick={handleClick}
            origCommentCount={origCommentCount}
            mediaDimensions={memoMediaDims}
            checkCardHeight={checkCardHeight}
            initHeight={initHeight}
            // newPost={post?.newPost}
          />
        ) : cardStyle === "card2" ? (
          <Card2
            inView={inView}
            columns={columns}
            post={post?.data}
            hasMedia={post?.data?.mediaInfo?.hasMedia}
            hideNSFW={hideNSFW}
            forceMute={forceMute}
            postNum={postNum}
            read={read}
            handleClick={handleClick}
            origCommentCount={origCommentCount}
            mediaDimensions={memoMediaDims}
            checkCardHeight={checkCardHeight}
            // newPost={post?.newPost}

          />
        ) : (
          <Card1
            inView={inView}
            columns={columns}
            post={post?.data}
            hasMedia={post?.data?.mediaInfo?.hasMedia}
            hideNSFW={hideNSFW}
            forceMute={forceMute}
            postNum={postNum}
            read={read}
            handleClick={handleClick}
            origCommentCount={origCommentCount}
            uniformMediaMode={uniformMediaMode}
            mediaDimensions={memoMediaDims}
            checkCardHeight={checkCardHeight}
            // newPost={post?.newPost}

          />
        )}
      </div>
    </div>
  );
};

function areEqualPost(prev: any, next: any) {
  const a = prev?.post?.data;
  const b = next?.post?.data;
  const mediaEq =
    (prev.mediaDimensions?.[0] ?? 0) === (next.mediaDimensions?.[0] ?? 0) &&
    (prev.mediaDimensions?.[1] ?? 0) === (next.mediaDimensions?.[1] ?? 0);
  const baseEq =
    prev.cardStyle === next.cardStyle &&
    prev.columns === next.columns &&
    prev.inView === next.inView &&
    prev.postNum === next.postNum &&
    prev.showNSFW === next.showNSFW &&
    prev.uniformMediaMode === next.uniformMediaMode;
  const postCoreEq =
    a?.name === b?.name &&
    a?.score === b?.score &&
    a?.num_comments === b?.num_comments &&
    a?.likes === b?.likes &&
    a?.edited === b?.edited;
  const mediaInfoEq =
    !!a?.mediaInfo?.hasMedia === !!b?.mediaInfo?.hasMedia;

  return mediaEq && baseEq && postCoreEq && mediaInfoEq;
}

export default React.memo(Post, areEqualPost);
