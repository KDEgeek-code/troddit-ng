import Head from "next/head";
import NavBar from "../../components/NavBar";
import SubredditsPage from "../../components/SubredditsPage";
import React from "react";
import { useRouter } from "next/router";

const Subs = () => {
  const router = useRouter();
  const query = router.query;
  return (
    <div>
      <Head>
        <title>{`troddit · subreddits`}</title>
      </Head>

      <main>
        <SubredditsPage query={query} />
      </main>
    </div>
  );
};

export default Subs;
