// Reddit API Types
export interface RedditListing<T> {
  kind: "t3" | "t1" | "t4" | "t5" | "Listing";
  data: {
    children: T[];
    after: string | null;
    before: string | null;
    dist?: number;
    modhash?: string;
  };
  token?: { expires?: number; accessToken?: string } | undefined;
}

// Flattened listing for API loaders that return flattened structures
export interface FlattenedListing<T> {
  kind: "t3" | "t1" | "t4" | "t5" | "Listing";
  children: T[];
  after: string | null;
  before: string | null;
  dist?: number;
  modhash?: string;
  token?: { expires?: number; accessToken?: string } | undefined;
}

export interface RedditPost {
  kind: "t3";
  data: {
    id: string;
    name: string;
    author: string;
    title: string;
    subreddit: string;
    subreddit_name_prefixed: string;
    permalink: string;
    url: string;
    selftext?: string;
    selftext_html?: string;
    score: number;
    ups: number;
    downs: number;
    upvote_ratio: number;
    num_comments: number;
    created_utc: number;
    over_18: boolean;
    spoiler: boolean;
    stickied: boolean;
    locked: boolean;
    archived: boolean;
    is_video: boolean;
    is_reddit_media_domain: boolean;
    is_self: boolean;
    post_hint?: string;
    domain: string;
    thumbnail?: string;
    media?: RedditMedia;
    media_embed?: RedditMediaEmbed;
    preview?: RedditPreview;
    gallery_data?: RedditGalleryData;
    crosspost_parent_list?: RedditPost[];
    all_awardings?: RedditAward[];
    link_flair_text?: string;
    link_flair_background_color?: string;
    author_flair_text?: string;
    author_flair_background_color?: string;
    hidden: boolean;
    saved: boolean;
    likes?: boolean | null;
    visited: boolean;
    distinguished?: "moderator" | "admin" | null;
    quarantine: boolean;
    can_mod_post: boolean;
    removal_reason?: string;
    banned_by?: string;
    approved_by?: string;
    hide_score: boolean;
    edited: boolean | number;
    gilded: number;
    total_awards_received: number;
    wls: number;
    clicked: boolean;
    view_count?: number;
    subreddit_subscribers: number;
    pwls: number;
    send_replies: boolean;
    parent_whitelist_status: string;
    whitelist_status: string;
    can_gild: boolean;
    top_awarded_type?: string;
    secure_media?: RedditMedia;
    secure_media_embed?: RedditMediaEmbed;
    contest_mode: boolean;
    approved_at_utc?: number;
    banned_at_utc?: number;
    mod_reason_by?: string;
    num_reports?: number;
    removal_reason_title?: string;
    mod_note?: string;
    treatment_tags: string[];
  };
}

export interface RedditComment {
  kind: "t1";
  data: {
    id: string;
    name: string;
    author: string;
    body: string;
    body_html: string;
    score: number;
    ups: number;
    downs: number;
    created_utc: number;
    permalink: string;
    parent_id: string;
    link_id: string;
    subreddit: string;
    depth: number;
    replies?: RedditListing<RedditComment> | string;
    collapsed: boolean;
    is_submitter: boolean;
    score_hidden: boolean;
    can_mod_post: boolean;
    send_replies: boolean;
    saved: boolean;
    likes?: boolean | null;
    author_flair_text?: string;
    author_flair_background_color?: string;
    distinguished?: "moderator" | "admin" | null;
    stickied: boolean;
    all_awardings?: RedditAward[];
    gilded: number;
    total_awards_received: number;
    archived: boolean;
    no_follow: boolean;
    locked: boolean;
    can_gild: boolean;
    treatment_tags: string[];
    edited: boolean | number;
    quarantine: boolean;
    collapsed_because_crowd_control?: boolean;
    collapsed_reason?: string;
    associated_award?: RedditAward;
    unrepliable_reason?: string;
    count?: number;
    children?: string[];
  };
}

export interface RedditUser {
  kind: "t2";
  data: {
    id: string;
    name: string;
    icon_img: string;
    created_utc: number;
    link_karma: number;
    comment_karma: number;
    is_employee: boolean;
    is_mod: boolean;
    is_gold: boolean;
    has_verified_email: boolean;
    subreddit?: {
      display_name: string;
      title: string;
      icon_img: string;
      over_18: boolean;
      public_description: string;
      subscribers: number;
    };
  };
}

