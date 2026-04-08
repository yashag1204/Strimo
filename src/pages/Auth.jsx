import React, { useState } from 'react';
import { signInWithPopup, signInAnonymously } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { motion } from 'motion/react';
import { LogIn, UserCircle } from 'lucide-react';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInAnonymously(auth);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: 'url("https://picsum.photos/seed/netflix/1920/1080?blur=4")' }}
    >
      <div className="absolute inset-0 bg-black/60" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md p-8 md:p-12 bg-black/80 rounded-lg shadow-2xl border border-gray-800"
      >
        <h1 className="text-red-600 text-4xl font-black tracking-tighter mb-8 text-center">
          STRIMO
        </h1>
        
        <h2 className="text-2xl font-bold mb-6">Sign In</h2>
        
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-500 p-3 rounded mb-6 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-red-600 text-white py-3 rounded font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            <LogIn size={20} />
            Sign in with Google
          </button>

          <button
            onClick={handleGuestLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-gray-800 text-white py-3 rounded font-bold hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <UserCircle size={20} />
            Sign in as Guest
          </button>
        </div>

        <div className="mt-8 text-gray-500 text-sm">
          <p>New to Strimo? <span className="text-white hover:underline cursor-pointer">Sign up now.</span></p>
          <p className="mt-4 text-xs">
            This page is protected by Google reCAPTCHA to ensure you're not a bot. 
            <span className="text-blue-500 hover:underline cursor-pointer ml-1">Learn more.</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
