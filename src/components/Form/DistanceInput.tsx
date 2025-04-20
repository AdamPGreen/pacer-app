import React from 'react';
import { MapPin } from 'lucide-react';
import { useRunContext } from '../../context/RunContext';

const DistanceInput: React.FC = () => {
  const { distance, setDistance, paceUnit } = useRunContext();

  const handleDistanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDistance(Number(e.target.value));
  };

  const distanceUnit = paceUnit === 'min/km' ? 'kilometers' : 'miles';

  // Common race distances in km
  const raceDistances = [
    { label: '5K', value: 5 },
    { label: '10K', value: 10 },
    { label: '15K', value: 15 },
    { label: 'Half', value: 21.1 },
  ];

  if (paceUnit === 'min/mile') {
    raceDistances.forEach(d => {
      d.value = Number((d.value * 0.621371).toFixed(1));
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 text-cyan-800">
        <MapPin size={20} />
        <h2 className="text-xl font-semibold">Run Distance</h2>
      </div>
      
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <label htmlFor="distance" className="block text-sm font-medium text-gray-700">
            How far do you want to run?
          </label>
          <span className="text-lg font-semibold text-cyan-600">
            {distance} {paceUnit === 'min/km' ? 'km' : 'mi'}
          </span>
        </div>
        <input
          type="range"
          id="distance"
          min="1"
          max="50"
          step="0.1"
          value={distance}
          onChange={handleDistanceChange}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-cyan-500"
        />
        <div className="flex justify-between text-sm text-gray-500 mt-1">
          <span>1 {paceUnit === 'min/km' ? 'km' : 'mi'}</span>
          <span>Ultra</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {raceDistances.map((preset) => (
          <button
            key={preset.label}
            onClick={() => setDistance(preset.value)}
            className={`px-2 py-3 text-sm rounded-lg transition-all ${
              Math.abs(distance - preset.value) < 0.1
                ? 'bg-cyan-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <div className="font-medium">{preset.label}</div>
            <div className="text-xs">
              {preset.value} {paceUnit === 'min/km' ? 'km' : 'mi'}
            </div>
          </button>
        ))}
      </div>

      <div className="text-sm text-gray-500 mt-4">
        Popular race distances are provided as quick selections above.
      </div>
    </div>
  );
};

export default DistanceInput;