export interface RedditSubreddit {
  kind: "t5";
  data: {
    id: string;
    name: string;
    display_name: string;
    display_name_prefixed: string;
    title: string;
    description: string;
    description_html: string;
    public_description: string;
    subscribers: number;
    active_user_count: number;
    created_utc: number;
    over18: boolean;
    icon_img?: string;
    banner_img?: string;
    community_icon?: string;
    banner_background_image?: string;
    header_img?: string;
    primary_color: string;
    key_color: string;
    user_is_subscriber: boolean;
    user_is_moderator: boolean;
    user_is_contributor: boolean;
    user_is_banned: boolean;
    user_can_flair_in_sr: boolean;
    submit_text: string;
    submit_text_html: string;
    subreddit_type: "public" | "private" | "restricted";
    lang: string;
    whitelist_status: string;
    url: string;
  };
}

export interface RedditMedia {
  type?: string;
  oembed?: {
    provider_url: string;
    description: string;
    title: string;
    type: string;
    author_name: string;
    height: number;
    width: number;
    html: string;
    thumbnail_width: number;
    version: string;
    provider_name: string;
    thumbnail_url: string;
    thumbnail_height: number;
    author_url: string;
  };
  reddit_video?: {
    bitrate_kbps: number;
    fallback_url: string;
    height: number;
    width: number;
    scrubber_media_url: string;
    dash_url: string;
    duration: number;
    hls_url: string;
    is_gif: boolean;
    transcoding_status: string;
  };
}

export interface RedditMediaEmbed {
  content?: string;
  width?: number;
  height?: number;
  scrolling?: boolean;
  media_domain_url?: string;
}

export interface RedditPreview {
  images: RedditPreviewImage[];
  enabled: boolean;
  reddit_video_preview?: {
    bitrate_kbps: number;
    fallback_url: string;
    height: number;
    width: number;
    scrubber_media_url: string;
    dash_url: string;
    duration: number;
    hls_url: string;
    is_gif: boolean;
    transcoding_status: string;
  };
}

export interface RedditPreviewImage {
  source: RedditImageSource;
  resolutions: RedditImageSource[];
  variants: Record<
    string,
    {
      source: RedditImageSource;
      resolutions: RedditImageSource[];
    }
  >;
  id: string;
}

export interface RedditImageSource {
  url: string;
  width: number;
  height: number;
}

export interface RedditGalleryData {
  items: RedditGalleryItem[];
}

export interface RedditGalleryItem {
  media_id: string;
  id: number;
  caption?: string;
  outbound_url?: string;
}

export interface RedditAward {
  giver_coin_reward: number;
  subreddit_id?: string;
  is_new: boolean;
  days_of_drip_extension: number;
  coin_price: number;
  id: string;
  penny_donate: number;
  award_sub_type: string;
  coin_reward: number;
  icon_url: string;
  days_of_premium: number;
  tiers_by_required_awardings?: Record<string, any>;
  resized_icons: RedditImageSource[];
  icon_width: number;
  static_icon_width: number;
  start_date?: number;
  is_enabled: boolean;
  awardings_required_to_grant_benefits?: number;
  description: string;
  end_date?: number;
  subreddit_coin_reward: number;
  count: number;
  static_icon_height: number;
  name: string;
  resized_static_icons: RedditImageSource[];
  icon_format?: string;
  icon_height: number;
  penny_price: number;
  award_type: string;
  static_icon_url: string;
}

// Media Types
export interface MediaInfo {
  videoInfo?: VideoInfo[];
  imageInfo?: ImageInfo[];
  galleryInfo?: GalleryInfo[];
  thumbnailInfo?: ImageInfo;
  iFrameHTML?: Element;
  dimensions: [number, number];
  isVideo?: boolean;
  isImage?: boolean;
  isGallery?: boolean;
  isIframe?: boolean;
  isTweet?: boolean;
  isLink?: boolean;
  isYTVid?: boolean;
  hasMedia?: boolean;
  thumbnail?: string;
  thumbnail_height?: number;
  thumbnail_width?: number;
  isDual?: boolean;
  isPortrait?: boolean;
  isSelf?: boolean;
}

// PostData interface for components that work with post.data-level objects with optional mediaInfo
export type PostData = RedditPost["data"] & {
  mediaInfo?: MediaInfo;
};

export interface ImageInfo {
  url?: string;
  src: string;
  width: number;
  height: number;
  alt?: string;
  caption?: string;
}

export interface VideoInfo {
  url?: string;
  src: string;
  hlsSrc?: string;
  fallback_url?: string;
  width: number;
  height: number;
  duration?: number;
  hasAudio?: boolean;
  isGif?: boolean;
  dash_url?: string;
  hls_url?: string;
}

export interface GalleryInfo {
  media: ImageInfo[] | VideoInfo[];
  images?: ImageInfo[];
  captions?: string[];
  caption?: string;
}

