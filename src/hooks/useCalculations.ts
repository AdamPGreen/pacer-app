import { useState, useEffect } from 'react';

interface RunData {
  height: number;
  measurementSystem: 'metric' | 'imperial';
  gender: 'male' | 'female' | 'other';
  paceMinutes: number;
  paceSeconds: number;
  paceUnit: 'min/km' | 'min/mile';
  distance: number;
}

interface CalculatedStats {
  strideLength: number;
  footfallsPerMinute: number;
  totalRunTimeMinutes: number;
}

export const useCalculations = (runData: RunData): CalculatedStats => {
  const [stats, setStats] = useState<CalculatedStats>({
    strideLength: 0,
    footfallsPerMinute: 0,
    totalRunTimeMinutes: 0,
  });

  useEffect(() => {
    // Convert height to cm if in imperial
    const heightInCm = runData.measurementSystem === 'imperial' 
      ? runData.height * 2.54 
      : runData.height;
    
    // Calculate stride length based on height (using gender-specific factors)
    const strideFactor = runData.gender === 'male' ? 0.415 : 0.413;
    const calculatedStrideLength = heightInCm * strideFactor / 100; // in meters
    
    // Convert pace to minutes per kilometer if needed
    const paceInMinutes = runData.paceMinutes + (runData.paceSeconds / 60);
    const paceInMinPerKm = runData.paceUnit === 'min/mile' 
      ? paceInMinutes * 0.621371 
      : paceInMinutes;
    
    // Calculate total run time in minutes
    const calculatedTotalRunTime = runData.distance * paceInMinPerKm;
    
    // Calculate steps per minute (footfalls)
    // 1000 meters per km / stride length in meters = steps per km
    // steps per km / pace in min per km = steps per minute
    const stepsPerKm = 1000 / calculatedStrideLength;
    const calculatedFootfallsPerMinute = stepsPerKm / paceInMinPerKm;
    
    setStats({
      strideLength: calculatedStrideLength,
      footfallsPerMinute: Math.round(calculatedFootfallsPerMinute),
      totalRunTimeMinutes: calculatedTotalRunTime,
    });
  }, [
    runData.height, 
    runData.measurementSystem,
    runData.gender,
    runData.paceMinutes,
    runData.paceSeconds,
    runData.paceUnit,
    runData.distance,
  ]);

  return stats;
};