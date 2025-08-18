import React from 'react';
import Joyride, { STATUS } from 'react-joyride';

const AppTour = ({ run, onTourEnd, setActiveTab }) => {
  const steps = [
    {
        target: '.outfit-generator',
        content: 'Ready for some style inspiration? Use the Outfit Generator to get AI-powered suggestions.',
        placement: 'bottom',
        title: 'Get Outfit Ideas',
        tab: 'outfit',
    },
    {
      target: '.wardrobe-manager',
      content: 'This is your Wardrobe Manager. Here you can see all your clothing items and add new ones!',
      placement: 'bottom',
      title: 'Your Digital Wardrobe',
      tab: 'wardrobe',
    },
    {
      target: '.add-item-button',
      content: 'Click here to add a new piece of clothing to your digital wardrobe.',
      placement: 'bottom',
      title: 'Add New Items',
      tab: 'wardrobe',
    },
    {
        target: '.laundry-dashboard-link',
        content: 'The Laundry Dashboard helps you keep track of what needs washing. Never run out of clean socks again!',
        placement: 'bottom',
        title: 'Laundry Day, Simplified',
        tab: 'laundry',
    },
    {
      target: '.packing-assistant-link',
      content: 'Going on a trip? The Packing Assistant will help you pack the right clothes for your destination.',
      placement: 'bottom',
      title: 'Smart Packing',
      tab: 'packing',
    },
    {
        target: '.notification-bell',
        content: "We'll send you helpful notifications here, like laundry reminders or wardrobe suggestions.",
        placement: 'bottom',
        title: 'Stay Notified'
    },
  ];

  const handleJoyrideCallback = (data) => {
    const { status, step, type, index } = data;

    if (type === 'step:before') {
      // If the next step has a tab, switch to it
      if (step.tab) {
        setActiveTab(step.tab);
      }
    }
    
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      onTourEnd();
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
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
