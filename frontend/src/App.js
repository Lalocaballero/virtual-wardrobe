import React, { useEffect, useState } from 'react';
import useWardrobeStore from './store/wardrobeStore';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import './App.css';

function App() {
  const { user, initUser, error } = useWardrobeStore();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      await initUser();
      setIsInitializing(false);
    };
    
    initialize();
  }, [initUser]);

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      {error && error.includes('Session expired') && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4">
          <p className="font-bold">Session Expired</p>
          <p>Please log in again to continue.</p>
        </div>
      )}
      {user ? <Dashboard /> : <Login />}
    </div>
  );
}

export default App;