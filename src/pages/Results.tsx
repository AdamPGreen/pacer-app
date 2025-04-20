import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Music, Loader2, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import RunStats from '../components/Results/RunStats';
import Playlist from '../components/Results/Playlist';
import { useRunContext } from '../context/RunContext';
import { useSpotify } from '../context/SpotifyContext';
import { SPOTIFY } from '../constants';

const Results: React.FC = () => {
  const navigate = useNavigate();
  const {
    footfallsPerMinute,
    genre,
    searchResults,
    isLoadingSearch,
    searchError,
  } = useRunContext();
  const { createPlaylist } = useSpotify();

  // State for playlist creation
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [playlistUrl, setPlaylistUrl] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  const handleCreatePlaylist = async () => {
    if (!searchResults || searchResults.length === 0) return;

    setIsCreatingPlaylist(true);
    setPlaylistUrl(null);
    setCreateError(null);

    const trackUris = searchResults.map(track => track.uri);
    const playlistName = SPOTIFY.PLAYLIST_NAME_FORMAT(genre, footfallsPerMinute);

    try {
      const { playlistUrl: newPlaylistUrl } = await createPlaylist(playlistName, trackUris);
      setPlaylistUrl(newPlaylistUrl);
    } catch (error: unknown) {
      console.error("Error creating playlist:", error);
      setCreateError(
        error instanceof Error 
          ? error.message 
          : 'Failed to create playlist. Please try again.'
      );
    } finally {
      setIsCreatingPlaylist(false);
    }
  };

  // Loading state for initial search
  if (isLoadingSearch) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-12 w-12 animate-spin text-cyan-500" />
      </div>
    );
  }

  // Error state from initial search
  if (searchError) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
         <AlertCircle className="w-10 h-10 mx-auto text-red-500 mb-4" />
         <h2 className="text-xl font-semibold text-red-700 mb-2">Search Failed</h2>
         <p className="text-gray-600 mb-6">{searchError}</p>
         <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center mx-auto"
          >
            <ArrowLeft size={18} className="mr-2" />
            Try Again
          </button>
      </div>
    );
  }

  // Main results display
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-lg font-semibold px-4 py-2 rounded-full mb-4">
            <Music className="mr-2" size={20} />
            {footfallsPerMinute} BPM {genre && `(${genre})`}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Your Personalized Running Playlist
          </h1>
          <p className="text-lg text-gray-600">
            We've crafted a playlist matching your cadence.
          </p>
        </div>

        <div className="space-y-8 mb-8">
          <RunStats />
          <Playlist searchResults={searchResults} />
        </div>

        {/* Playlist Creation Section */}
        {searchResults && searchResults.length > 0 && (
          <div className="text-center mb-8">
            {/* Success Message */}
            {playlistUrl && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg relative mb-6 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                <span>Playlist created successfully!</span>
                <a
                  href={playlistUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 font-semibold underline hover:text-green-800 flex items-center"
                >
                  View on Spotify
                  <ExternalLink size={14} className="ml-1" />
                </a>
              </div>
            )}

            {/* Error Message */}
            {createError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-6 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                <span>{createError}</span>
              </div>
            )}

            {/* Create Button - Hide if already created successfully */} 
            {!playlistUrl && (
               <button
                onClick={handleCreatePlaylist}
                disabled={isCreatingPlaylist}
                className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-md flex items-center justify-center mx-auto disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isCreatingPlaylist ? (
                  <>
                    <Loader2 size={18} className="animate-spin mr-2" />
                    Creating Playlist...
                  </>
                ) : (
                  'Save Playlist to Spotify'
                )}
              </button>
            )}
          </div>
        )}

        <div className="flex justify-center">
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center"
          >
            <ArrowLeft size={18} className="mr-2" />
            Start Over
          </button>
        </div>
      </div>
    </div>
  );
};

export default Results;