// Utility Types
export type FilterType =
  | "seen"
  | "read"
  | "images"
  | "videos"
  | "galleries"
  | "links"
  | "self"
  | "portrait"
  | "landscape"
  | "imgRes"
  | "score";
export type CardStyle = "default" | "compact" | "row1" | "media";
export type SortType =
  | "hot"
  | "new"
  | "rising"
  | "top"
  | "controversial"
  | "best";
export type UserMode =
  | "submitted"
  | "comments"
  | "upvoted"
  | "downvoted"
  | "saved"
  | "hidden"
  | "gilded";
export type PostType = "links" | "comments";

// Feed utility types
export type PostSeenMap = Record<string, 1>;
export interface Filters {
  seen?: boolean;
  read?: boolean;
  images?: boolean;
  videos?: boolean;
  galleries?: boolean;
  links?: boolean;
  self?: boolean;
  portrait?: boolean;
  landscape?: boolean;
  imgRes?: boolean;
  score?: boolean;
  [key: string]: boolean | number | undefined;
}

// Main Context Interface
export interface MainContextValue {
  // Basic state
  pauseAll: boolean;
  setPauseAll: React.Dispatch<React.SetStateAction<boolean>>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  ready: boolean;
  setReady: React.Dispatch<React.SetStateAction<boolean>>;
  postOpen: boolean;
  setPostOpen: React.Dispatch<React.SetStateAction<boolean>>;
  mediaMode: boolean;
  setMediaMode: React.Dispatch<React.SetStateAction<boolean>>;
  uniformHeights: boolean | undefined;
  setUniformHeights: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  highRes: boolean;
  setHighRes: React.Dispatch<React.SetStateAction<boolean>>;
  loginModal: boolean;
  setLoginModal: React.Dispatch<React.SetStateAction<boolean>>;
  premiumModal: boolean;
  setPremiumModal: React.Dispatch<React.SetStateAction<boolean>>;
  rateLimitModal: {
    show: boolean;
    timeout: number;
    start: Date;
  };
  setRateLimitModal: React.Dispatch<
    React.SetStateAction<{ show: boolean; timeout: number; start: Date }>
  >;
  columns: number;
  setColumns: React.Dispatch<React.SetStateAction<number>>;
  posts: RedditPost[];
  setPosts: React.Dispatch<React.SetStateAction<RedditPost[]>>;
  postNum: number;
  setPostNum: React.Dispatch<React.SetStateAction<number>>;
  token: { expires?: number; accessToken?: string } | null;
  setToken: React.Dispatch<
    React.SetStateAction<{ expires?: number; accessToken?: string } | null>
  >;
  gAfter: string;
  setGAfter: React.Dispatch<React.SetStateAction<string>>;
  safeSearch: boolean;
  setSafeSearch: React.Dispatch<React.SetStateAction<boolean>>;
  volume: number | undefined;
  setVolume: React.Dispatch<React.SetStateAction<number | undefined>>;
  progressKey: number;
  setProgressKey: React.Dispatch<React.SetStateAction<number>>;
  fastRefresh: number;
  setFastRefresh: React.Dispatch<React.SetStateAction<number>>;

