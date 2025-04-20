import React from 'react';
import { Ruler } from 'lucide-react';
import { useRunContext } from '../../context/RunContext';

const HeightInput: React.FC = () => {
  const { 
    height, 
    setHeight, 
    measurementSystem, 
    setMeasurementSystem,
    gender,
    setGender
  } = useRunContext();

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setHeight(value);
  };

  const handleSystemChange = (system: 'metric' | 'imperial') => {
    if (system === measurementSystem) return;
    
    if (system === 'imperial') {
      setHeight(Math.round(height / 2.54));
    } else {
      setHeight(Math.round(height * 2.54));
    }
    
    setMeasurementSystem(system);
  };

  const getHeightDisplay = () => {
    if (measurementSystem === 'metric') {
      return `${height} cm`;
    } else {
      const feet = Math.floor(height / 12);
      const inches = height % 12;
      return `${feet}'${inches}"`;
    }
  };

  const minHeight = measurementSystem === 'metric' ? 140 : 55;
  const maxHeight = measurementSystem === 'metric' ? 220 : 87;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 text-cyan-800">
        <Ruler size={20} />
        <h2 className="text-xl font-semibold">Your Height</h2>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <button
          onClick={() => handleSystemChange('metric')}
          className={`px-4 py-3 rounded-lg transition-all ${
            measurementSystem === 'metric'
              ? 'bg-cyan-500 text-white shadow-md'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Centimeters
        </button>
        <button
          onClick={() => handleSystemChange('imperial')}
          className={`px-4 py-3 rounded-lg transition-all ${
            measurementSystem === 'imperial'
              ? 'bg-cyan-500 text-white shadow-md'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Feet & Inches
        </button>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <label htmlFor="height" className="block text-sm font-medium text-gray-700">
            Adjust your height
          </label>
          <span className="text-lg font-semibold text-cyan-600">
            {getHeightDisplay()}
          </span>
        </div>
        <input
          type="range"
          id="height"
          min={minHeight}
          max={maxHeight}
          step="1"
          value={height}
          onChange={handleHeightChange}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-cyan-500"
        />
        <div className="flex justify-between text-sm text-gray-500 mt-1">
          <span>{measurementSystem === 'metric' ? '140cm' : '4\'7"'}</span>
          <span>{measurementSystem === 'metric' ? '220cm' : '7\'3"'}</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Gender (for stride calculation)
        </label>
        <div className="grid grid-cols-3 gap-3">
          {(['male', 'female', 'other'] as const).map((option) => (
            <button
              key={option}
              onClick={() => setGender(option)}
              className={`px-4 py-3 rounded-lg capitalize transition-all ${
                gender === option
                  ? 'bg-cyan-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeightInput;