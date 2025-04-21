import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { Session, SupabaseClient } from '@supabase/supabase-js';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { Track, PlaylistResponse } from '../types/spotify';

interface SpotifyContextType {
  session: Session | null;
  isLoadingSession: boolean;
  supabase: SupabaseClient;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  searchTracks: (genre: string, targetTempo: number, limit: number) => Promise<Track[]>;
  createPlaylist: (name: string, tracks: string[]) => Promise<PlaylistResponse>;
  error: string | null;
  clearError: () => void;
}

const SpotifyContext = createContext<SpotifyContextType | undefined>(undefined);

export const SpotifyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const session = useSession();
  const supabaseClient = useSupabaseClient();
  const [error, setError] = useState<string | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  // Handle initial session loading state
  useEffect(() => {
    // useSession() might initially be null then update.
    // Wait for the session to be definitively loaded (or stay null)
    if (session !== undefined) {
      setIsLoadingSession(false);
    }

    // Listen for auth state changes to clear errors on login/logout
    const { data: authListener } = supabaseClient.auth.onAuthStateChange(
      (event, session) => {
        setError(null); // Clear error on auth change
        if (event === 'INITIAL_SESSION') {
          setIsLoadingSession(false);
        } else if (event === 'SIGNED_IN') {
          // Handle post-sign-in actions if needed
          console.log('User signed in successfully');
        } else if (event === 'SIGNED_OUT') {
          // Handle post-sign-out actions if needed
          console.log('User signed out successfully');
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [session, supabaseClient.auth]);

  const clearError = () => setError(null);

  const login = async () => {
    setError(null);
    const { error: loginError } = await supabaseClient.auth.signInWithOAuth({
      provider: 'spotify',
      options: {
        scopes: 'playlist-modify-public user-read-private user-read-email',
        // Optional: Redirect back to a specific page after login
        // redirectTo: `${import.meta.env.VITE_APP_URL || window.location.origin}/`
      },
    });
    if (loginError) {
      console.error('Error logging in:', loginError);
      setError(`Login failed: ${loginError.message}`);
    }
  };

  const logout = async () => {
    setError(null);
    const { error: logoutError } = await supabaseClient.auth.signOut();
    if (logoutError) {
      console.error('Error logging out:', logoutError);
      setError(`Logout failed: ${logoutError.message}`);
    }
  };

  // Edge Function Callers
  const searchTracks = async (genre: string, targetTempo: number, limit: number): Promise<Track[]> => {
    setError(null);
    
    try {
      console.log('Searching Spotify with Genre:', genre, 'Tempo:', targetTempo);
      
      const { data, error: functionError } = await supabaseClient.functions.invoke('spotify-search', {
        body: {
          genre,
          targetTempo,
          limit
        },
      });
      
      if (functionError) {
        console.error('Error searching tracks:', functionError);
        setError(`Search failed: ${functionError.message}`);
        throw functionError;
      }
      return data.data || data;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Search failed: ${errorMessage}`);
      throw err;
    }
  };

  const createPlaylist = async (name: string, tracks: string[]): Promise<PlaylistResponse> => {
    setError(null);
    try {
      const { data, error: functionError } = await supabaseClient.functions.invoke('spotify-create-playlist', {
        body: { name, tracks },
      });
      if (functionError) {
        console.error('Error creating playlist:', functionError);
        setError(`Playlist creation failed: ${functionError.message}`);
        throw functionError;
      }
      if (!data || !data.playlistUrl) {
        throw new Error("Playlist URL not returned from function.");
      }
      return data as PlaylistResponse;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Playlist creation failed: ${errorMessage}`);
      throw err;
    }
  };

  return (
    <SpotifyContext.Provider value={{
      session,
      isLoadingSession,
      supabase: supabaseClient,
      login,
      logout,
      searchTracks,
      createPlaylist,
      error,
      clearError
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