  // Settings
  nsfw: boolean | undefined;
  setNSFW: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  toggleNSFW: () => void;
  autoplay: boolean | undefined;
  setAutoplay: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  toggleAutoplay: () => void;
  hoverplay: boolean | undefined;
  setHoverPlay: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  toggleHoverPlay: () => void;
  columnOverride: number | undefined;
  setColumnOverride: React.Dispatch<React.SetStateAction<number | undefined>>;
  audioOnHover: boolean | undefined;
  setAudioOnHover: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  toggleAudioOnHover: () => void;
  autoHideNav: boolean | undefined;
  setAutoHideNav: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  toggleAutoHideNav: () => void;
  wideUI: boolean | undefined;
  setWideUI: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  saveWideUI: boolean | undefined;
  setSaveWideUI: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  toggleWideUI: () => void;
  syncWideUI: boolean;
  setSyncWideUI: React.Dispatch<React.SetStateAction<boolean>>;
  toggleSyncWideUI: () => void;
  postWideUI: boolean | undefined;
  setPostWideUI: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  togglePostWideUI: () => void;
  mediaOnly: boolean | undefined;
  setMediaOnly: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  toggleMediaOnly: () => void;
  cardStyle: CardStyle;
  setCardStyle: React.Dispatch<React.SetStateAction<CardStyle>>;
  compactLinkPics: boolean | undefined;
  setCompactLinkPics: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  toggleCompactLinkPics: () => void;
  preferSideBySide: boolean | undefined;
  setPreferSideBySide: React.Dispatch<
    React.SetStateAction<boolean | undefined>
  >;
  togglePreferSideBySide: () => void;
  disableSideBySide: boolean | undefined;
  setDisableSideBySide: React.Dispatch<
    React.SetStateAction<boolean | undefined>
  >;
  toggleDisableSideBySide: () => void;
  autoCollapseComments: boolean | undefined;
  setAutoCollapseComments: React.Dispatch<
    React.SetStateAction<boolean | undefined>
  >;
  toggleAutoCollapseComments: () => void;
  collapseChildrenOnly: boolean | undefined;
  setCollapseChildrenOnly: React.Dispatch<
    React.SetStateAction<boolean | undefined>
  >;
  toggleCollapseChildrenOnly: () => void;
  defaultCollapseChildren: boolean | undefined;
  setDefaultCollapseChildren: React.Dispatch<
    React.SetStateAction<boolean | undefined>
  >;
  toggleDefaultCollapseChildren: () => void;
  ribbonCollapseOnly: boolean | undefined;
  setRibbonCollapseOnly: React.Dispatch<
    React.SetStateAction<boolean | undefined>
  >;
  toggleRibbonCollapseOnly: () => void;
  showUserIcons: boolean | undefined;
  setShowUserIcons: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  toggleShowUserIcons: () => void;
  showAwardings: boolean | undefined;
  setShowAwardings: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  toggleShowAwardings: () => void;
  showFlairs: boolean | undefined;
  setShowFlairs: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  toggleShowFlairs: () => void;
  showUserFlairs: boolean | undefined;
  setShowUserFlairs: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  toggleShowUserFlairs: () => void;
  expandedSubPane: boolean | undefined;
  setExpandedSubPane: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  toggleExpandedSubPane: () => void;
  infiniteLoading: boolean | undefined;
  setInfiniteLoading: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  toggleInfiniteLoading: () => void;
  dimRead: boolean | undefined;
  setDimRead: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  toggleDimRead: () => void;
  autoRead: boolean | undefined;
  setAutoRead: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  toggleAutoRead: () => void;
  autoSeen: boolean | undefined;
  setAutoSeen: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  toggleAutoSeen: () => void;
  disableEmbeds: boolean | undefined;
  setDisableEmbeds: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  toggleDisableEmbeds: () => void;
  preferEmbeds: boolean | undefined;
  setPreferEmbeds: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  togglePreferEmbeds: () => void;
  embedsEverywhere: boolean | undefined;
  setEmbedsEverywhere: React.Dispatch<
    React.SetStateAction<boolean | undefined>
  >;
  toggleEmbedsEverywhere: () => void;
  expandImages: boolean | undefined;
  setExpandImages: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  toggleExpandImages: () => void;
  autoRefreshFeed: boolean | undefined;
  setAutoRefreshFeed: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  autoRefreshComments: boolean | undefined;
  setAutoRefreshComments: React.Dispatch<
    React.SetStateAction<boolean | undefined>
  >;
  askToUpdateFeed: boolean | undefined;
  setAskToUpdateFeed: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  refreshOnFocus: boolean | undefined;
  setRefreshOnFocus: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  fastRefreshInterval: number | undefined;
  setFastRefreshInterval: React.Dispatch<
    React.SetStateAction<number | undefined>
  >;
  slowRefreshInterval: number | undefined;
  setSlowRefreshInterval: React.Dispatch<
    React.SetStateAction<number | undefined>
  >;
  autoPlayInterval: number | undefined;
  setAutoPlayInterval: React.Dispatch<React.SetStateAction<number | undefined>>;
  waitForVidInterval: boolean | undefined;
  setWaitForVidInterval: React.Dispatch<
    React.SetStateAction<boolean | undefined>
  >;
  autoPlayMode: boolean | undefined;
  setAutoPlayMode: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  defaultSortComments: string | undefined;
  setDefaultSortComments: React.Dispatch<
    React.SetStateAction<string | undefined>
  >;

  // User and post management
  userPostType: PostType;
  setUserPostType: React.Dispatch<React.SetStateAction<PostType>>;
  toggleUserPostType: () => void;
  readPosts: Record<
    string,
    { postId: string; numComments: number; time: Date }
  >;
  setReadPosts: React.Dispatch<
    React.SetStateAction<
      Record<string, { postId: string; numComments: number; time: Date }>
    >
  >;
  readPostsChange: number;
  setReadPostsChange: React.Dispatch<React.SetStateAction<number>>;
  clearReadPosts: () => Promise<boolean>;
  bulkAddReadPosts: (posts: { postId: string; numComments: number }[]) => void;
  addReadPost: (params: { postId: string; numComments: number }) => void;
  toggleReadPost: (params: {
    postId: string;
    numComments: number;
  }) => Promise<void>;

