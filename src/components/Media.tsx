/* eslint-disable @next/next/no-img-element */
import Image from "next/legacy/image";
import Gallery from "./Gallery";
import VideoHandler from "./media/video/VideoHandler";
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useMainContext } from "../MainContext";
import { useUIContext } from "../contexts/UIContext";
import { useMediaContext } from "../contexts/MediaContext";
import { TwitterTweetEmbed } from "react-twitter-embed";
import { useTheme } from "next-themes";
import { useWindowSize, useWindowWidth } from "@react-hook/window-size";
import {
  checkImageInCache,
  findMediaInfo,
  findOptimalImageIndex,
} from "../../lib/utils";
import { AiOutlineTwitter } from "react-icons/ai";
import { ImEmbed } from "react-icons/im";
import { BsBoxArrowInUpRight } from "react-icons/bs";
import { BiExpand } from "react-icons/bi";
import ExternalLink from "./ui/ExternalLink";
import type { MediaProps, GalleryInfo, PostData } from "../../types";
import LoaderPuff from "./ui/LoaderPuff";
import { logApiRequest } from "../RedditAPI";
const scrollStyle =
  " scrollbar-thin scrollbar-thumb-th-scrollbar scrollbar-track-transparent scrollbar-thumb-rounded-full scrollbar-track-rounded-full ";

