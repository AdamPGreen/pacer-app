import React from 'react';
import { Clock } from 'lucide-react';
import { useRunContext } from '../../context/RunContext';

const PaceInput: React.FC = () => {
  const { 
    paceMinutes, 
    setPaceMinutes, 
    paceSeconds, 
    setPaceSeconds, 
    paceUnit, 
    setPaceUnit,
    height,
    gender
  } = useRunContext();

  // Calculate pace presets based on height and gender
  const getPacePresets = () => {
    // Convert all paces to min/km for consistency
    const paces = {
      walk: { min: 12, sec: 0 },  // 5 km/h
      jog: { min: 8, sec: 0 },    // 7.5 km/h
      run: { min: 6, sec: 0 },    // 10 km/h
      race: { min: 4, sec: 30 }   // ~13.3 km/h
    };

    // If using miles, convert the paces
    if (paceUnit === 'min/mile') {
      Object.values(paces).forEach(pace => {
        const totalSeconds = (pace.min * 60 + pace.sec) * 1.60934; // Convert to mile pace
        pace.min = Math.floor(totalSeconds / 60);
        pace.sec = Math.round(totalSeconds % 60);
      });
    }

    return Object.entries(paces).map(([label, pace]) => ({
      label,
      min: pace.min,
      sec: pace.sec
    }));
  };

  const pacePresets = getPacePresets();

  const setPace = (min: number, sec: number) => {
    setPaceMinutes(min);
    setPaceSeconds(sec);
  };

  const totalSeconds = (paceMinutes * 60) + paceSeconds;
  const maxSeconds = 20 * 60; // 20 minutes maximum

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const totalSecs = Number(e.target.value);
    setPaceMinutes(Math.floor(totalSecs / 60));
    setPaceSeconds(totalSecs % 60);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 text-cyan-800">
        <Clock size={20} />
        <h2 className="text-xl font-semibold">Target Running Pace</h2>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => setPaceUnit('min/km')}
          className={`px-4 py-3 rounded-lg transition-all ${
            paceUnit === 'min/km'
              ? 'bg-cyan-500 text-white shadow-md'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Minutes per km
        </button>
        <button
          onClick={() => setPaceUnit('min/mile')}
          className={`px-4 py-3 rounded-lg transition-all ${
            paceUnit === 'min/mile'
              ? 'bg-cyan-500 text-white shadow-md'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Minutes per mile
        </button>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Adjust your pace
          </label>
          <span className="text-lg font-semibold text-cyan-600">
            {paceMinutes}:{paceSeconds.toString().padStart(2, '0')} /{paceUnit === 'min/km' ? 'km' : 'mile'}
          </span>
        </div>
        <input
          type="range"
          min="180"
          max={maxSeconds}
          value={totalSeconds}
          onChange={handleSliderChange}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-cyan-500"
        />
        <div className="flex justify-between text-sm text-gray-500 mt-1">
          <span>Fast</span>
          <span>Slow</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Common paces
        </label>
        <div className="grid grid-cols-4 gap-2">
          {pacePresets.map((preset) => (
            <button
              key={preset.label}
              onClick={() => setPace(preset.min, preset.sec)}
              className={`px-2 py-3 text-sm rounded-lg transition-all ${
                paceMinutes === preset.min && paceSeconds === preset.sec
                  ? 'bg-cyan-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <div className="font-medium capitalize">{preset.label}</div>
              <div className="text-xs">
                {preset.min}:{preset.sec.toString().padStart(2, '0')}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PaceInput;