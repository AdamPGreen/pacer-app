// Application constants

/**
 * Spotify configuration
 */
export const SPOTIFY = {
  /** Maximum number of tracks to return in search results */
  SEARCH_LIMIT: 50,
  
  /** Format for playlist names when creating a new playlist */
  PLAYLIST_NAME_FORMAT: (genre: string, bpm: number) => `Pacer Playlist - ${genre || 'Mix'} @ ${bpm} BPM`
}; 