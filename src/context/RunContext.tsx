import React, { createContext, useContext, useState } from 'react';

type MeasurementSystem = 'metric' | 'imperial';
type PaceUnit = 'min/km' | 'min/mile';
type Gender = 'male' | 'female' | 'other';
type Genre = 'pop' | 'rock' | 'hip-hop' | 'electronic' | 'country' | 'classical' | 'jazz' | 'r&b';

interface RunContextProps {
  height: number;
  setHeight: (height: number) => void;
  measurementSystem: MeasurementSystem;
  setMeasurementSystem: (system: MeasurementSystem) => void;
  pace: number;
  setPace: (pace: number) => void;
  paceMinutes: number;
  setPaceMinutes: (minutes: number) => void;
  paceSeconds: number;
  setPaceSeconds: (seconds: number) => void;
  paceUnit: PaceUnit;
  setPaceUnit: (unit: PaceUnit) => void;
  distance: number;
  setDistance: (distance: number) => void;
  gender: Gender;
  setGender: (gender: Gender) => void;
  genre: Genre;
  setGenre: (genre: Genre) => void;
  footfallsPerMinute: number;
  totalRunTimeMinutes: number;
  strideLength: number;
  calculateStats: () => void;
}

const RunContext = createContext<RunContextProps | undefined>(undefined);

export const RunContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [height, setHeight] = useState<number>(170);
  const [measurementSystem, setMeasurementSystem] = useState<MeasurementSystem>('metric');
  const [paceMinutes, setPaceMinutes] = useState<number>(5);
  const [paceSeconds, setPaceSeconds] = useState<number>(0);
  const [pace, setPace] = useState<number>(5);
  const [paceUnit, setPaceUnit] = useState<PaceUnit>('min/km');
  const [distance, setDistance] = useState<number>(5);
  const [gender, setGender] = useState<Gender>('other');
  const [genre, setGenre] = useState<Genre>('pop');
  const [footfallsPerMinute, setFootfallsPerMinute] = useState<number>(0);
  const [totalRunTimeMinutes, setTotalRunTimeMinutes] = useState<number>(0);
  const [strideLength, setStrideLength] = useState<number>(0);

  const calculateStats = () => {
    // Convert height to cm if in imperial
    const heightInCm = measurementSystem === 'imperial' ? height * 2.54 : height;
    
    // Calculate stride length based on height (using gender-specific factors)
    const strideFactor = gender === 'male' ? 0.415 : 0.413;
    const calculatedStrideLength = heightInCm * strideFactor / 100; // in meters
    
    // Convert pace to minutes per kilometer if needed
    const paceInMinPerKm = paceUnit === 'min/mile' 
      ? (paceMinutes + paceSeconds / 60) * 0.621371 
      : (paceMinutes + paceSeconds / 60);
    
    // Calculate total run time in minutes
    const calculatedTotalRunTime = distance * paceInMinPerKm;
    
    // Calculate steps per minute (footfalls)
    // 1000 meters per km / stride length in meters = steps per km
    // steps per km / pace in min per km = steps per minute
    const stepsPerKm = 1000 / calculatedStrideLength;
    const calculatedFootfallsPerMinute = stepsPerKm / paceInMinPerKm;
    
    setStrideLength(calculatedStrideLength);
    setFootfallsPerMinute(Math.round(calculatedFootfallsPerMinute));
    setTotalRunTimeMinutes(calculatedTotalRunTime);
  };

  return (
    <RunContext.Provider
      value={{
        height,
        setHeight,
        measurementSystem,
        setMeasurementSystem,
        pace,
        setPace,
        paceMinutes,
        setPaceMinutes,
        paceSeconds,
        setPaceSeconds,
        paceUnit,
        setPaceUnit,
        distance,
        setDistance,
        gender,
        setGender,
        genre,
        setGenre,
        footfallsPerMinute,
        totalRunTimeMinutes,
        strideLength,
        calculateStats,
      }}
    >
      {children}
    </RunContext.Provider>
  );
};

export const useRunContext = () => {
  const context = useContext(RunContext);
  if (context === undefined) {
    throw new Error('useRunContext must be used within a RunContextProvider');
  }
  return context;
};