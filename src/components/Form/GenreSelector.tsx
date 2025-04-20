import React, { useState } from 'react';
import { Music, ChevronRight, ArrowLeft } from 'lucide-react';
import { useRunContext } from '../../context/RunContext';

const genres = {
  'Pop': {
    emoji: '🎵',
    color: 'from-pink-500 to-rose-500',
    subgenres: [
      'All Pop',
      '2020s Pop',
      '2010s Pop',
      '2000s Pop',
      '90s Pop',
      '80s Pop',
      '70s Pop',
      'Dance Pop',
      'Electropop',
      'Pop Rock',
      'K-pop',
      'J-pop',
      'Latin Pop',
      'Euro Pop',
      'Indie Pop',
      'Art Pop',
      'Synth Pop',
      'Chamber Pop'
    ]
  },
  'Rock': {
    emoji: '🤘',
    color: 'from-red-500 to-orange-500',
    subgenres: [
      'All Rock',
      '2020s Rock',
      '2010s Rock',
      '2000s Rock',
      '90s Rock',
      '80s Rock',
      '70s Rock',
      '60s Rock',
      'Hard Rock',
      'Metal',
      'Heavy Metal',
      'Progressive Metal',
      'Nu Metal',
      'Grunge',
      'Punk Rock',
      'Post-Rock',
      'Indie Rock',
      'Alternative Rock',
      'Classic Rock',
      'Southern Rock'
    ]
  },
  'Hip-Hop': {
    emoji: '🎤',
    color: 'from-purple-500 to-indigo-500',
    subgenres: [
      'All Hip-Hop',
      '2020s Hip-Hop',
      '2010s Hip-Hop',
      '2000s Hip-Hop',
      '90s Hip-Hop',
      '80s Hip-Hop',
      'Old School',
      'Golden Age',
      'Boom Bap',
      'Trap',
      'Cloud Rap',
      'Drill',
      'East Coast',
      'West Coast',
      'Southern Hip-Hop',
      'UK Hip-Hop',
      'Jazz Rap',
      'Abstract',
      'Conscious',
      'Experimental'
    ]
  },
  'Electronic': {
    emoji: '🎧',
    color: 'from-cyan-500 to-blue-500',
    subgenres: [
      'All Electronic',
      'House',
      'Deep House',
      'Tech House',
      'Progressive House',
      'Electro House',
      'EDM',
      'Trance',
      'Dubstep',
      'Future Bass',
      'Detroit Techno',
      'Minimal',
      'Industrial',
      'Acid',
      'Downtempo',
      'Chillout',
      'Ambient',
      'IDM',
      'Drum & Bass',
      'Breakbeat'
    ]
  },
  'R&B': {
    emoji: '🎹',
    color: 'from-violet-500 to-purple-500',
    subgenres: [
      'All R&B',
      '2020s R&B',
      '2010s R&B',
      '2000s R&B',
      '90s R&B',
      '80s R&B',
      '70s R&B',
      '60s R&B',
      'Neo Soul',
      'Contemporary R&B',
      'Classic Soul',
      'Modern Soul',
      'Funk',
      'Gospel',
      'Alternative R&B',
      'Future Soul',
      'Trip Hop',
      'PBR&B'
    ]
  }
} as const;

type MainGenre = keyof typeof genres;
type SubGenre = string;

const GenreSelector: React.FC = () => {
  const { genre, setGenre } = useRunContext();
  const [selectedMain, setSelectedMain] = useState<MainGenre | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleMainGenreSelect = (mainGenre: MainGenre) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setSelectedMain(mainGenre);
      setIsTransitioning(false);
    }, 200);
  };

  const handleSubGenreSelect = (subGenre: SubGenre) => {
    setGenre(subGenre.toLowerCase().replace(/[& ]/g, '-') as any);
    setSelectedMain(null);
  };

  const handleBack = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setSelectedMain(null);
      setIsTransitioning(false);
    }, 200);
  };

  const getCurrentSelection = () => {
    if (!genre) return null;
    const normalizedGenre = genre.toLowerCase();
    for (const [mainGenre, data] of Object.entries(genres)) {
      for (const subgenre of data.subgenres) {
        if (subgenre.toLowerCase().replace(/[& ]/g, '-') === normalizedGenre) {
          return {
            main: mainGenre,
            subgenre
          };
        }
      }
    }
    return null;
  };

  const selection = getCurrentSelection();

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 text-cyan-800">
        <Music size={20} />
        <h2 className="text-xl font-semibold">Music Style</h2>
      </div>

      {selection && !selectedMain && (
        <div className="bg-white rounded-lg p-4 shadow-md border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Selected Genre</div>
              <div className="text-lg font-medium text-gray-900">{selection.subgenre}</div>
            </div>
            <button
              onClick={() => setSelectedMain(selection.main as MainGenre)}
              className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              Change Genre
            </button>
          </div>
        </div>
      )}

      <div className={`transition-all duration-200 ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
        {!selectedMain ? (
          !selection && (
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(genres).map(([mainGenre, data]) => (
                <button
                  key={mainGenre}
                  onClick={() => handleMainGenreSelect(mainGenre as MainGenre)}
                  className="relative overflow-hidden group rounded-lg transition-all duration-300 transform hover:scale-102 hover:shadow-lg"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${data.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                  <div className="relative flex items-center justify-between p-4 bg-white group-hover:bg-opacity-90 transition-colors">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3 transform group-hover:scale-110 transition-transform duration-300">
                        {data.emoji}
                      </span>
                      <span className="font-medium text-gray-800 group-hover:text-gray-900">
                        {mainGenre}
                      </span>
                    </div>
                    <ChevronRight 
                      className="text-gray-400 group-hover:text-gray-600 transform group-hover:translate-x-1 transition-all" 
                      size={20} 
                    />
                  </div>
                </button>
              ))}
            </div>
          )
        ) : (
          <div className="space-y-4">
            <button
              onClick={handleBack}
              className="flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft size={16} className="mr-1" />
              Back to main genres
            </button>
            <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-2">
              {genres[selectedMain].subgenres.map((subGenre) => (
                <button
                  key={subGenre}
                  onClick={() => handleSubGenreSelect(subGenre)}
                  className={`p-3 rounded-lg transition-all duration-300 hover:scale-102 
                    ${subGenre === selection?.subgenre
                      ? `bg-gradient-to-br ${genres[selectedMain].color} text-white shadow-md`
                      : 'bg-white hover:bg-gray-50 text-gray-800'
                    }`}
                >
                  <span className="font-medium">{subGenre}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="text-sm text-gray-500">
        Select a genre to find songs that match your running cadence.
      </div>
    </div>
  );
};

export default GenreSelector;