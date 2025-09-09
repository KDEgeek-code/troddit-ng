/*
  Troddit Reddit API (Node, optional)
  How to run:
  - With ts-node: npx ts-node tests/reddit-api-unauthenticated-test.node.ts
  - Or register ts-node: node -r ts-node/register tests/reddit-api-unauthenticated-test.node.ts

  Notes:
  - This test imports the app's RedditAPI helpers to validate unauthenticated flows.
  - Network access to reddit.com is required for real calls.
*/

import { loadFront } from "../src/RedditAPI";

async function main() {
  try {
    const res = await loadFront({
      sort: "hot",
      range: undefined as any,
      after: undefined as any,
      count: undefined as any,
      localSubs: [],
      isPremium: false,
      loggedIn: false,
      // Skip token checks since we're unauthenticated here
      skipCheck: true,
    } as any);

    if (!res || !Array.isArray(res.children)) {
      throw new Error("Invalid response from loadFront");
    }
    const first = res.children[0]?.data || {};
    const required = ["title", "author", "permalink", "id"];
    const missing = required.filter((k) => !(k in first));
    if (missing.length) {
      console.warn("⚠ Missing fields from first post:", missing);
    } else {
      console.log("✔ loadFront returned expected post shape");
    }
  } catch (e) {
    console.error("✖ RedditAPI node test failed:", e);
    process.exitCode = 1;
  }
}

main();