const Media = ({
  post,
  columns,
  cardStyle = undefined as undefined | "card1" | "card2" | "row1" | "default",
  curPostName = undefined,
  handleClick = (() => {}) as MediaProps['handleClick'],
  imgFull = false,
  forceMute = false,
  portraitMode = false,
  fullMediaMode = false,
  postMode = false,
  read = false,
  card = false,
  hide = false,
  fullRes = false,
  xPostMode = false,
  containerDims = undefined as undefined | [number, number],
  mediaDimensions = [0, 0] as undefined | [number, number],
  uniformMediaMode = false,
  inView = true,
  fill = false,
  checkCardHeight = () => {},
}: MediaProps & {
  cardStyle?: "card1" | "card2" | "row1" | "default";
  curPostName?: string;
  handleClick?: MediaProps['handleClick'];
  portraitMode?: boolean;
  fullMediaMode?: boolean;
  postMode?: boolean;
  read?: boolean;
  card?: boolean;
  hide?: boolean;
  fullRes?: boolean;
  xPostMode?: boolean;
  containerDims?: [number, number];
  mediaDimensions?: [number, number];
  uniformMediaMode?: boolean;
  inView?: boolean;
  checkCardHeight?: () => void;
}) => {
  const [postLocal, setPostLocal] = useState(post);

  // Sync postLocal with post prop changes
  useEffect(() => {
    setPostLocal(post);
  }, [post]);

  const context = useMainContext();
  const uiContext = useUIContext();
  const mediaContext = useMediaContext();
  const windowWidth = useWindowWidth();
  const [windowHeight, setWindowHeight] = useState(0);
  useEffect(() => {
    setWindowHeight(window.outerHeight);
    //don't monitor resize
    // const onResize = () => {
    //   setWindowHeight(window.outerHeight);
    // };
    // window.addEventListener("resize", onResize);
    // return () => {
    //   window.removeEventListener("resize", onResize);
    // };
  }, []);
  const mediaRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();
  const [isGallery, setIsGallery] = useState(false);
  const [galleryInfo, setGalleryInfo] = useState<GalleryInfo[]>();
  const [isImage, setIsImage] = useState(false);
  const [isMP4, setIsMP4] = useState(false);
  const [isTweet, setIsTweet] = useState(false);
  const [imageInfo, setImageInfo] = useState({ src: "", height: 0, width: 0 });
  const [videoInfo, setVideoInfo] = useState({
    hlsSrc: "",
    src: "",
    height: 0,
    width: 0,
    hasAudio: false,
  });
  const [placeholderInfo, setPlaceholderInfo] = useState({
    src: "",
    height: 0,
    width: 0,
  });

  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const onLoaded = useCallback(() => {
    setMediaLoaded(true);
    checkCardHeight && checkCardHeight();
  }, [checkCardHeight]);

  const [allowIFrame, setAllowIFrame] = useState<boolean>(() => !!postMode);
  const [isIFrame, setIsIFrame] = useState(false);
  const [iFrame, setIFrame] = useState<Element>();
  const [isYTVid, setisYTVid] = useState(false);

  useEffect(() => {
    //
    return () => {
      setIsIFrame(false);
      setIFrame(undefined);
    };
  }, [postLocal]);



  useEffect(() => {
    if (
      (postMode || columns === 1 || !!mediaContext.embedsEverywhere) &&
      !mediaContext.disableEmbeds &&
      !uniformMediaMode
    ) {
      setAllowIFrame(true);
    } else {
      setAllowIFrame(false);
    }
    // return () => {
    //   setAllowIFrame(false);
    // }
  }, [
    postMode,
    columns,
    mediaContext.disableEmbeds,
    mediaContext.embedsEverywhere,
    uniformMediaMode,
  ]);

  // Effect 1: Hydrate mediaInfo when missing
  useEffect(() => {
    const DOMAIN = window?.location?.hostname ?? "www.troddit.com";
    let mounted = true;

    const hydrateMediaInfo = async () => {
      if (postLocal && !postLocal.mediaInfo) {
        const m = await findMediaInfo(postLocal, false, DOMAIN);
        if (mounted) setPostLocal(prev => ({ ...prev, mediaInfo: m }));
      }
    };

    if (postLocal && !postLocal.mediaInfo) {
      hydrateMediaInfo();
    }

    return () => {
      mounted = false;
    };
  }, [postLocal]);

  // Effect 2: Derive image/video flags and info
  useEffect(() => {
    const shouldLoad = () => {
      if (!postLocal) return false;
      if (!postLocal.url) return false;
      if (!postLocal.title) return false;
      if (!postLocal.subreddit) return false;
      return true;
    };

    const checkURL = (url: string | undefined) => {
      const placeholder =
        "https://www.publicdomainpictures.net/pictures/280000/velka/not-found-image-15383864787lu.jpg"; //"http://goo.gl/ijai22";
      //if (!url) return placeholder;
      if (!url?.includes("http")) return placeholder;
      return url;
    };

    const findVideo = async () => {
      let optimize = "720";
      let src = "";
      if (!imgFull) {
        if (fullMediaMode) {
          if (!mediaContext.highRes && windowWidth < 640) {
            optimize = "480";
          }
        } else if (postMode) {
          optimize = "720";
        } else if (columns > 1 && windowWidth < 640) {
          optimize = "360";
        } else if (columns >= 3 && columns < 5) {
          optimize = "480";
        } else if (columns === 2) {
          optimize = "480"; //"1080";
        } else if (columns === 5) {
          optimize = "360";
        } else if (columns > 5) {
          optimize = "360";
        } else if (windowWidth < 640) {
          optimize = "480";
        }
      }

      if (postLocal?.mediaInfo?.videoInfo) {
        src = postLocal.mediaInfo.videoInfo?.[0]?.src;
        if (src?.includes("DASH_1080") && !imgFull) {
          src = src.replace("DASH_1080", `DASH_${optimize}`);
        }
        if (src?.includes("DASH_720") && !imgFull) {
          src = src.replace("DASH_720", `DASH_${optimize}`);
        }
        if (postLocal?.mediaInfo?.videoInfo?.[1]?.src && optimize !== "720") {
          src = postLocal.mediaInfo.videoInfo?.[1]?.src;
        }
        setVideoInfo({
          src: src,
          hlsSrc: postLocal.mediaInfo.videoInfo[0]?.hlsSrc,
          height: postLocal.mediaInfo.videoInfo[0].height,
          width: postLocal.mediaInfo.videoInfo[0].width,
          hasAudio: postLocal.mediaInfo.videoInfo[0]?.hasAudio,
        });
        setPlaceholderInfo({
          src: checkURL(postLocal?.thumbnail),
          height: postLocal.mediaInfo.videoInfo[0].height,
          width: postLocal.mediaInfo.videoInfo[0].width,
        });
        await findImage();
        setIsMP4(true);
        setIsImage(false);
        return true;
      }
      return false;
    };

    const findIframe = async () => {
      if (postLocal?.mediaInfo?.iFrameHTML) {
        const anyIframe: any = postLocal?.mediaInfo?.iFrameHTML as any;
        if (anyIframe?.src?.includes("youtube.com")) {
          setisYTVid(true);
        }
        setIFrame(postLocal.mediaInfo.iFrameHTML);
        setIsIFrame(true);
        return true;
      } else {
        return false;
      }
    };

    const findImage = async () => {
      if (postLocal?.mediaInfo?.isTweet) {
        setIsTweet(true);
        setIsIFrame(true);
        //return true;
      }

      if (postLocal?.mediaInfo?.isGallery) {
        setGalleryInfo(postLocal.mediaInfo.galleryInfo);
        setIsGallery(true);
        return true;
      } else if (
        (postLocal?.mediaInfo?.isVideo ||
          postLocal?.mediaInfo?.isImage ||
          postLocal?.mediaInfo?.isTweet ||
          postLocal?.mediaInfo?.isLink) &&
        postLocal?.mediaInfo?.imageInfo
      ) {
        let num = findOptimalImageIndex(postLocal.mediaInfo.imageInfo, {
          windowWidth,
          fullRes: fullRes || !!mediaContext.highRes,
          containerDims,
          context: {
            cardStyle: cardStyle,
            columns: columns,
            saveWideUI: uiContext.saveWideUI,
          },
          postMode,
        });

        let imgheight = postLocal.mediaInfo.imageInfo[num].height;
        let imgwidth = postLocal.mediaInfo.imageInfo[num].width;
        const imgSrc = checkURL(
          postLocal.mediaInfo.imageInfo[num].src.replace("amp;", "")
        );
        setImageInfo({
          src: imgSrc,
          height: imgheight,
          width: imgwidth,
        });
        setPlaceholderInfo({
          src: checkURL(postLocal.thumbnail),
          height: postLocal.mediaInfo?.thumbnailInfo?.height ?? imgheight,
          width: postLocal.mediaInfo?.thumbnailInfo?.width ?? imgwidth,
        });
        setIsImage(true);
        return true;
        // }
      }
      return false;
    };

    const initialize = async () => {
      let a = false, b = false, c = false;
      if (
        postLocal["mediaInfo"]?.isVideo &&
        !(uniformMediaMode && columns > 1 && windowWidth < 640) //dont load videos on small devices with multiple columns
      ) {
        b = await findVideo();
        if (b && !mediaContext.preferEmbeds) {
          setAllowIFrame(false);
        }
      }
      if (postLocal["mediaInfo"]?.isIframe && !uniformMediaMode) {
        c = await findIframe();
      }
      if (!b) {
        a = await findImage();
        if (
          a &&
          !mediaContext.preferEmbeds &&
          !!mediaContext.autoPlayMode &&
          fullMediaMode
        ) {
          setAllowIFrame(false);
        }
      }
      a || b || c || postLocal?.selftext_html ? setLoaded(true) : setLoaded(false);
    };

    if (shouldLoad()) {
      initialize();
    }

    return () => {
      setIsGallery(false);
      setIsIFrame(false);
      setGalleryInfo([]);
      setIsImage(false);
      setIsMP4(false);
      setisYTVid(false);
      setIsTweet(false);
      setImageInfo({ src: "", height: 0, width: 0 });
      setVideoInfo({
        src: "",
        hlsSrc: "",
        height: 0,
        width: 0,
        hasAudio: false,
      });
      setPlaceholderInfo({ src: "", height: 0, width: 0 });
      setMediaLoaded(false);
      setLoaded(false);
    };
  }, [postLocal, columns, imgFull, fullRes, mediaContext.highRes, windowWidth, uniformMediaMode, mediaContext.preferEmbeds, mediaContext.autoPlayMode, fullMediaMode, postMode, cardStyle, containerDims, uiContext.saveWideUI]);

  const [maxheightnum, setMaxheightnum] = useState<number>(() => {
    let yScale = 1;
    if (postMode) {
      yScale = 0.5;
    } else if (columns === 1) {
      yScale = 0.75;
    }
    return containerDims?.[1]
      ? containerDims?.[1]
      : mediaDimensions?.[1]
      ? mediaDimensions?.[1] //media dimensions as prescaled from parent feed
      : windowHeight * yScale;
  });
  useEffect(() => {
    setMaxheightnum(() => {
      let yScale = 1;
      if (postMode && !fullMediaMode) {
        yScale = 0.5;
      } else if (columns === 1) {
        yScale = 0.75;
      }
      return containerDims?.[1]
        ? containerDims?.[1]
        : mediaDimensions?.[1]
        ? mediaDimensions?.[1] //media dimensions as precalced from mymasonic
        : windowHeight * yScale;
    });
  }, [
    columns,
    postMode,
    fullMediaMode,
    windowHeight,
    containerDims,
    mediaDimensions,
  ]);

  const videoQuality = useMemo(
    () =>
      (!!mediaContext.highRes && fullMediaMode) || fullRes
        ? "full"
        : fullMediaMode
        ? windowWidth <= 640
          ? "hd"
          : "full"
        : postMode
        ? windowWidth <= 640
          ? "sd"
          : "full"
        : columns === 1
        ? windowWidth <= 640
          ? "sd"
          : "full"
        : columns > 1 && windowWidth <= 640
        ? "min"
        : columns <= 3
        ? "hd"
        : windowWidth <= 1440 || columns >= 5
        ? "sd"
        : "hd",

    [columns, mediaContext.highRes, windowWidth, fullMediaMode, postMode, fullRes]
  );

  const mediaExternalLink = useMemo(
    () => (
      <a
        aria-label="external link"
        onClick={(e) => e.stopPropagation()}
        className={
          "flex flex-grow items-center gap-1 px-0.5 py-2 mt-auto text-xs text-th-link hover:text-th-linkHover bg-th-base  bg-opacity-50 " +
          (postMode || columns === 1
            ? " "
            : " md:bg-black/0 md:group-hover:bg-black/80 ")
        }
        target={"_blank"}
        rel="noreferrer"
        href={postLocal?.url}
      >
        <span
          className={
            "ml-2 " +
            (postMode || columns === 1
              ? ""
              : "md:opacity-0 group-hover:opacity-100")
          }
        >
          {postLocal?.url?.split("?")?.[0]}
        </span>
        <BsBoxArrowInUpRight className="flex-none w-6 h-6 ml-auto mr-2 text-white group-hover:scale-110 " />
      </a>
    ),
    [postLocal?.url, postMode, columns]
  );

  return (
    <div
      className={
        uniformMediaMode
          ? "aspect-[9/16] overflow-hidden object-cover object-center"
          : " select-none group"
      }
      ref={mediaRef}
    >
      {loaded ? (
        <>
          {isIFrame && !fill && (
            <button
              aria-label="switch embed"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setAllowIFrame((f) => !f);
              }}
              className={
                "absolute  items-center z-10 gap-1 p-1 text-xs text-white bg-black rounded-md group-hover:flex   bg-opacity-20 hover:bg-opacity-40  " +
                (fullMediaMode
                  ? `bottom-1.5 left-10 md:bottom-24 md:left-1 flex `
                  : "bottom-24 hidden z-10 left-1 ")
              }
            >
              <ImEmbed />
              switch embed
            </button>
          )}

          {isTweet && allowIFrame && !hide && (
            <div
              className={scrollStyle + " overflow-hidden"}
              style={
                mediaDimensions?.[1] || postMode
                  ? {
                      height: `${maxheightnum}px`,
                      maxHeight: `${maxheightnum}px`,
                    }
                  : {
                      height: `24rem`,
                    }
              }
            >
              <div className="">
                <TwitterTweetEmbed
                  placeholder={
                    <div className="relative mx-auto border rounded-lg border-th-border w-60 h-80 animate-pulse bg-th-base">
                      <div className="absolute w-full h-full">
                        <AiOutlineTwitter className="absolute w-7 h-7 right-2 top-2 fill-[#1A8CD8]" />
                      </div>
                    </div>
                  }
                  onLoad={() => {
                    checkCardHeight && checkCardHeight();
                  }}
                  options={{
                    theme: theme === "light" ? "light" : "dark",
                    align: "center",
                  }}
                  tweetId={
                    postLocal.url
                      .split("/")
                      [postLocal.url.split("/").length - 1].split("?")[0]
                  }
                />
              </div>
            </div>
          )}
          {isIFrame && iFrame && allowIFrame && !isTweet && !hide && (
            <>
              <div
                className={
                  "w-full  " +
                  (containerDims?.[1] ? "" : postMode ? " max-h-[50vh]" : "")
                }
                style={
                  containerDims?.[1]
                    ? { height: `${containerDims[1]}px` }
                    : mediaDimensions?.[1]
                    ? { height: `${mediaDimensions[1]}px` }
                    : {
                        aspectRatio: `${
                          postLocal.mediaInfo?.dimensions[1] > 0 && !isYTVid
                            ? `${postLocal.mediaInfo?.dimensions[0]} / ${postLocal.mediaInfo?.dimensions[1]}`
                            : "16 / 9"
                        }`,
                      }
                }
                dangerouslySetInnerHTML={{
                  __html: iFrame.outerHTML,
                }}
              ></div>
              {!postMode && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleClick(e, { toMedia: true });
                  }}
                  className={
                    (uniformMediaMode ? "hidden md:flex" : "flex") +
                    " absolute items-center justify-center w-8 h-8 text-white bg-black rounded-md md:hidden md:group-hover:flex top-2 right-2 bg-opacity-20 hover:bg-opacity-40 "
                  }
                >
                  <BiExpand className="flex-none w-4 h-4" />
                </button>
              )}
            </>
          )}

          {isGallery && (
            <Gallery
              images={galleryInfo}
              columns={columns}
              maxheight={maxheightnum}
              postMode={postMode}
              mediaMode={fullMediaMode}
              mediaRef={mediaRef}
              isXPost={xPostMode}
              fillHeight={
                uniformMediaMode || (postMode && containerDims?.[1])
                  ? true
                  : false
              }
              containerDims={containerDims}
              checkCardHeight={checkCardHeight}
            />
          )}

          {isImage && (!allowIFrame || !isIFrame) && !isMP4 && (
            <div
              className={
                "block relative " +
                (postLocal?.mediaInfo?.isTweet
                  ? " flex items-center justify-center overflow-hidden rounded-lg relative ring-1 ring-[#E7E5E4] "
                  : "") +
                (uniformMediaMode ? " h-full w-full" : " ")
              }
              style={
                fill
                  ? {}
                  : containerDims?.[1]
                  ? { height: `${containerDims?.[1]}px` }
                  : mediaDimensions?.[1]
                  ? { height: `${mediaDimensions?.[1]}px` }
                  : postMode
                  ? { height: `${Math.min(maxheightnum, imageInfo.height)}px` }
                  : {}
              }
            >
              {!mediaLoaded && (
                <div className="absolute z-10 -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2">
                  <LoaderPuff />
                </div>
              )}
              {postLocal?.mediaInfo?.isTweet && (
                <div className="absolute flex w-full h-full bg-[#1A8CD8] rounded-lg  ">
                  <AiOutlineTwitter className="absolute z-20 right-2 top-2 w-10 h-10 fill-[#E7E5E4] group-hover:scale-125 transition-all " />
                </div>
              )}
              {postLocal?.mediaInfo?.isLink && !fill && (
                <div
                  className={
                    "absolute bottom-0 z-20 flex items-end w-full overflow-hidden break-all " +
                    (postLocal?.mediaInfo?.isTweet ? " rounded-b-lg " : "")
                  }
                >
                  {mediaExternalLink}
                </div>
              )}
              <Image
                src={imageInfo.src}
                height={imageInfo.height}
                width={imageInfo.width}
                alt={postLocal?.title}
                layout={
                  fill
                    ? "responsive"
                    : postLocal?.mediaInfo?.isTweet
                    ? "intrinsic"
                    : "fill"
                }
                onLoadingComplete={onLoaded}
                lazyBoundary={imgFull ? "0px" : "2000px"}
                objectFit={
                  uniformMediaMode || fill || postLocal?.mediaInfo?.isYTVid
                    ? "cover"
                    : cardStyle === "card2"
                    ? "fill"
                    : "contain"
                }
                priority={postMode}
                placeholder={
                  postLocal?.mediaInfo?.imageInfo?.[0]?.url && !fullMediaMode
                    ? "blur"
                    : undefined
                }
                blurDataURL={postLocal?.mediaInfo?.imageInfo?.[0]?.url}
                unoptimized={true}
                className={
                  " transition-opacity ease-in duration-300 " +
                  (mediaLoaded || fullMediaMode ? "opacity-100" : "opacity-50")
                }
              />
            </div>
          )}
          {isMP4 && (!allowIFrame || !isIFrame) ? (
            <div className="relative flex flex-col items-center flex-none">
              <VideoHandler
                name={postLocal?.name}
                columns={columns}
                curPostName={curPostName}
                thumbnail={placeholderInfo}
                placeholder={imageInfo} //{placeholderInfo}
                videoInfo={videoInfo}
                maxHeightNum={maxheightnum}
                imgFull={imgFull}
                postMode={postMode}
                containerDims={
                  containerDims?.[1] ? containerDims : mediaDimensions
                }
                fullMediaMode={fullMediaMode}
                hide={hide}
                uniformMediaMode={uniformMediaMode}
                quality={videoQuality}
                setAllowIframe={setAllowIFrame}
                checkCardHeight={checkCardHeight}
              />
              {!postMode && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleClick(e, { toMedia: true });
                  }}
                  className={
                    (uniformMediaMode ? "hidden md:flex" : "flex") +
                    " absolute items-center justify-center w-8 h-8 text-white bg-black rounded-md md:hidden md:group-hover:flex top-2 right-2 bg-opacity-20 hover:bg-opacity-40 "
                  }
                >
                  <BiExpand className="flex-none w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <></>
          )}
        </>
      ) : (
        <></>
      )}
      {postLocal?.mediaInfo?.isLink &&
        !isImage &&
        !isMP4 &&
        !isIFrame &&
        !isGallery && (
          <div className="overflow-hidden rounded-md">
            <ExternalLink domain={postLocal?.domain} url={postLocal.url} />
          </div>
        )}
    </div>
  );
};

