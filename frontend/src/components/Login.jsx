import React, { useState } from 'react';
import useWardrobeStore from '../store/wardrobeStore';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    location: ''
  });
  
  const { login, register, loading, error } = useWardrobeStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLogin) {
      await login(formData.email, formData.password);
    } else {
      await register(formData.email, formData.password, formData.location);
    }
  };

  return (
    // The main background color is now inherited from the body tag in index.css
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold">
            {isLogin ? 'Sign in to your account' : 'Create your account'}
          </h2>
          <p className="mt-2 text-center text-sm">
            Virtual Intelligent Wardrobe
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full" // All styling comes from index.css
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full" // All styling comes from index.css
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>

            {!isLogin && (
              <div>
                <label htmlFor="location" className="block text-sm font-medium mb-1">
                  Location (for weather)
                </label>
                <input
                  id="location"
                  name="location"
                  type="text"
                  placeholder="e.g., New York, NY"
                  className="w-full" // All styling comes from index.css
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                />
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-500/50 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center btn btn-primary"
            >
              {loading ? 'Please wait...' : (isLogin ? 'Sign in' : 'Sign up')}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              // The default 'a' tag styling from index.css will apply here
              className="font-medium"
            >
              {isLogin ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;