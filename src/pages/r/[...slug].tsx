import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import NavBar from "../../components/NavBar";
import Feed from "../../components/Feed";
import { useEffect, useState } from "react";
import SubredditBanner from "../../components/SubredditBanner";
import {
  getWikiContent,
  loadPost,
  loadSubredditInfo,
  loadSubreddits,
} from "../../RedditAPI";
import ParseBodyHTML from "../../components/ParseBodyHTML";
import Collection from "../../components/collections/Collection";
import PostModal from "../../components/PostModal";
import LoginModal from "../../components/LoginModal";
import React from "react";
import useThread from "../../hooks/useThread";
import { findMediaInfo } from "../../../lib/utils";
import { getToken } from "next-auth/jwt";
import { getSession } from "next-auth/react";
import { useTAuth } from "../../PremiumAuthContext";
const SubredditPage = () => {
  const router = useRouter();
  const query = router.query;
  const user = useTAuth();
  const [subsArray, setSubsArray] = useState<string[]>([]);
  const [wikiContent, setWikiContent] = useState("");
  const [wikiMode, setWikiMode] = useState(false);
  const [commentThread, setCommentThread] = useState(false);
  const [postThread, setPostThread] = useState(false);
  const [withCommentContext, setWithCommentContext] = useState(false);
  useEffect(() => {
    const getWiki = async (wikiquery: {
      wikiquery: string[];
      isPremium: boolean;
    }) => {
      const data = await getWikiContent(wikiquery);
      setWikiContent(data?.data?.content_html ?? "nothing found");
    };

    if (user.isLoaded) {
      const first = Array.isArray(query.slug)
        ? query.slug[0]
        : (query.slug as string | undefined);
      setSubsArray(
        (first ?? "")
          .split(" ")
          .join("+")
          .split(",")
          .join("+")
          .split("%20")
          .join("+")
          .split("+"),
      );
      if (
        Array.isArray(query.slug) &&
        query.slug?.[1]?.toUpperCase() === "COMMENTS"
      ) {
        setPostThread(true);
        query?.context && setWithCommentContext(true);
        Array.isArray(query.slug) && query.slug?.[4] && setCommentThread(true);
      } else if (
        Array.isArray(query.slug) &&
        query.slug?.[1]?.toUpperCase() === "WIKI"
      ) {
        setWikiMode(true);
        const wikiquery = Array.isArray(query.slug) ? [...query.slug] : [];
        if (!wikiquery?.[2]) wikiquery[2] = "index";
        getWiki({ wikiquery, isPremium: user.premium?.isPremium ?? false });
      }
    }

    return () => {
      setPostThread(false);
      setWithCommentContext(false);
      setCommentThread(false);
      setWikiMode(false);
      setSubsArray([]);
    };
  }, [query, user.isLoaded, user.premium?.isPremium]);
  return (
    <div
      className={
        (subsArray?.[0]?.toUpperCase() !== "ALL" &&
        subsArray?.[0]?.toUpperCase() !== "POPULAR"
          ? " -mt-2 "
          : "") + " overflow-x-hidden overflow-y-auto "
      }
    >
      <Head>
        <title>
          {query?.slug?.[0] ? `troddit · ${query?.slug?.[0]}` : "troddit"}
        </title>
      </Head>
      <main>
        {subsArray?.[0]?.toUpperCase() !== "ALL" &&
        subsArray?.[0]?.toUpperCase() !== "POPULAR" &&
        subsArray?.length > 0 ? (
          <div className="w-screen ">
            <SubredditBanner subreddits={subsArray} userMode={false} />
          </div>
        ) : (
          <div className=""></div>
        )}
        {wikiMode ? (
          <div className="flex flex-col flex-wrap mb-10 md:mx-10 lg:mx-20">
            <Link href={`/r/${subsArray[0]}/wiki`}>
              <h1 className="text-lg font-bold">Wiki</h1>
            </Link>
            {wikiContent ? (
              <ParseBodyHTML html={wikiContent} newTabLinks={false} />
            ) : (
              <div className="w-full rounded-md h-96 bg-th-highlight animate-pulse"></div>
            )}
          </div>
        ) : postThread ? (
          <div className="mt-10">
            <LoginModal />
            <PostModal
              permalink={
                "/r/" +
                (Array.isArray(query.slug)
                  ? query.slug.join("/")
                  : String(query.slug ?? ""))
              }
              returnRoute={
                Array.isArray(query.slug) && query.slug[0]
                  ? `/r/${query.slug[0]}`
                  : "/"
              }
              setSelect={setCommentThread}
              direct={true}
              commentMode={commentThread}
              withcontext={withCommentContext}
              postNum={0}
              curKey={undefined}
            />
          </div>
        ) : (
          <Feed />
        )}
      </main>
    </div>
  );
};

// getInitialProps removed; using useRouter for query

export default SubredditPage;
