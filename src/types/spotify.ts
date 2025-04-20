// Type definitions for Spotify-related data structures

/**
 * Track interface represents a track object returned from Spotify API
 */
export interface Track {
  id: string;
  name: string;
  artists: { name: string }[];
  album: { images: { url: string }[] };
  uri: string;
  external_urls: { spotify: string };
  // Optional fields that might be present but not required
  // duration_ms?: number;
}

/**
 * Response from the Spotify API for a successful playlist creation
 */
export interface PlaylistResponse {
  playlistUrl: string;
} 