function areEqualMedia(prev: any, next: any) {
  const dimsEq = (prev.mediaDimensions?.[0] ?? 0) === (next.mediaDimensions?.[0] ?? 0) && (prev.mediaDimensions?.[1] ?? 0) === (next.mediaDimensions?.[1] ?? 0);
  const contEq = (prev.containerDims?.[0] ?? 0) === (next.containerDims?.[0] ?? 0) && (prev.containerDims?.[1] ?? 0) === (next.containerDims?.[1] ?? 0);
  const baseEq = prev.columns === next.columns && prev.postMode === next.postMode && prev.fullMediaMode === next.fullMediaMode && prev.uniformMediaMode === next.uniformMediaMode && prev.inView === next.inView && prev.fill === next.fill;

  // Compare key media flags instead of relying on post object identity
  const prevMediaInfo = prev.post?.mediaInfo;
  const nextMediaInfo = next.post?.mediaInfo;
  const mediaFlagsEq =
    !!prevMediaInfo?.hasMedia === !!nextMediaInfo?.hasMedia &&
    !!prevMediaInfo?.isVideo === !!nextMediaInfo?.isVideo &&
    !!prevMediaInfo?.isImage === !!nextMediaInfo?.isImage &&
    !!prevMediaInfo?.isIframe === !!nextMediaInfo?.isIframe &&
    !!prevMediaInfo?.isTweet === !!nextMediaInfo?.isTweet &&
    !!prevMediaInfo?.isGallery === !!nextMediaInfo?.isGallery;

  const postCoreEq = prev.post?.name === next.post?.name && prev.post?.edited === next.post?.edited && prev.post?.url === next.post?.url;
  const otherEq = prev.cardStyle === next.cardStyle && prev.hide === next.hide && prev.imgFull === next.imgFull && prev.curPostName === next.curPostName;
  return dimsEq && contEq && baseEq && mediaFlagsEq && postCoreEq && otherEq;
}

export default React.memo(Media, areEqualMedia);
