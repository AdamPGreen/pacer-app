import React from 'react';
import { 
  Clock, Ruler, Activity, Music, 
  Footprints, Timer, Route, User 
} from 'lucide-react';
import { useRunContext } from '../../context/RunContext';

const RunStats: React.FC = () => {
  const { 
    height, 
    measurementSystem, 
    paceMinutes,
    paceSeconds,
    paceUnit, 
    distance, 
    gender,
    footfallsPerMinute,
    totalRunTimeMinutes,
    strideLength
  } = useRunContext();

  // Format total run time into hours and minutes
  const formatRunTime = () => {
    const hours = Math.floor(totalRunTimeMinutes / 60);
    const minutes = Math.floor(totalRunTimeMinutes % 60);
    return `${hours > 0 ? hours + 'h ' : ''}${minutes}m`;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-4">
        <h2 className="text-white text-xl font-bold">Your Run Stats</h2>
      </div>
      
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Input summary */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-700 flex items-center">
              <User className="mr-2 text-cyan-600" size={18} />
              Your Details
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center">
                <Ruler className="mr-2 text-gray-400" size={16} />
                <span className="text-gray-600">Height:</span>
              </div>
              <div className="font-medium">
                {height} {measurementSystem === 'metric' ? 'cm' : 'inches'}
              </div>
              
              <div className="flex items-center">
                <Clock className="mr-2 text-gray-400" size={16} />
                <span className="text-gray-600">Target Pace:</span>
              </div>
              <div className="font-medium">
                {paceMinutes}:{paceSeconds.toString().padStart(2, '0')} {paceUnit}
              </div>
              
              <div className="flex items-center">
                <Route className="mr-2 text-gray-400" size={16} />
                <span className="text-gray-600">Distance:</span>
              </div>
              <div className="font-medium">
                {distance} {paceUnit === 'min/km' ? 'km' : 'miles'}
              </div>
            </div>
          </div>
          
          {/* Calculated results */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-700 flex items-center">
              <Activity className="mr-2 text-cyan-600" size={18} />
              Calculated Results
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center">
                <Footprints className="mr-2 text-gray-400" size={16} />
                <span className="text-gray-600">Stride Length:</span>
              </div>
              <div className="font-medium">
                {strideLength.toFixed(2)} meters
              </div>
              
              <div className="flex items-center">
                <Activity className="mr-2 text-gray-400" size={16} />
                <span className="text-gray-600">Footfalls/min:</span>
              </div>
              <div className="font-medium text-cyan-600 font-bold">
                {footfallsPerMinute} BPM
              </div>
              
              <div className="flex items-center">
                <Timer className="mr-2 text-gray-400" size={16} />
                <span className="text-gray-600">Total Run Time:</span>
              </div>
              <div className="font-medium">
                {formatRunTime()}
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-cyan-50 rounded-lg border border-cyan-100">
          <div className="flex items-start">
            <Music className="text-cyan-600 mt-1 mr-3" size={20} />
            <div>
              <h4 className="font-semibold text-cyan-800">Your Personalized Playlist</h4>
              <p className="text-sm text-cyan-700">
                We've created a playlist with songs at {footfallsPerMinute} BPM to perfectly match your running cadence 
                and will last for your entire {formatRunTime()} run.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RunStats;