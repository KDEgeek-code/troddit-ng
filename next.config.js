const { withPlausibleProxy } = require("next-plausible");

// Media domain configurations for cache-first strategy
const mediaDomains = [
  {
    domain: "i.redd.it",
    destinations: ["image", "video"],
    cacheName: "reddit-images-cache",
  },
  {
    domain: "preview.redd.it",
    destinations: ["image"],
    cacheName: "reddit-previews-cache",
  },
  {
    domain: "external-preview.redd.it",
    destinations: ["image"],
    cacheName: "reddit-external-previews-cache",
  },
  {
    domain: "www.redditstatic.com",
    destinations: ["image"],
    cacheName: "reddit-static-cache",
  },
  {
    domain: "i.redditmedia.com",
    destinations: ["image"],
    cacheName: "redditmedia-images-cache",
  },
  { domain: "i.imgur.com", destinations: ["image"], cacheName: "imgur-cache" },
  {
    domain: "thumbs.gfycat.com",
    destinations: ["image"],
    cacheName: "gfycat-thumbs-cache",
  },
  {
    domain: "i.ytimg.com",
    destinations: ["image"],
    cacheName: "youtube-thumbnails-cache",
  },
];

// Video domains requiring range request support
const videoDomains = [
  {
    domain: "giant.gfycat.com",
    destinations: ["video"],
    cacheName: "gfycat-giant-cache",
  },
  {
    domain: "*.redgifs.com",
    destinations: ["image", "video"],
    cacheName: "redgifs-cache",
  },
];

// Generate media cache entries
const generateMediaCacheEntry = (
  domain,
  destinations,
  cacheName,
  withRangeRequests = false,
) => ({
  urlPattern: ({ request, url }) => {
    // First escape the literal domain string, then replace wildcards with pattern for multiple domain labels
    const escapedDomain = domain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const wildcardPattern = escapedDomain.replace(/\\\*/g, '(?:[^.]+\\.)*[^.]+');
    const domainRegex = new RegExp(
      `^https://${wildcardPattern}/.*`,
      "i",
    );
    return (
      domainRegex.test(url.href) &&
      destinations.some((dest) => request.destination === dest)
    );
  },
  handler: "CacheFirst",
  options: {
    cacheName,
    cacheableResponse: {
      statuses: withRangeRequests ? [0, 200, 206] : [0, 200],
    },
    ...(withRangeRequests && { rangeRequests: true }),
    expiration: {
      maxEntries: cacheName.includes("video")
        ? 50
        : destinations.includes("video")
          ? 100
          : 200,
      maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      purgeOnQuotaError: true,
    },
  },
});

