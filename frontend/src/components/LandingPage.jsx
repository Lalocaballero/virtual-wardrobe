import React from 'react';
import { SparklesIcon, DocumentMagnifyingGlassIcon, SunIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom'; // We'll need this from react-router-dom
import { motion } from 'framer-motion'; // Import motion for animations

const LandingPage = () => {
  return (
    <div className="bg-white dark:bg-black text-gray-800 dark:text-gray-200">
      {/* 1. Simple Header */}
      <header className="px-8 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">WeWear</h1>
        <div>
          <Link to="/login" className="btn btn-secondary mr-2">Login</Link>
          <Link to="/login" className="btn btn-primary">Sign Up</Link>
        </div>
      </header>

      {/* 2. Hero Section */}
      <main className="text-center px-4 py-20 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h2 className="text-5xl md:text-7xl font-bold mb-4">
            Stop guessing.
            <br />
            <span className="text-indigo-500">Start dressing.</span>
          </h2>
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-8">
            Rediscover the wardrobe you already own. Get intelligent, weather-aware outfit suggestions powered by AI.
          </p>
          <Link to="/login" className="btn btn-primary text-lg px-8 py-3">
            Get Started for Free
          </Link>
        </motion.div>
      </main>

      {/* 3. Features Section */}
      <section className="px-4 py-20 md:py-32 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h3 className="text-4xl md:text-5xl font-bold">Your wardrobe, reimagined.</h3>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
              WeWear turns your closet into a smart, personal stylist.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-12">
            {/* Feature 1: AI Outfits */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900 text-indigo-500 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <SparklesIcon className="w-8 h-8" />
              </div>
              <h4 className="text-2xl font-bold mb-2">AI Outfit Generator</h4>
              <p className="text-gray-600 dark:text-gray-400">
                Get weather-aware, mood-based outfit suggestions from the clothes you already own. Never wonder what to wear again.
              </p>
            </motion.div>

            {/* Feature 2: Smart Laundry */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 text-blue-500 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <SunIcon className="w-8 h-8" /> 
              </div>
              <h4 className="text-2xl font-bold mb-2">Smart Laundry</h4>
              <p className="text-gray-600 dark:text-gray-400">
                Track wears, get intelligent wash alerts, and see the "health" of your wardrobe at a glance.
              </p>
            </motion.div>

            {/* Feature 3: Wardrobe Analytics */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 text-purple-500 dark:text-purple-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <DocumentMagnifyingGlassIcon className="w-8 h-8" />
              </div>
              <h4 className="text-2xl font-bold mb-2">Wardrobe Analytics</h4>
              <p className="text-gray-600 dark:text-gray-400">
                Discover your personal style, see your most-worn items, and identify gaps in your closet.
              </p>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* 4. Footer */}
      <footer className="text-center py-8 border-t dark:border-gray-800">
        <p>© {new Date().getFullYear()} WeWear. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;