  // Filters
  seenFilter: boolean | undefined;
  setSeenFilter: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  readFilter: boolean | undefined;
  setReadFilter: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  imgFilter: boolean | undefined;
  setImgFilter: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  vidFilter: boolean | undefined;
  setVidFilter: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  galFilter: boolean | undefined;
  setGalFilter: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  selfFilter: boolean | undefined;
  setSelfFilter: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  linkFilter: boolean | undefined;
  setLinkFilter: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  imgPortraitFilter: boolean | undefined;
  setImgPortraitFilter: React.Dispatch<
    React.SetStateAction<boolean | undefined>
  >;
  imgLandscapeFilter: boolean | undefined;
  setImgLandScapeFilter: React.Dispatch<
    React.SetStateAction<boolean | undefined>
  >;
  imgResFilter: boolean;
  setImgResFilter: React.Dispatch<React.SetStateAction<boolean>>;
  imgResXFilter: number;
  setImgResXFilter: React.Dispatch<React.SetStateAction<number>>;
  imgResYFilter: number;
  setImgResYFilter: React.Dispatch<React.SetStateAction<number>>;
  imgResExactFilter: boolean;
  setImgResExactFilter: React.Dispatch<React.SetStateAction<boolean>>;
  scoreFilter: boolean;
  setScoreFilter: React.Dispatch<React.SetStateAction<boolean>>;
  scoreFilterNum: number | undefined;
  setScoreFilterNum: React.Dispatch<React.SetStateAction<number | undefined>>;
  scoreGreater: boolean;
  setScoreGreater: React.Dispatch<React.SetStateAction<boolean>>;
  toggleFilter: (filter: FilterType) => void;
  updateFilters: number;
  setUpdateFilters: React.Dispatch<React.SetStateAction<number>>;
  applyFilters: () => void;
  filtersApplied: boolean;
  filtersAppliedCount: number;

  // UI state
  replyFocus: boolean;
  setReplyFocus: React.Dispatch<React.SetStateAction<boolean>>;
  toggleLoginModal: (forceOn?: boolean) => void;

  // Local subs management
  localSubs: RedditSubreddit[] | string[];
  localFavoriteSubs: RedditSubreddit[] | string[];
  subToSub: (action: string, sub: string) => Promise<boolean>;
  favoriteLocalSub: (makeFavorite: boolean, subname: string) => void;

  // Post interactions
  updateLikes: (id: string, likes: boolean | null) => void;
  updateSaves: (id: string, saved: boolean) => void;
  updateHidden: (id: string, hidden: boolean) => void;

  // User preferences sync error
  lastSyncError: unknown;
}

// UI Context Interface - extracted from MainContextValue
export interface UIContextValue {
  // UI Layout Settings
  wideUI: boolean | undefined;
  setWideUI: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  saveWideUI: boolean | undefined;
  setSaveWideUI: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  postWideUI: boolean | undefined;
  setPostWideUI: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  syncWideUI: boolean;
  setSyncWideUI: React.Dispatch<React.SetStateAction<boolean>>;
  toggleWideUI: () => void;
  toggleSyncWideUI: () => void;
  togglePostWideUI: () => void;

  // Card and Display Settings
  cardStyle: CardStyle;
  setCardStyle: React.Dispatch<React.SetStateAction<CardStyle>>;
  columnOverride: number | undefined;
  setColumnOverride: React.Dispatch<React.SetStateAction<number | undefined>>;
  uniformHeights: boolean | undefined;
  setUniformHeights: React.Dispatch<React.SetStateAction<boolean | undefined>>;

  // Navigation and Layout Preferences
  autoHideNav: boolean | undefined;
  setAutoHideNav: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  toggleAutoHideNav: () => void;
  expandedSubPane: boolean | undefined;
  setExpandedSubPane: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  toggleExpandedSubPane: () => void;

  // Content Display Options
  compactLinkPics: boolean | undefined;
  setCompactLinkPics: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  toggleCompactLinkPics: () => void;
  preferSideBySide: boolean | undefined;
  setPreferSideBySide: React.Dispatch<
    React.SetStateAction<boolean | undefined>
  >;
  togglePreferSideBySide: () => void;
  disableSideBySide: boolean | undefined;
  setDisableSideBySide: React.Dispatch<
    React.SetStateAction<boolean | undefined>
  >;
  toggleDisableSideBySide: () => void;
  dimRead: boolean | undefined;
  setDimRead: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  toggleDimRead: () => void;

