import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useNavigate } from 'react-router-dom';
import useWardrobeStore from '../store/wardrobeStore';
import { SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline';

const MODAL_CONTENT = {
  wardrobe: {
    headline: "Your wardrobe is overflowing with style!",
    body: "You’ve reached the 50-item limit for your free plan. To digitize your entire closet, upgrade to Premium.",
    cta: "Upgrade for Unlimited Space",
  },
  generation: {
    headline: "You're on a creative roll!",
    body: "You've used your 2 free AI outfit generations for today. Upgrade to Premium for unlimited inspiration.",
    cta: "Upgrade for Unlimited Ideas",
  },
  laundry: {
    headline: "Leave Laundry Day to the Robots!",
    body: "Upgrade to Premium to unlock Smart Laundry Loads. Our AI will group your dirty clothes into perfect loads to save you time and energy.",
    cta: "Upgrade for Smart Loads",
  },
  style_dna: {
    headline: "Unlock Your Personal Style DNA",
    body: "Get a deep dive into your wardrobe with advanced analytics on your dominant styles, color palettes, and brand loyalty. Discover what makes you, you!",
    cta: "Unlock Style DNA",
  },
  smart_collections: {
    headline: "Unlock All Smart Collections",
    body: "Upgrade to Premium to unlock our most powerful collections, including 'Date Night & Special', 'Work & Professional', and 'Ready for Rotation', to get the perfect outfit for any occasion.",
    cta: "Unlock All Collections",
  },
  packing_assistant: {
    headline: "Unlock Your Smart Suitcase",
    body: "Our AI-powered Packing Assistant creates perfect packing lists based on your trip details and wardrobe. Upgrade to pack smarter, not harder.",
    cta: "Upgrade Now",
    externalLink: "https://wewear.lemonsqueezy.com/checkout",
  },
};

const UpgradeModal = () => {
  const { upgradeModal, hideUpgradeModal } = useWardrobeStore();
  const navigate = useNavigate();

  const content = MODAL_CONTENT[upgradeModal.type] || {};

  const handleUpgrade = () => {
    hideUpgradeModal();
    if (content.externalLink) {
      window.location.href = content.externalLink;
    } else {
      navigate('/billing');
    }
  };

  return (
    <Transition.Root show={upgradeModal.isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={hideUpgradeModal}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute top-0 right-0 hidden pt-4 pr-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={hideUpgradeModal}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-coral-100 sm:mx-0 sm:h-10 sm:w-10">
                    <SparklesIcon className="h-6 w-6 text-coral-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 font-poppins">
                      {content.headline}
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 font-inter">
                        {content.body}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md border border-transparent bg-coral-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-coral-700 focus:outline-none focus:ring-2 focus:ring-coral-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={handleUpgrade}
                  >
                    {content.cta}
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                    onClick={hideUpgradeModal}
                  >
                    Maybe Later
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default UpgradeModal;
