/*
  Troddit Reddit API (Unauthenticated) Test
  Usage: Paste into the browser DevTools Console (or run with node + fetch polyfill).

  What it does:
  - Calls public Reddit endpoints that do not require OAuth.
  - Validates structure for front page, subreddit, search, and comments.
  - Exercises basic error handling and simple rate-limiting behavior.
*/

(async function () {
  const start = Date.now();
  const style = {
    ok: "color: #10b981; font-weight:600;",
    warn: "color: #f59e0b; font-weight:600;",
    err: "color: #ef4444; font-weight:600;",
    head: "background:#1f2937;color:#fff;padding:2px 6px;border-radius:3px;",
    info: "color: #60a5fa;",
  };
  const time = () => `${((Date.now() - start) / 1000).toFixed(2)}s`;
  const section = (t) => console.log("%cAPI", style.head, t);
  const ok = (m, x) => console.log(`%c✔ ${m}`, style.ok, x ?? "");
  const warn = (m, x) => console.warn(`%c⚠ ${m}`, style.warn, x ?? "");
  const err = (m, x) => console.error(`%c✖ ${m}`, style.err, x ?? "");
  const info = (m, x) => console.log(`%c• ${m}`, style.info, x ?? "");

  async function get(url) {
    const res = await fetch(url, { headers: { "Accept": "application/json" } });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
  }

  function validateListing(listing) {
    return listing && listing.kind === "Listing" && Array.isArray(listing.data?.children);
  }

  function basicPostFields(post) {
    const data = post?.data || {};
    const required = ["title", "author", "score", "id", "permalink"];
    const missing = required.filter((k) => !(k in data));
    return { ok: missing.length === 0, missing, data };
  }

  function filterChildren(children) {
    return (children || []).filter((c) => c && c.kind && c.kind !== "more");
  }

  try {
    section("Front Page");
    let front;
    let posts = [];
    const api = typeof window !== 'undefined' ? (window.__TRODDIT_API__ || null) : null;
    if (api?.loadFront) {
      try {
        const wrapped = await api.loadFront({ limit: 10 });
        if (wrapped && Array.isArray(wrapped.children)) {
          ok("Front loaded via RedditAPI wrapper");
          // normalize into listing-like for validation
          posts = filterChildren(wrapped.children.map((c) => ({ kind: c.kind || 't3', data: c.data })));
          front = { kind: "Listing", data: { children: posts } };
        }
      } catch (e) {
        warn("Wrapper loadFront failed; falling back to fetch", String(e));
      }
    }
    if (!front) {
      front = await get("https://www.reddit.com/.json?limit=10");
    }
    if (!validateListing(front)) throw new Error("Invalid front listing structure");
    ok("Front listing structure valid");
    posts = posts.length ? posts : filterChildren(front.data.children);
    info(`Front posts fetched: ${posts.length}`);
    if (posts.length) {
      const v = basicPostFields(posts[0]);
      if (v.ok) ok("Front post has required fields"); else warn("Front post missing fields", v.missing);
    }

    section("Subreddit (r/javascript)");
    let sub;
    try {
      const api2 = typeof window !== 'undefined' ? (window.__TRODDIT_API__ || null) : null;
      if (api2?.loadSubreddit) {
        const wrapped = await api2.loadSubreddit({ name: 'javascript', limit: 10 });
        if (wrapped && Array.isArray(wrapped.children)) {
          ok("Subreddit loaded via RedditAPI wrapper");
          const children = filterChildren(wrapped.children.map((c) => ({ kind: c.kind || 't3', data: c.data })));
          sub = { kind: 'Listing', data: { children } };
        }
      } else if (api2?.loadSubreddits) {
        const wrapped = await api2.loadSubreddits({ subreddits: 'javascript', sort: 'hot' });
        if (wrapped && Array.isArray(wrapped.children)) {
          ok("Subreddit loaded via RedditAPI wrapper");
          const children = filterChildren(wrapped.children.map((c) => ({ kind: c.kind || 't3', data: c.data })));
          sub = { kind: 'Listing', data: { children } };
        }
      }
    } catch (e) {
      warn("Wrapper loadSubreddit failed; falling back to fetch", String(e));
    }
    if (!sub) {
      sub = await get("https://www.reddit.com/r/javascript/.json?limit=10");
    }
    if (!validateListing(sub)) throw new Error("Invalid subreddit listing structure");
    ok("Subreddit listing structure valid");
    const subPosts = filterChildren(sub.data.children);
    info(`Subreddit posts fetched: ${subPosts.length}`);

    section("Search (q=nextjs)");
    let search;
    try {
      const api3 = typeof window !== 'undefined' ? (window.__TRODDIT_API__ || null) : null;
      if (api3?.loadSearch) {
        const wrapped = await api3.loadSearch({ q: 'nextjs', limit: 5 });
        if (wrapped) {
          // Try to normalize various plausible shapes into a Listing
          let children = [];
          if (Array.isArray(wrapped.children)) children = wrapped.children;
          else if (Array.isArray(wrapped?.data?.children)) children = wrapped.data.children;
          // Map to { kind, data }
          if (children.length) {
            ok("Search loaded via RedditAPI wrapper");
            const mapped = filterChildren(children.map((c) => ({ kind: c.kind || 't3', data: c.data })));
            search = { kind: 'Listing', data: { children: mapped } };
          }
        }
      }
    } catch (e) {
      warn("Wrapper loadSearch failed; falling back to fetch", String(e));
    }
    if (!search) {
      search = await get("https://www.reddit.com/search.json?q=nextjs&limit=5");
    }
    if (!validateListing(search)) throw new Error("Invalid search listing structure");
    ok("Search listing structure valid");
    const sr = filterChildren(search.data.children);
    info(`Search results: ${sr.length}`);

    section("Comments (from a front post)");
    const sample = posts.find((p) => p?.data?.permalink);
    if (sample?.data?.permalink) {
      const url = `https://www.reddit.com${sample.data.permalink}.json?limit=50`;
      let thread;
      try {
        const api4 = typeof window !== 'undefined' ? (window.__TRODDIT_API__ || null) : null;
        if (api4?.loadComments) {
          const wrapped = await api4.loadComments({ permalink: sample.data.permalink, limit: 50 });
          if (Array.isArray(wrapped)) {
            ok("Comments loaded via RedditAPI wrapper");
            // If wrapper returns only comment children (as in current implementation), wrap into Listing
            const commentsListing = { kind: 'Listing', data: { children: filterChildren(wrapped.map((c) => ({ kind: c.kind || 't1', data: c.data }))) } };
            const postListing = { kind: 'Listing', data: { children: [] } };
            thread = [postListing, commentsListing];
          }
        }
      } catch (e) {
        warn("Wrapper loadComments failed; falling back to fetch", String(e));
      }
      if (!thread) {
        thread = await get(url);
      }
      if (!Array.isArray(thread) || thread.length < 2) throw new Error("Invalid comments thread structure");
      ok("Comments thread array structure valid");
      const commentsListing = thread[1];
      if (validateListing(commentsListing)) {
        const first = filterChildren(commentsListing.data.children)[0];
        if (first?.data?.body) ok("First comment has body"); else warn("First comment missing body");
      }
    } else {
      warn("No sample post with permalink to test comments");
    }

    section("Error Handling & Rate Limiting");
    try {
      await get("https://www.reddit.com/r/this_sub_does_not_exist_404/.json");
      warn("Invalid subreddit unexpectedly returned OK");
    } catch (e) {
      ok("Invalid subreddit correctly failed", String(e));
    }
    info("Note: Reddit rate limits may temporarily throttle repeated calls.");

    console.log(`%cDone in ${time()}`, style.ok);
  } catch (e) {
    err("API test failed", e);
  }
})();
