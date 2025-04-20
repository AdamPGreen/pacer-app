import React, { createContext, useContext, useState, useEffect } from 'react';
import SpotifyWebApi from 'spotify-web-api-js';

const SPOTIFY_CLIENT_ID = '3502638438f74f65872deb46ec872c68';
const REDIRECT_URI = 'http://localhost:5173';

interface SpotifyContextType {
  spotifyApi: SpotifyWebApi.SpotifyWebApiJs;
  isAuthenticated: boolean;
  login: () => void;
  error: string | null;
  createPlaylist: (name: string, tracks: string[]) => Promise<string>;
  searchTracksByTempo: (genre: string, targetTempo: number, limit: number) => Promise<SpotifyApi.TrackObjectFull[]>;
}

const SpotifyContext = createContext<SpotifyContextType | undefined>(undefined);

export const SpotifyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [spotifyApi] = useState<SpotifyWebApi.SpotifyWebApiJs>(() => new SpotifyWebApi());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = params.get('access_token');
    const errorParam = params.get('error');

    if (errorParam) {
      setError(errorParam);
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (accessToken) {
      spotifyApi.setAccessToken(accessToken);
      setIsAuthenticated(true);
      setError(null);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [spotifyApi]);

  const login = () => {
    const scope = 'playlist-modify-public user-read-private user-read-email';
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(scope)}&show_dialog=true`;
    window.location.href = authUrl;
  };

  const createPlaylist = async (name: string, tracks: string[]) => {
    try {
      const user = await spotifyApi.getMe();
      const playlist = await spotifyApi.createPlaylist(user.id, {
        name,
        description: 'Created by Pacer - Your perfect running playlist',
        public: true
      });
      await spotifyApi.addTracksToPlaylist(playlist.id, tracks);
      return playlist.external_urls.spotify;
    } catch (err) {
      setError('Failed to create playlist. Please try logging in again.');
      setIsAuthenticated(false);
      throw err;
    }
  };

  const searchTracksByTempo = async (genre: string, targetTempo: number, limit: number) => {
    try {
      const tolerance = 2; // BPM tolerance range
      const results: SpotifyApi.TrackObjectFull[] = [];
      let offset = 0;

      while (results.length < limit) {
        const response = await spotifyApi.searchTracks(`genre:${genre}`, {
          limit: 50,
          offset
        });

        const trackIds = response.tracks.items.map(track => track.id);
        const audioFeatures = await spotifyApi.getAudioFeaturesForTracks(trackIds);

        const matchingTracks = response.tracks.items.filter((track, index) => {
          const tempo = audioFeatures.audio_features[index]?.tempo;
          return tempo && Math.abs(tempo - targetTempo) <= tolerance;
        });

        results.push(...matchingTracks);
        
        if (response.tracks.items.length < 50 || offset > 950) {
          break;
        }
        
        offset += 50;
      }

      return results.slice(0, limit);
    } catch (err) {
      setError('Failed to search tracks. Please try logging in again.');
      setIsAuthenticated(false);
      throw err;
    }
  };

  return (
    <SpotifyContext.Provider value={{
      spotifyApi,
      isAuthenticated,
      login,
      error,
      createPlaylist,
      searchTracksByTempo
    }}>
      {children}
    </SpotifyContext.Provider>
  );
};

export const useSpotify = () => {
  const context = useContext(SpotifyContext);
  if (context === undefined) {
    throw new Error('useSpotify must be used within a SpotifyProvider');
  }
  return context;
};