  // Visual Element Toggles
  showAwardings: boolean | undefined;
  setShowAwardings: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  toggleShowAwardings: () => void;
  showFlairs: boolean | undefined;
  setShowFlairs: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  toggleShowFlairs: () => void;
  showUserIcons: boolean | undefined;
  setShowUserIcons: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  toggleShowUserIcons: () => void;
  showUserFlairs: boolean | undefined;
  setShowUserFlairs: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  toggleShowUserFlairs: () => void;
}

// Media Context Interface - extracted from MainContextValue
export interface MediaContextValue {
  // Audio/Video Settings
  volume: number | undefined;
  setVolume: React.Dispatch<React.SetStateAction<number | undefined>>;
  nsfw: boolean | undefined;
  setNSFW: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  toggleNSFW: () => void;
  autoplay: boolean | undefined;
  setAutoplay: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  toggleAutoplay: () => void;
  hoverplay: boolean | undefined;
  setHoverPlay: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  toggleHoverPlay: () => void;
  audioOnHover: boolean | undefined;
  setAudioOnHover: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  toggleAudioOnHover: () => void;

  // Media Quality and Preferences
  highRes: boolean;
  setHighRes: React.Dispatch<React.SetStateAction<boolean>>;
  disableEmbeds: boolean | undefined;
  setDisableEmbeds: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  toggleDisableEmbeds: () => void;
  preferEmbeds: boolean | undefined;
  setPreferEmbeds: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  togglePreferEmbeds: () => void;
  embedsEverywhere: boolean | undefined;
  setEmbedsEverywhere: React.Dispatch<
    React.SetStateAction<boolean | undefined>
  >;
  toggleEmbedsEverywhere: () => void;
  expandImages: boolean | undefined;
  setExpandImages: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  toggleExpandImages: () => void;

  // Auto-play Settings
  autoPlayInterval: number | undefined;
  setAutoPlayInterval: React.Dispatch<React.SetStateAction<number | undefined>>;
  waitForVidInterval: boolean | undefined;
  setWaitForVidInterval: React.Dispatch<
    React.SetStateAction<boolean | undefined>
  >;
  autoPlayMode: boolean | undefined;
  setAutoPlayMode: React.Dispatch<React.SetStateAction<boolean | undefined>>;
}

// Filter Context Interface - extracted from MainContextValue
export interface FilterContextValue {
  // Content Type Filters
  seenFilter: boolean | undefined;
  setSeenFilter: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  readFilter: boolean | undefined;
  setReadFilter: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  imgFilter: boolean | undefined;
  setImgFilter: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  vidFilter: boolean | undefined;
  setVidFilter: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  galFilter: boolean | undefined;
  setGalFilter: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  selfFilter: boolean | undefined;
  setSelfFilter: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  linkFilter: boolean | undefined;
  setLinkFilter: React.Dispatch<React.SetStateAction<boolean | undefined>>;

  // Image Orientation Filters
  imgPortraitFilter: boolean | undefined;
  setImgPortraitFilter: React.Dispatch<
    React.SetStateAction<boolean | undefined>
  >;
  imgLandscapeFilter: boolean | undefined;
  setImgLandScapeFilter: React.Dispatch<
    React.SetStateAction<boolean | undefined>
  >;

  // Image Resolution Filters
  imgResFilter: boolean;
  setImgResFilter: React.Dispatch<React.SetStateAction<boolean>>;
  imgResXFilter: number;
  setImgResXFilter: React.Dispatch<React.SetStateAction<number>>;
  imgResYFilter: number;
  setImgResYFilter: React.Dispatch<React.SetStateAction<number>>;
  imgResExactFilter: boolean;
  setImgResExactFilter: React.Dispatch<React.SetStateAction<boolean>>;

  // Score Filters
  scoreFilter: boolean;
  setScoreFilter: React.Dispatch<React.SetStateAction<boolean>>;
  scoreFilterNum: number | undefined;
  setScoreFilterNum: React.Dispatch<React.SetStateAction<number | undefined>>;
  scoreGreater: boolean;
  setScoreGreater: React.Dispatch<React.SetStateAction<boolean>>;

  // Filter Management
  toggleFilter: (filter: FilterType) => void;
  updateFilters: number;
  setUpdateFilters: React.Dispatch<React.SetStateAction<number>>;
  applyFilters: () => void;
  filtersApplied: number;
  filtersActive: boolean;
  filtersAppliedCount: number;
}

// App Context Interface - slimmed down MainContextValue
export interface AppContextValue {
  // Basic App State
  pauseAll: boolean;
  setPauseAll: React.Dispatch<React.SetStateAction<boolean>>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  ready: boolean;
  setReady: React.Dispatch<React.SetStateAction<boolean>>;
  postOpen: boolean;
  setPostOpen: React.Dispatch<React.SetStateAction<boolean>>;
  mediaMode: boolean;
  setMediaMode: React.Dispatch<React.SetStateAction<boolean>>;

