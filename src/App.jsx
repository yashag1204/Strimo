import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/firebase';
import { initDB } from './lib/db';
import { syncShows } from './services/api';
import { ErrorBoundary } from './components/ErrorBoundary';
import Home from './pages/Home';
import Search from './pages/Search';
import Profile from './pages/Profile';
import Auth from './pages/Auth';
import Layout from './components/Layout';
import { motion, AnimatePresence } from 'motion/react';
import { Wifi, WifiOff } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    initDB();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    const handleOnline = () => {
      setIsOnline(true);
      // Re-sync when back online
      setSyncing(true);
      syncShows().finally(() => setSyncing(false));
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial sync if online
    if (navigator.onLine) {
      setSyncing(true);
      syncShows().finally(() => setSyncing(false));
    }

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <div className="relative min-h-screen bg-black text-white selection:bg-red-600 selection:text-white">
          {/* Online/Offline Status Indicator */}
          <AnimatePresence>
            {!isOnline && (
              <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -50, opacity: 0 }}
                className="fixed top-0 left-0 right-0 z-[100] bg-red-600 text-white py-1 px-4 flex items-center justify-center gap-2 text-sm font-medium"
              >
                <WifiOff size={16} />
                You are currently offline. Using cached data.
              </motion.div>
            )}
            {isOnline && syncing && (
              <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -50, opacity: 0 }}
                className="fixed top-0 left-0 right-0 z-[100] bg-blue-600 text-white py-1 px-4 flex items-center justify-center gap-2 text-sm font-medium"
              >
                <Wifi size={16} className="animate-pulse" />
                Syncing latest content...
              </motion.div>
            )}
          </AnimatePresence>

          <Routes>
            <Route path="/auth" element={!user ? <Auth /> : <Navigate to="/" />} />
            <Route
              path="/"
              element={user ? <Layout /> : <Navigate to="/auth" />}
            >
              <Route index element={<Home />} />
              <Route path="tv-shows" element={<Home category="TV Shows" />} />
              <Route path="movies" element={<Home category="Movies" />} />
              <Route path="video-games" element={<Home category="Video Games" />} />
              <Route path="search" element={<Search />} />
              <Route path="profile" element={<Profile />} />
            </Route>
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  );
}
