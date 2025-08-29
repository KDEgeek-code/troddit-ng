import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import Feed from "../../components/Feed";
import NavBar from "../../components/NavBar";
import Head from "next/head";
import PostModal from "../../components/PostModal";
import LoginModal from "../../components/LoginModal";
import { loadPost } from "../../RedditAPI";
import { findMediaInfo } from "../../../lib/utils";

const FrontSortPage = () => {
  const router = useRouter();
  const query = router.query;
  return (
    <div>
      <Head>
        <title>
          {query?.frontsort ? `troddit · ${query?.frontsort}` : "troddit"}
        </title>
      </Head>

      <main className="">
        {query.frontsort === "best" ||
        query.frontsort === "hot" ||
        query.frontsort === "new" ||
        query.frontsort === "top" ||
        query.frontsort === "rising" ? (
          <>
            <Feed />
          </>
        ) : (
          <>
            <div className="mt-10">
              <LoginModal />
              <PostModal
                permalink={`/${query?.frontsort}`}
                returnRoute={query?.slug?.[0] ? `/r/${query?.slug[0]}` : "/"}
                setSelect={() => {}}
                direct={true}
                curKey={undefined}
                postNum={undefined}
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default FrontSortPage;
