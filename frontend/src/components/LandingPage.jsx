import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { DashboardView } from '../frontend/src/assets/dashboard-view.webp'

const LandingPage = () => {
  const currentYear = new Date().getFullYear();

  // Scroll-based transformations for hero phone mockup
  const { scrollYProgress } = useScroll();
  const rotateX = useTransform(scrollYProgress, [0, 0.2], [15, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [0.9, 1]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="bg-white dark:bg-black text-gray-900 dark:text-white min-h-screen">
      {/* Header */}
      <header className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="text-2xl font-bold">WeWear</div>
          <div className="flex items-center space-x-4">
            <Link to="/login" className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-indigo-500 transition-colors">
              Login
            </Link>
            <Link to="/login" className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full transition-all transform hover:scale-105 font-medium shadow-lg hover:shadow-xl">
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="px-6 py-20 md:py-32">
        <div className="max-w-7xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h2 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
              Stop guessing.
              <br />
              <span className="text-indigo-500">Start dressing.</span>
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed">
              Rediscover the wardrobe you already own. Get intelligent, weather-aware outfit suggestions powered by AI.
            </p>
            <Link to="/login" className="inline-block px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-lg font-semibold transition-all transform hover:scale-105 shadow-lg hover:shadow-xl mb-16">
              Get Started for Free
            </Link>
          </motion.div>
          
          {/* Enhanced Hero Visual Element with 3D Scroll Effects */}
          <motion.div
            style={{
              rotateX: rotateX,
              scale: scale,
              perspective: '1000px'
            }}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.0, delay: 0.5, ease: "easeOut" }}
            className="mt-12"
          >
            <div className="relative mx-auto max-w-xl">
              {/* 
                This is where your beautiful screenshot goes.
                The `shadow-2xl` and `rounded-2xl` classes give it a nice, clean look.
              */}
              <img 
                src={DashboardView} // Using the image you imported at the top
                alt="A preview of the WeWear application dashboard"
                className="rounded-2xl shadow-2xl"
              />

              {/* We can still keep the cool floating elements! */}
              <motion.div
                className="absolute -top-10 -left-10 w-20 h-20 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <span className="text-2xl">☀️</span>
              </motion.div>
              
              <motion.div
                className="absolute -bottom-5 -right-10 w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center"
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <span className="text-xl">✨</span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Features Section */}
      <section className="px-6 py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-4xl md:text-5xl font-bold mb-4">Your wardrobe, reimagined.</h3>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Transform your daily routine with intelligent clothing recommendations that adapt to your lifestyle.
            </p>
          </div>
          
          <motion.div 
            className="grid md:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            <motion.div 
              className="text-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm"
              variants={itemVariants}
              transition={{ delay: 0.1 }}
            >
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900 text-indigo-500 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"/>
                </svg>
              </div>
              <h4 className="text-2xl font-bold mb-4">AI Outfit Generator</h4>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Smart algorithms analyze your wardrobe, weather, and schedule to suggest perfect outfit combinations every day.
              </p>
            </motion.div>

            <motion.div 
              className="text-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm"
              variants={itemVariants}
              transition={{ delay: 0.2 }}
            >
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 text-blue-500 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
                </svg>
              </div>
              <h4 className="text-2xl font-bold mb-4">Smart Laundry</h4>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Track wear frequency and automatically schedule laundry reminders to keep your favorite pieces always ready.
              </p>
            </motion.div>

            <motion.div 
              className="text-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm"
              variants={itemVariants}
              transition={{ delay: 0.3 }}
            >
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 text-purple-500 dark:text-purple-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
              </div>
              <h4 className="text-2xl font-bold mb-4">Wardrobe Analytics</h4>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Discover insights about your style preferences and identify gaps in your wardrobe with detailed analytics.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Visual Break Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            {/* Lifestyle Image Mockup */}
            <div className="bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:from-indigo-900 dark:via-purple-900 dark:to-pink-900 rounded-3xl overflow-hidden shadow-2xl">
              <div className="relative h-96 md:h-[500px] flex items-center justify-center">
                {/* Person silhouette with clothing items floating around */}
                <div className="relative">
                  {/* Central figure */}
                  <div className="w-32 h-48 bg-gray-300 dark:bg-gray-600 rounded-full relative mx-auto mb-8">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-6xl">👤</span>
                    </div>
                  </div>
                  
                  {/* Floating clothing items */}
                  <motion.div
                    className="absolute -top-10 -left-20 w-16 h-16 bg-white dark:bg-gray-800 rounded-2xl shadow-lg flex items-center justify-center"
                    animate={{ 
                      y: [0, -15, 0],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <span className="text-2xl">👔</span>
                  </motion.div>
                  
                  <motion.div
                    className="absolute -top-5 -right-16 w-14 h-14 bg-white dark:bg-gray-800 rounded-2xl shadow-lg flex items-center justify-center"
                    animate={{ 
                      y: [0, 10, 0],
                      rotate: [0, -3, 3, 0]
                    }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  >
                    <span className="text-xl">👕</span>
                  </motion.div>
                  
                  <motion.div
                    className="absolute -bottom-10 -left-12 w-12 h-12 bg-white dark:bg-gray-800 rounded-2xl shadow-lg flex items-center justify-center"
                    animate={{ 
                      y: [0, -8, 0],
                      rotate: [0, 8, -8, 0]
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  >
                    <span className="text-lg">👖</span>
                  </motion.div>
                  
                  <motion.div
                    className="absolute -bottom-5 -right-20 w-14 h-14 bg-white dark:bg-gray-800 rounded-2xl shadow-lg flex items-center justify-center"
                    animate={{ 
                      y: [0, 12, 0],
                      rotate: [0, -5, 5, 0]
                    }}
                    transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                  >
                    <span className="text-xl">👗</span>
                  </motion.div>
                  
                  <motion.div
                    className="absolute top-0 right-8 w-10 h-10 bg-white dark:bg-gray-800 rounded-2xl shadow-lg flex items-center justify-center"
                    animate={{ 
                      y: [0, -6, 0],
                      rotate: [0, 10, -10, 0]
                    }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                  >
                    <span className="text-sm">👠</span>
                  </motion.div>
                </div>
                
                {/* Floating elements */}
                <motion.div
                  className="absolute top-10 left-10 text-4xl"
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                >
                  ✨
                </motion.div>
                
                <motion.div
                  className="absolute bottom-20 right-20 text-3xl"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  🌟
                </motion.div>
              </div>
              
              {/* Bottom text overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-8">
                <p className="text-white text-xl font-semibold text-center">
                  "Finally, a morning routine that works for me!"
                </p>
                <p className="text-white/80 text-center mt-2">
                  - Sarah, WeWear user
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Enhanced How It Works Section with Sticky Animation */}
      <section className="px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-4xl md:text-5xl font-bold mb-4">Effortless style in three steps.</h3>
          </div>
          
          <div className="grid md:grid-cols-2 gap-16 items-start">
            {/* Left Column: The Steps */}
            <div className="space-y-16">
              <Step 
                number="1" 
                title="Catalog Your Closet" 
                description="Snap photos of your clothes to build your digital wardrobe in minutes."
                delay={0.1}
              />
              <Step 
                number="2" 
                title="Get AI Suggestions" 
                description="Receive personalized outfit recommendations based on weather, occasion, and your unique style preferences."
                delay={0.2}
              />
              <Step 
                number="3" 
                title="Plan Your Day" 
                description="Start each morning with confidence, knowing exactly what to wear for any occasion or weather condition."
                delay={0.3}
              />
            </div>

            {/* Right Column: The "Sticky" Visual */}
            <div className="sticky top-24 hidden md:block">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, x: 50 }}
                whileInView={{ opacity: 1, scale: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                {/* Reusing phone mockup with slight modifications */}
                <div className="bg-gray-900 rounded-[3rem] p-4 shadow-2xl mx-auto w-80">
                  <div className="bg-white dark:bg-gray-100 rounded-[2.5rem] p-6 h-[500px] relative overflow-hidden">
                    {/* Status Bar */}
                    <div className="flex justify-between items-center mb-6 text-sm text-gray-800">
                      <span className="font-semibold">9:41</span>
                      <div className="flex space-x-1">
                        <div className="w-4 h-2 bg-gray-300 rounded-full"></div>
                        <div className="w-6 h-2 bg-gray-300 rounded-full"></div>
                        <div className="w-6 h-2 bg-green-500 rounded-full"></div>
                      </div>
                    </div>
                    
                    {/* Dynamic Content Based on Step */}
                    <motion.div
                      key="step-visual"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <div className="text-center mb-8">
                        <h3 className="text-xl font-bold text-gray-800">WeWear Setup</h3>
                        <p className="text-gray-600 text-sm">Building your wardrobe</p>
                      </div>
                      
                      {/* Step visualization */}
                      <div className="space-y-4 mb-8">
                        <motion.div 
                          className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-4 border-2 border-indigo-200"
                          animate={{ scale: [1, 1.02, 1] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <div className="flex items-center justify-center space-x-2">
                            <div className="w-8 h-8 bg-indigo-200 rounded-lg flex items-center justify-center">
                              <span className="text-indigo-600 text-lg">📷</span>
                            </div>
                            <p className="font-medium text-gray-800">Photo Catalog</p>
                          </div>
                        </motion.div>
                        
                        <motion.div 
                          className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border-2 border-blue-200"
                          animate={{ scale: [1, 1.02, 1] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                        >
                          <div className="flex items-center justify-center space-x-2">
                            <div className="w-8 h-8 bg-blue-200 rounded-lg flex items-center justify-center">
                              <span className="text-blue-600 text-lg">🤖</span>
                            </div>
                            <p className="font-medium text-gray-800">AI Analysis</p>
                          </div>
                        </motion.div>
                        
                        <motion.div 
                          className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 border-2 border-purple-200"
                          animate={{ scale: [1, 1.02, 1] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                        >
                          <div className="flex items-center justify-center space-x-2">
                            <div className="w-8 h-8 bg-purple-200 rounded-lg flex items-center justify-center">
                              <span className="text-purple-600 text-lg">📅</span>
                            </div>
                            <p className="font-medium text-gray-800">Daily Planning</p>
                          </div>
                        </motion.div>
                      </div>
                      
                      {/* Progress indicator */}
                      <div className="flex justify-center space-x-2 mb-6">
                        <motion.div 
                          className="w-2 h-2 bg-indigo-400 rounded-full"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        />
                        <motion.div 
                          className="w-2 h-2 bg-gray-300 rounded-full"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                        />
                        <motion.div 
                          className="w-2 h-2 bg-gray-300 rounded-full"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                        />
                      </div>
                    </motion.div>
                    
                    {/* Action Button */}
                    <div className="absolute bottom-6 left-6 right-6">
                      <Link to="/login" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl py-3 font-semibold">
                        Continue Setup
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="px-6 py-20 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h3 className="text-4xl md:text-5xl font-bold mb-8">
              Ready to transform your mornings?
            </h3>
            <Link to="/login" className="inline-block px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-lg font-semibold transition-all transform hover:scale-105 shadow-lg hover:shadow-xl">
              Sign Up Now
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto text-center text-gray-600 dark:text-gray-400">
          © {currentYear} WeWear. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

// Enhanced Step Component with Scroll-based Highlighting
const Step = ({ number, title, description, delay }) => {
  return (
    <motion.div 
      className="relative"
      initial={{ opacity: 0, x: -30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.6, delay }}
    >
      <motion.div
        className="absolute -left-8 top-0 w-1 h-full bg-gradient-to-b from-indigo-200 via-indigo-400 to-indigo-200 rounded-full"
        initial={{ height: 0 }}
        whileInView={{ height: "100%" }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: delay + 0.2 }}
      />
      
      <motion.div
        whileHover={{ scale: 1.02, x: 10 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center mb-6 text-xl font-bold relative z-10 shadow-lg">
          {number}
        </div>
        <h4 className="text-2xl font-bold mb-4">{title}</h4>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{description}</p>
      </motion.div>
    </motion.div>
  );
};

export default LandingPage;