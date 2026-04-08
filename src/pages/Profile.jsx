import React, { useEffect, useState } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { motion } from 'motion/react';
import { History, Bookmark, LogOut, Trash2, User, Clock } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const [history, setHistory] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      const historyQ = query(
        collection(db, `users/${auth.currentUser.uid}/history`),
        orderBy('timestamp', 'desc')
      );
      const watchlistQ = query(
        collection(db, `users/${auth.currentUser.uid}/watchlist`),
        orderBy('timestamp', 'desc')
      );

      const [historySnap, watchlistSnap] = await Promise.all([
        getDocs(historyQ),
        getDocs(watchlistQ)
      ]);

      const rawHistory = historySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const rawWatchlist = watchlistSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Filter duplicates by mediaId, keeping the most recent one
      const uniqueHistory = Array.from(
        rawHistory.reduce((map, item) => {
          if (!map.has(item.mediaId)) map.set(item.mediaId, item);
          return map;
        }, new Map()).values()
      );

      const uniqueWatchlist = Array.from(
        rawWatchlist.reduce((map, item) => {
          if (!map.has(item.mediaId)) map.set(item.mediaId, item);
          return map;
        }, new Map()).values()
      );

      setHistory(uniqueHistory);
      setWatchlist(uniqueWatchlist);
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (collectionName, itemId) => {
    if (!auth.currentUser) return;
    try {
      await deleteDoc(doc(db, `users/${auth.currentUser.uid}/${collectionName}`, itemId));
      if (collectionName === 'history') {
        setHistory(prev => prev.filter(item => item.id !== itemId));
      } else {
        setWatchlist(prev => prev.filter(item => item.id !== itemId));
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${auth.currentUser.uid}/${collectionName}/${itemId}`);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="pt-32 px-4 md:px-12 pb-20 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row items-center gap-8 mb-12 pb-12 border-b border-gray-800">
        <div className="w-32 h-32 bg-gray-800 rounded-full overflow-hidden flex items-center justify-center">
          {auth.currentUser?.photoURL ? (
            <img src={auth.currentUser.photoURL} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <User size={64} className="text-gray-600" />
          )}
        </div>
        <div className="text-center md:text-left flex-grow">
          <h1 className="text-4xl font-bold mb-2">{auth.currentUser?.displayName || 'Guest User'}</h1>
          <p className="text-gray-500 mb-6">{auth.currentUser?.email || 'Anonymous Account'}</p>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-6 py-2 bg-red-600 rounded font-bold hover:bg-red-700 transition-colors mx-auto md:mx-0"
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Watchlist */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Bookmark className="text-red-600" />
            <h2 className="text-2xl font-bold">My Watchlist</h2>
          </div>
          <div className="space-y-4">
            {watchlist.length > 0 ? (
              watchlist.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-4 bg-gray-900/50 p-3 rounded-lg group"
                >
                  <img src={item.image} alt={item.title} className="w-20 h-28 object-cover rounded" referrerPolicy="no-referrer" />
                  <div className="flex-grow">
                    <h3 className="font-bold text-lg">{item.title}</h3>
                    <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
                      <Clock size={14} /> Added {new Date(item.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => removeItem('watchlist', item.id)}
                    className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </motion.div>
              ))
            ) : (
              <p className="text-gray-500 italic">Your watchlist is empty.</p>
            )}
          </div>
        </section>

        {/* Watch History */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <History className="text-red-600" />
            <h2 className="text-2xl font-bold">Watch History</h2>
          </div>
          <div className="space-y-4">
            {history.length > 0 ? (
              history.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-4 bg-gray-900/50 p-3 rounded-lg group"
                >
                  <img src={item.image} alt={item.title} className="w-20 h-28 object-cover rounded" referrerPolicy="no-referrer" />
                  <div className="flex-grow">
                    <h3 className="font-bold text-lg">{item.title}</h3>
                    <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
                      <Clock size={14} /> Watched {new Date(item.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => removeItem('history', item.id)}
                    className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </motion.div>
              ))
            ) : (
              <p className="text-gray-500 italic">Your watch history is empty.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
