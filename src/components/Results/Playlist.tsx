import React, { useState, useEffect } from 'react';
import { Play, Music, ExternalLink, Pause, Loader, AlertCircle } from 'lucide-react';
import { useRunContext } from '../../context/RunContext';
import { useSpotify } from '../../context/SpotifyContext';

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const Playlist: React.FC = () => {
  const { footfallsPerMinute, genre, totalRunTimeMinutes } = useRunContext();
  const { isAuthenticated, login, searchTracksByTempo, createPlaylist, error } = useSpotify();
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [tracks, setTracks] = useState<SpotifyApi.TrackObjectFull[]>([]);
  const [loading, setLoading] = useState(false);
  const [playlistUrl, setPlaylistUrl] = useState<string | null>(null);
  
  useEffect(() => {
    const loadTracks = async () => {
      if (!isAuthenticated) return;
      
      setLoading(true);
      try {
        const numTracks = Math.ceil(totalRunTimeMinutes / 3.5); // Assuming average song length
        const results = await searchTracksByTempo(genre, footfallsPerMinute, numTracks);
        setTracks(results);
      } catch (error) {
        console.error('Failed to load tracks:', error);
      }
      setLoading(false);
    };

    loadTracks();
  }, [isAuthenticated, genre, footfallsPerMinute, totalRunTimeMinutes]);

  const handleCreatePlaylist = async () => {
    if (!isAuthenticated) {
      login();
      return;
    }

    try {
      const playlistName = `Pacer Run - ${footfallsPerMinute} BPM ${genre}`;
      const trackUris = tracks.map(track => track.uri);
      const url = await createPlaylist(playlistName, trackUris);
      setPlaylistUrl(url);
    } catch (error) {
      console.error('Failed to create playlist:', error);
    }
  };
  
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-12 flex flex-col items-center justify-center">
        <Loader className="w-8 h-8 text-cyan-500 animate-spin mb-4" />
        <p className="text-gray-600">Loading your personalized playlist...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Connection Error</h3>
          <p className="text-gray-600 mb-6">
            {error}
          </p>
          <button
            onClick={login}
            className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <Music className="w-12 h-12 text-cyan-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Connect with Spotify</h3>
          <p className="text-gray-600 mb-6">
            Login to Spotify to create your personalized running playlist
          </p>
          <button
            onClick={login}
            className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors"
          >
            Connect Spotify Account
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-4 flex justify-between items-center">
        <h2 className="text-white text-xl font-bold">Your {footfallsPerMinute} BPM Playlist</h2>
        <button
          onClick={handleCreatePlaylist}
          className="bg-white text-purple-600 hover:bg-purple-50 transition-all text-sm px-4 py-2 rounded-full flex items-center font-medium"
        >
          {playlistUrl ? (
            <>
              <ExternalLink size={14} className="mr-1" />
              Open in Spotify
            </>
          ) : (
            'Save to Spotify'
          )}
        </button>
      </div>
      
      <div className="divide-y divide-gray-100">
        {tracks.map((track) => (
          <div 
            key={track.id} 
            className={`flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors ${
              playingId === track.id ? 'bg-purple-50' : ''
            }`}
          >
            <div className="flex items-center">
              <button 
                onClick={() => setPlayingId(playingId === track.id ? null : track.id)}
                className={`w-10 h-10 flex items-center justify-center rounded-full mr-4 ${
                  playingId === track.id 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {playingId === track.id ? <Pause size={18} /> : <Play size={18} />}
              </button>
              
              <div>
                <h3 className="font-medium text-gray-800">{track.name}</h3>
                <p className="text-sm text-gray-500">
                  {track.artists.map(artist => artist.name).join(', ')}
                </p>
              </div>
            </div>
            
            <div className="text-sm text-gray-500">
              {formatTime(track.duration_ms / 1000)}
            </div>
          </div>
        ))}
      </div>
      
      <div className="bg-gray-50 px-6 py-4 text-sm text-gray-500">
        <div className="flex items-center">
          <Music size={16} className="text-purple-500 mr-2" />
          <span>Total: {tracks.length} songs · Approx. {Math.ceil(totalRunTimeMinutes)} minutes</span>
        </div>
      </div>
    </div>
  );
};

export default Playlist;