  // Modals and UI State
  loginModal: boolean;
  setLoginModal: React.Dispatch<React.SetStateAction<boolean>>;
  premiumModal: boolean;
  setPremiumModal: React.Dispatch<React.SetStateAction<boolean>>;
  rateLimitModal: {
    show: boolean;
    timeout: number;
    start: Date;
  };
  setRateLimitModal: React.Dispatch<
    React.SetStateAction<{ show: boolean; timeout: number; start: Date }>
  >;
  replyFocus: boolean;
  setReplyFocus: React.Dispatch<React.SetStateAction<boolean>>;
  toggleLoginModal: (forceOn?: boolean) => void;

  // Core Data Management
  columns: number;
  setColumns: React.Dispatch<React.SetStateAction<number>>;
  posts: RedditPost[];
  setPosts: React.Dispatch<React.SetStateAction<RedditPost[]>>;
  postNum: number;
  setPostNum: React.Dispatch<React.SetStateAction<number>>;
  token: { expires?: number; accessToken?: string } | null;
  setToken: React.Dispatch<
    React.SetStateAction<{ expires?: number; accessToken?: string } | null>
  >;
  gAfter: string;
  setGAfter: React.Dispatch<React.SetStateAction<string>>;
  safeSearch: boolean;
  setSafeSearch: React.Dispatch<React.SetStateAction<boolean>>;
  progressKey: number;
  setProgressKey: React.Dispatch<React.SetStateAction<number>>;
  fastRefresh: number;
  setFastRefresh: React.Dispatch<React.SetStateAction<number>>;

  // User and Post Management
  userPostType: PostType;
  setUserPostType: React.Dispatch<React.SetStateAction<PostType>>;
  toggleUserPostType: () => void;
  readPosts: Record<
    string,
    { postId: string; numComments: number; time: Date }
  >;
  setReadPosts: React.Dispatch<
    React.SetStateAction<
      Record<string, { postId: string; numComments: number; time: Date }>
    >
  >;
  readPostsChange: number;
  setReadPostsChange: React.Dispatch<React.SetStateAction<number>>;
  clearReadPosts: () => Promise<boolean>;
  bulkAddReadPosts: (posts: { postId: string; numComments: number }[]) => void;
  addReadPost: (params: { postId: string; numComments: number }) => void;
  toggleReadPost: (params: {
    postId: string;
    numComments: number;
  }) => Promise<void>;

  // Local Subs Management
  localSubs: RedditSubreddit[] | string[];
  localFavoriteSubs: RedditSubreddit[] | string[];
  subToSub: (action: string, sub: string) => Promise<boolean>;
  favoriteLocalSub: (makeFavorite: boolean, subname: string) => void;

  // Post Interactions
  updateLikes: (id: string, likes: boolean | null) => void;
  updateSaves: (id: string, saved: boolean) => void;
  updateHidden: (id: string, hidden: boolean) => void;

  // App-Level Settings (not moved to other contexts)
  mediaOnly: boolean | undefined;
  setMediaOnly: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  toggleMediaOnly: () => void;
  autoCollapseComments: boolean | undefined;
  setAutoCollapseComments: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  toggleAutoCollapseComments: () => void;
  collapseChildrenOnly: boolean | undefined;
  setCollapseChildrenOnly: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  toggleCollapseChildrenOnly: () => void;
  defaultCollapseChildren: boolean | undefined;
  setDefaultCollapseChildren: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  toggleDefaultCollapseChildren: () => void;
  ribbonCollapseOnly: boolean | undefined;
  setRibbonCollapseOnly: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  toggleRibbonCollapseOnly: () => void;
  infiniteLoading: boolean | undefined;
  setInfiniteLoading: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  toggleInfiniteLoading: () => void;
  autoRead: boolean | undefined;
  setAutoRead: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  toggleAutoRead: () => void;
  autoSeen: boolean | undefined;
  setAutoSeen: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  toggleAutoSeen: () => void;
  autoRefreshFeed: boolean | undefined;
  setAutoRefreshFeed: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  autoRefreshComments: boolean | undefined;
  setAutoRefreshComments: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  askToUpdateFeed: boolean | undefined;
  setAskToUpdateFeed: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  refreshOnFocus: boolean | undefined;
  setRefreshOnFocus: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  fastRefreshInterval: number | undefined;
  setFastRefreshInterval: React.Dispatch<React.SetStateAction<number | undefined>>;
  slowRefreshInterval: number | undefined;
  setSlowRefreshInterval: React.Dispatch<React.SetStateAction<number | undefined>>;
  defaultSortComments: string | undefined;
  setDefaultSortComments: React.Dispatch<React.SetStateAction<string | undefined>>;

