import React from 'react';
import { Music, ListMusic } from 'lucide-react';
import { useRunContext } from '../../context/RunContext';
import { Track } from '../../types/spotify';

// Define component props
interface PlaylistProps {
  searchResults: Track[];
}

// Optional: Helper to get album image URL
const getAlbumImageUrl = (track: Track, sizeIndex: number = 1): string | undefined => {
  return track.album?.images?.[sizeIndex]?.url || track.album?.images?.[0]?.url;
};

const Playlist: React.FC<PlaylistProps> = ({ searchResults }) => {
  const { footfallsPerMinute } = useRunContext(); // Keep for title if needed

  if (!searchResults || searchResults.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 flex flex-col items-center justify-center">
        <ListMusic className="w-12 h-12 text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No Tracks Found</h3>
        <p className="text-gray-500 text-center">
          We couldn't find any tracks matching your {footfallsPerMinute} BPM criteria and selected genre.
          Try adjusting your pace or genre.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Optional Header */}
      {/* <div className="bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-4">
        <h2 className="text-white text-xl font-bold">Tracks Found ({searchResults.length})</h2>
      </div> */}

      <div className="divide-y divide-gray-100">
        {searchResults.map((track) => (
          <div
            key={track.id}
            className="flex items-center justify-between px-4 sm:px-6 py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center min-w-0 mr-4">
              {/* Album Art */}
              <img
                src={getAlbumImageUrl(track) || 'https://via.placeholder.com/40'} // Placeholder if no image
                alt={`${track.album?.name || track.name} album art`}
                className="w-10 h-10 rounded mr-4 flex-shrink-0"
              />
              {/* Track Info (Truncated) */}
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-800 truncate" title={track.name}>{track.name}</p>
                <p className="text-sm text-gray-500 truncate" title={track.artists.map(artist => artist.name).join(', ')}>
                  {track.artists.map(artist => artist.name).join(', ')}
                </p>
              </div>
            </div>

            {/* Optional: Action/Link */}
            {/* <div className="text-sm text-gray-500">
              {track.duration_ms ? formatTime(track.duration_ms / 1000) : ''}
            </div> */}
            <a
               href={track.external_urls?.spotify}
               target="_blank"
               rel="noopener noreferrer"
               className="text-sm text-cyan-600 hover:text-cyan-700 hover:underline ml-2 flex-shrink-0"
               title="View on Spotify"
            >
                View
            </a>
          </div>
        ))}
      </div>

      {/* Optional Footer */}
       <div className="bg-gray-50 px-6 py-4 text-sm text-gray-500">
         <div className="flex items-center">
           <Music size={16} className="text-purple-500 mr-2" />
           <span>{searchResults.length} tracks found near {footfallsPerMinute} BPM</span>
         </div>
       </div>
    </div>
  );
};

export default Playlist;