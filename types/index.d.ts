/**
 * Align declaration file with source types to avoid type mismatches
 * These interfaces mirror the corresponding definitions in `types/index.ts`
 */

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