const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  runtimeCaching: [
    // Reddit API Caching - networkFirst strategy for fresh data
    {
      urlPattern: /^https:\/\/www\.reddit\.com\/(.*\.json.*|api\/.*)/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "reddit-api-cache",
        cacheableResponse: { statuses: [0, 200] },
        networkTimeoutSeconds: 8,
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 5 * 60,
          purgeOnQuotaError: true,
        },
      },
    },
    {
      urlPattern: /^https:\/\/oauth\.reddit\.com\/.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "reddit-oauth-cache",
        cacheableResponse: { statuses: [0, 200] },
        networkTimeoutSeconds: 5,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 5 * 60,
          purgeOnQuotaError: true,
        },
      },
    },
    {
      urlPattern: ({ url }) => url.pathname.startsWith("/api/reddit/"),
      handler: "NetworkFirst",
      options: {
        cacheName: "internal-reddit-api-cache",
        cacheableResponse: { statuses: [0, 200] },
        networkTimeoutSeconds: 6, // Increased from 3 to 6 seconds for internal API routes
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 5 * 60, // 5 minutes
          purgeOnQuotaError: true,
        },
      },
    },
    // Reddit video with range request support
    {
      urlPattern: ({ request, url }) => {
        return (
          url.href.match(/^https:\/\/v\.redd\.it\/.*/i) &&
          (request.destination === "video" ||
            request.destination === "audio" ||
            url.pathname.endsWith(".mp4") ||
            url.pathname.endsWith(".m3u8") ||
            url.pathname.endsWith(".mpd") ||
            url.pathname.includes("/DASH_"))
        );
      },
      handler: "CacheFirst",
      options: {
        cacheName: "reddit-videos-cache",
        cacheableResponse: { statuses: [0, 200, 206] },
        rangeRequests: true,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          purgeOnQuotaError: true,
        },
      },
    },
    // Generate standard media cache entries
    ...mediaDomains.map(({ domain, destinations, cacheName }) =>
      generateMediaCacheEntry(domain, destinations, cacheName),
    ),
    // Generate video cache entries with range request support
    ...videoDomains.map(({ domain, destinations, cacheName }) =>
      generateMediaCacheEntry(domain, destinations, cacheName, true),
    ),
  ],
  fallbacks: {
    document: "/fallback.html",
  },
});
module.exports = withPlausibleProxy()(
  withPWA({
    output: "standalone",
    reactStrictMode: false, //true
    swcMinify: true,
    compiler: {
      removeConsole: process.env.NODE_ENV !== "development",
    },
    images: {
      domains: [
        "i.redd.it",
        "v.redd.it",
        "i.redditmedia.com",
        "preview.redd.it",
        "external-preview.redd.it",
        "www.redditstatic.com",
        "i.imgur.com",
        "thumbs.gfycat.com",
        "giant.gfycat.com",
        "i.ytimg.com",
        "redgifs.com",
        "www.redgifs.com",
        "thumbs2.redgifs.com",
        "thumbs3.redgifs.com",
        "thumbs4.redgifs.com",
        "thumbs.redgifs.com",
        "cdn.redgifs.com",
      ],
    },
    experimental: {
      scrollRestoration: true,
    },
    async redirects() {
      return [
        {
          source: "/user/:path*",
          destination: "/u/:path*",
          permanent: true,
        },
        { source: "/comments/:path*", destination: "/:path*", permanent: true },
        {
          source: "/r/:sub/w/:page*",
          destination: "/r/:sub/wiki/:page*",
          permanent: true,
        },
      ];
    },
    async rewrites() {
      return [
        {
          source: "/js/script.js",
          destination: "https://plausible.io/js/plausible.js",
        },
        {
          source: "/api/event", // Or '/api/event/' if you have `trailingSlash: true` in this config
          destination: "https://plausible.io/api/event",
        },
      ];
    },

    async headers() {
      const csp = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://plausible.io",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' blob: data: https://i.redd.it https://v.redd.it https://i.redditmedia.com https://preview.redd.it https://external-preview.redd.it https://www.redditstatic.com https://i.imgur.com https://thumbs.gfycat.com https://giant.gfycat.com https://i.ytimg.com https://thumbs.redgifs.com https://cdn.redgifs.com https://redgifs.com https://www.redgifs.com",
        "media-src 'self' blob: https://v.redd.it https://giant.gfycat.com https://cdn.redgifs.com https://*.redgifs.com",
        "connect-src 'self' https://www.reddit.com https://oauth.reddit.com https://plausible.io https://cdn.redgifs.com",
        "frame-src 'self' https://clips.twitch.tv https://www.youtube.com https://www.redditmedia.com",
        "font-src 'self' data:",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join("; ");
      return [
        {
          source: "/:path*",
          headers: [
            { key: "Content-Security-Policy", value: csp },
            {
              key: "Referrer-Policy",
              value: "strict-origin-when-cross-origin",
            },
            { key: "X-Frame-Options", value: "DENY" },
            { key: "X-Content-Type-Options", value: "nosniff" },
            {
              key: "Permissions-Policy",
              value:
                "camera=(), microphone=(), geolocation=(), interest-cohort=()",
            },
            {
              key: "Strict-Transport-Security",
              value: "max-age=63072000; includeSubDomains; preload",
            },
            { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
            { key: "Cross-Origin-Resource-Policy", value: "cross-origin" },
          ],
        },
      ];
    },
  }),
);
