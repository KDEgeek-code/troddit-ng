import Head from "next/head";
import { useRouter } from "next/router";

import SearchPage from "../../components/SearchPage";
import React from "react";

const Search = () => {
  const router = useRouter();
  const query = router.query;
  return (
    <div>
      <Head>
        <title>{`troddit  ${query?.q ? `· ${query.q} ` : ``}`}</title>
      </Head>

      <main>
        <SearchPage query={query} />
      </main>
    </div>
  );
};

export default Search;
