import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowRight } from 'lucide-react';
import HeightInput from '../components/Form/HeightInput';
import PaceInput from '../components/Form/PaceInput';
import DistanceInput from '../components/Form/DistanceInput';
import GenreSelector from '../components/Form/GenreSelector';
import { useRunContext } from '../context/RunContext';

const steps = [
  { id: 'height', label: 'Height', component: HeightInput },
  { id: 'pace', label: 'Pace', component: PaceInput },
  { id: 'distance', label: 'Distance', component: DistanceInput },
  { id: 'genre', label: 'Music', component: GenreSelector },
];

const Home: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const { calculateStats } = useRunContext();
  const navigate = useNavigate();
  
  const CurrentStepComponent = steps[currentStep].component;
  
  const goToNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Last step completed, calculate and navigate to results
      calculateStats();
      navigate('/results');
    }
  };
  
  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Create Your Perfect Running Playlist
          </h1>
          <p className="text-lg text-gray-600">
            We'll match your running cadence to the perfect BPM songs
          </p>
        </div>
        
        {/* Step indicators */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                {/* Step dot */}
                <div 
                  className={`relative flex items-center justify-center w-10 h-10 rounded-full ${
                    index < currentStep 
                      ? 'bg-cyan-500 text-white' 
                      : index === currentStep 
                      ? 'bg-cyan-500 text-white ring-4 ring-cyan-100' 
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {index < currentStep ? (
                    <Check size={18} />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div 
                    className={`flex-1 h-1 mx-2 ${
                      index < currentStep ? 'bg-cyan-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
          
          {/* Step labels */}
          <div className="flex justify-between mt-2">
            {steps.map((step, index) => (
              <div 
                key={`label-${step.id}`} 
                className={`text-xs font-medium ${
                  index <= currentStep ? 'text-cyan-600' : 'text-gray-500'
                }`}
                style={{ width: '25%', textAlign: 'center' }}
              >
                {step.label}
              </div>
            ))}
          </div>
        </div>
        
        {/* Main form card */}
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 mb-8">
          <CurrentStepComponent />
        </div>
        
        {/* Navigation buttons */}
        <div className="flex justify-between">
          <button
            onClick={goToPreviousStep}
            disabled={currentStep === 0}
            className={`px-6 py-3 rounded-lg ${
              currentStep === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Back
          </button>
          
          <button
            onClick={goToNextStep}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all shadow-md flex items-center"
          >
            {currentStep < steps.length - 1 ? (
              <>
                Next
                <ArrowRight size={18} className="ml-2" />
              </>
            ) : (
              'Calculate Your Playlist'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;