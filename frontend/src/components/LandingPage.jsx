import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckIcon } from '@heroicons/react/24/outline';

const Header = () => (
  <header className="fixed top-0 left-0 right-0 z-50 bg-cloud-white/80 backdrop-blur-sm">
    <div className="container mx-auto px-6 py-4 flex justify-between items-center">
      <Link to="/" className="text-2xl font-poppins font-bold text-midnight-ink">
        WeWear.
      </Link>
      <nav className="flex items-center space-x-6">
        <Link to="/login" className="text-midnight-ink hover:text-electric-indigo transition-colors">
          Login
        </Link>
        <Link
          to="/login" // Assuming sign up leads to a login/register page
          className="bg-sunrise-coral text-white px-5 py-2 rounded-full font-medium hover:bg-opacity-90 transition-all transform hover:scale-105"
        >
          Sign Up
        </Link>
      </nav>
    </div>
  </header>
);

const Hero = () => (
  <section className="pt-32 pb-20 text-center">
    <div className="container mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1 className="font-poppins font-bold text-5xl md:text-7xl leading-tight mb-4">
          Your Wardrobe, <span className="text-electric-indigo">Reimagined.</span>
        </h1>
        <p className="text-lg md:text-xl text-midnight-ink/80 max-w-3xl mx-auto mb-8">
          Stop guessing, start dressing. Rediscover the potential of your closet with AI-powered styling, organization, and personalized insights.
        </p>
        <Link
          to="/login"
          className="inline-block bg-sunrise-coral text-white px-8 py-4 rounded-full font-medium text-lg hover:bg-opacity-90 transition-all transform hover:scale-105 shadow-lg"
        >
          Get Started for Free
        </Link>
      </motion.div>
    </div>
  </section>
);

const features = [
  {
    name: 'Digital Wardrobe',
    description: 'Easily catalog your entire wardrobe. Snap a picture, and we’ll handle the rest.',
    icon: '📸',
  },
  {
    name: 'AI Outfit Generation',
    description: 'Get daily outfit suggestions based on your items, local weather, and personal style.',
    icon: '💡',
  },
  {
    name: 'Smart Packing Assistant',
    description: 'Tell us where you’re going, and we’ll create the perfect packing list from your wardrobe.',
    icon: '✈️',
  },
];

const Features = () => (
  <section className="py-20 bg-card dark:bg-dark-subtle">
    <div className="container mx-auto px-6">
      <div className="text-center mb-16">
        <h2 className="font-poppins font-bold text-4xl md:text-5xl">Why you'll love WeWear</h2>
        <p className="text-lg text-midnight-ink/80 mt-4 max-w-2xl mx-auto">
          From daily styling to trip packing, we bring intelligence to your wardrobe.
        </p>
      </div>
      <div className="grid md:grid-cols-3 gap-10">
        {features.map((feature, index) => (
          <motion.div
            key={feature.name}
            className="text-center p-8 border border-fog rounded-2xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-electric-indigo/10 mx-auto mb-6">
              <span className="text-3xl">{feature.icon}</span>
            </div>
            <h3 className="font-poppins font-bold text-2xl mb-3">{feature.name}</h3>
            <p className="text-midnight-ink/80">{feature.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

const pricing = {
  free: {
    name: 'Free',
    price: '$0',
    description: 'For getting started with a smart wardrobe.',
    features: [
      'Unlimited wardrobe size',
      '2 outfit generations per day',
      'Laundry Thresholds (Full Customization)',
      'Basic Laundry Insights',
      'Basic Wardrobe Analytics',
    ],
  },
  premium: {
    name: 'Premium',
    price: '$9.99',
    description: 'For the ultimate wardrobe intelligence and styling.',
    features: [
      'Unlimited wardrobe size',
      '4 outfit generations per hour',
      'Laundry Thresholds (Full Customization)',
      'Advanced Laundry Analytics',
      'Full "Style DNA" Wardrobe Analytics',
      'Packing Assistant (Full Feature)',
      'AI Image Recognition',
      'Early access to new features',
    ],
  },
};

const Pricing = () => (
  <section id="pricing" className="py-20">
    <div className="container mx-auto px-6">
      <div className="text-center mb-16">
        <h2 className="font-poppins font-bold text-4xl md:text-5xl">Find the perfect plan</h2>
        <p className="text-lg text-midnight-ink/80 mt-4 max-w-2xl mx-auto">
          Start for free and upgrade when you're ready for the full WeWear experience.
        </p>
      </div>
      <div className="flex flex-col lg:flex-row justify-center items-stretch gap-8">
        {/* Free Plan */}
        <motion.div
          className="w-full lg:w-1/3 border border-fog rounded-2xl p-8 flex flex-col"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h3 className="font-poppins font-bold text-2xl">{pricing.free.name}</h3>
          <p className="text-4xl font-poppins font-bold my-4">{pricing.free.price}<span className="text-lg font-medium text-midnight-ink/50">/month</span></p>
          <p className="text-midnight-ink/80 mb-6">{pricing.free.description}</p>
          <ul className="space-y-4 mb-8">
            {pricing.free.features.map((item) => (
              <li key={item} className="flex items-start">
                <CheckIcon className="h-6 w-6 text-electric-indigo mr-3 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="mt-auto">
            <Link to="/login" className="block w-full text-center bg-card dark:bg-dark-subtle border border-electric-indigo text-electric-indigo px-6 py-3 rounded-full font-medium hover:bg-electric-indigo/5 transition-colors">
              Get Started
            </Link>
          </div>
        </motion.div>
        {/* Premium Plan */}
        <motion.div
          className="w-full lg:w-1/3 border-2 border-electric-indigo rounded-2xl p-8 flex flex-col relative bg-card dark:bg-dark-subtle"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
              <span className="bg-electric-indigo text-white text-sm font-bold px-4 py-1 rounded-full">MOST POPULAR</span>
          </div>
          <h3 className="font-poppins font-bold text-2xl">{pricing.premium.name}</h3>
          <p className="text-4xl font-poppins font-bold my-4">{pricing.premium.price}<span className="text-lg font-medium text-midnight-ink/50">/month</span></p>
          <p className="text-midnight-ink/80 mb-6">{pricing.premium.description}</p>
          <ul className="space-y-4 mb-8">
            {pricing.premium.features.map((item) => (
              <li key={item} className="flex items-start">
                <CheckIcon className="h-6 w-6 text-electric-indigo mr-3 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="mt-auto">
            <Link to="/login" className="block w-full text-center bg-electric-indigo border border-electric-indigo text-white px-6 py-3 rounded-full font-medium hover:bg-opacity-90 transition-colors">
              Upgrade to Premium
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  </section>
);

const Footer = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-card dark:bg-dark-subtle border-t border-fog">
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left">
          <p className="text-midnight-ink/80 mb-4 md:mb-0">&copy; {currentYear} WeWear. All rights reserved.</p>
          <div className="flex space-x-6">
            <Link to="/terms-of-service" className="text-midnight-ink/80 hover:text-electric-indigo transition-colors">Terms of Service</Link>
            <Link to="/privacy-policy" className="text-midnight-ink/80 hover:text-electric-indigo transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

const LandingPage = () => {
  return (
    <div className="bg-cloud-white font-sans text-midnight-ink antialiased">
      <Header />
      <main>
        <Hero />
        <Features />
        <Pricing />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;