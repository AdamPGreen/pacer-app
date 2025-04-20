import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Music } from 'lucide-react';
import RunStats from '../components/Results/RunStats';
import Playlist from '../components/Results/Playlist';
import { useRunContext } from '../context/RunContext';

const Results: React.FC = () => {
  const navigate = useNavigate();
  const { footfallsPerMinute } = useRunContext();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-lg font-semibold px-4 py-2 rounded-full mb-4">
            <Music className="mr-2" size={20} />
            {footfallsPerMinute} BPM
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Your Personalized Running Playlist
          </h1>
          <p className="text-lg text-gray-600">
            We've crafted a playlist that matches your exact running cadence
          </p>
        </div>
        
        <div className="space-y-8 mb-8">
          <RunStats />
          <Playlist />
        </div>
        
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