  // User Preferences Sync Error
  lastSyncError: unknown;
}

// Component Props Interfaces
export interface PostProps {
  post: RedditPost | RedditComment;
  forceMute?: boolean;
  fullPost?: boolean;
  imgFull?: boolean;
  postNum?: number;
  read?: boolean;
  hide?: boolean;
  curKey?: string | number;
  mode?: string;
  columns?: number;
  origCommentCount?: number;
  openPost?: (
    post: RedditPost,
    postNum: number,
    nav?: { toComments?: boolean; toMedia?: boolean },
    returnRoute?: string,
  ) => void;
  handleClick?: (e: React.MouseEvent, post: RedditPost) => void;
  uniformHeights?: boolean;
}

export interface CommentsProps {
  comments: RedditComment[];
  depth?: number;
  toggleCollapse?: (id: string) => void;
  openReply?: (id: string) => void;
  loading?: boolean;
  loadMore?: (id: string) => void;
  post?: RedditPost;
  containerRef?: React.RefObject<HTMLDivElement>;
  sort?: string;
  handleVote?: (id: string, vote: number) => void;
  userMode?: UserMode;
  thread?: Pick<UseThreadReturn, "isFetching" | "fetchNextPage">;
}

export interface MediaProps {
  post: PostData;
  forceMute?: boolean;
  imgFull?: boolean;
  postNum?: number;
  columns?: number;
  uniformHeights?: boolean;
  fill?: boolean;
  maxHeight?: number;
  containerDimensions?: [number, number];
  onLoad?: () => void;
  priority?: boolean;
  handleClick?: (
    e: React.MouseEvent,
    nav: { toMedia?: boolean; toComments?: boolean },
  ) => void;
}

export interface FavoriteButtonProps {
  sub: RedditSubreddit | string;
  favorited?: boolean;
  isUser?: boolean;
  forceShow?: boolean;
  onToggle?: (sub: RedditSubreddit | string, favorited: boolean) => void;
}

export interface ToggleFiltersProps {
  filter: FilterType;
  name?: string;
  tooltip?: string;
  disabled?: boolean;
}

// MySubs Context Interface
export interface SubsContextValue {
  subs: RedditSubreddit[];
  favoriteSubs: RedditSubreddit[];
  loading: boolean;
  error: string | null;
  subscribe: (
    action: string,
    sub: string,
    loggedIn?: boolean,
  ) => Promise<boolean | void>;
  unsubscribe: (sub: string) => Promise<void>;
  favorite: (
    makeFavorite: boolean,
    subname: string,
    isUser?: boolean,
    loggedIn?: boolean,
  ) => Promise<void>;
  unfavorite: (sub: RedditSubreddit | string) => void;
  loadSubs: () => Promise<void>;
  searchSubs: (query: string) => Promise<RedditSubreddit[]>;
}

// Premium Auth Context (re-export existing type)
export type { PremiumAuthContextType as PremiumAuthContextValue } from "../src/PremiumAuthContext";

// API Response Types for Feed and Thread data
export interface FeedPageData {
  posts: RedditPost[];
  after: string | null;
  before: string | null;
  dist?: number;
}

export interface ThreadPage {
  post?: RedditPost["data"];
  comments: RedditComment[];
  after?: string | null;
  before?: string | null;
}

// Hook Return Types
export interface UseFilterSubsReturn {
  filteredSubs: string[];
  filteredUsers: string[];
  addSubFilter: (sub: string, showToast?: boolean) => Promise<void>;
  removeSubFilter: (sub: string) => Promise<void>;
  addUserFilter: (user: string, showToast?: boolean) => Promise<void>;
  removeUserFilter: (user: string) => Promise<void>;
  clearAllFilters: () => Promise<void>;
}

export interface UseFeedReturn {
  data: import("@tanstack/react-query").InfiniteData<FeedPageData> | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: Error | null;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => Promise<unknown>;
  refetch: () => Promise<unknown>;
  invalidate: () => Promise<unknown>;
  posts: RedditPost[];
}

export interface UseThreadReturn {
  data: import("@tanstack/react-query").InfiniteData<ThreadPage> | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: Error | null;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => Promise<unknown>;
  refetch: () => Promise<unknown>;
  post: RedditPost["data"] | null;
  comments: RedditComment[];
  loadMore: (commentId: string) => void;
  updateVote: (id: string, vote: number) => void;
}
