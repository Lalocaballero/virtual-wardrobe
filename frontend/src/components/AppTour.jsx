import React from 'react';
import Joyride from 'react-joyride';

import { tourSteps } from '../tourSteps';

const AppTour = ({ run, stepIndex, handleJoyrideCallback }) => {
  return (
    <Joyride
      steps={tourSteps}
      run={run}
      stepIndex={stepIndex}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: '#4f46e5', // Indigo-600
          textColor: '#374151',  // Gray-700
        },
        tooltip: {
            borderRadius: '.5rem',
        },
        buttonNext: {
            backgroundColor: '#4f46e5',
        }
      }}
    />
  );
};

export default AppTour;
