import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getAllShows } from '../lib/db';
import { searchShows } from '../services/api';
import { motion, AnimatePresence } from 'motion/react';
import { Search as SearchIcon, X, Play, Plus, Check, Star, Info } from 'lucide-react';
import debounce from 'lodash.debounce';
import { cn } from '../lib/utils';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, getDocs, query } from 'firebase/firestore';

export default function Search() {
  const [queryStr, setQueryStr] = useState('');
  const [results, setResults] = useState([]);
  const [allShows, setAllShows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [watchlist, setWatchlist] = useState([]);
  const [selectedShow, setSelectedShow] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      const shows = await getAllShows();
      setAllShows(shows);
    };
    loadData();
    fetchWatchlist();
  }, []);

  const fetchWatchlist = async () => {
    if (!auth.currentUser) return;
    try {
      const q = query(collection(db, `users/${auth.currentUser.uid}/watchlist`));
      const snapshot = await getDocs(q);
      setWatchlist(snapshot.docs.map(doc => doc.data().mediaId));
    } catch (error) {
      console.error('Error fetching watchlist:', error);
    }
  };

  const trendingShows = useMemo(() => {
    return allShows.filter(s => (s.rating?.average || 0) > 8.0).slice(0, 12);
  }, [allShows]);

  const recommendedShows = useMemo(() => {
    if (!selectedShow) return [];
    return allShows
      .filter(s => s.id !== selectedShow.id && s.genres.some(g => selectedShow.genres.includes(g)))
      .slice(0, 6);
  }, [selectedShow, allShows]);

  const performSearch = useCallback(
    debounce((searchTerm) => {
      if (!searchTerm.trim()) {
        setResults([]);
        setLoading(false);
        return;
      }

      const term = searchTerm.toLowerCase();
      const localResults = allShows.filter((show) => {
        return (
          show.name.toLowerCase().includes(term) ||
          show.id.toString() === term ||
          show.premiered?.includes(term) ||
          show.genres.some(g => g.toLowerCase().includes(term))
        );
      });

      setResults(localResults);
      setLoading(false);
    }, 300),
    [allShows]
  );

  useEffect(() => {
    if (queryStr) {
      setLoading(true);
      performSearch(queryStr);
    } else {
      setResults([]);
      setLoading(false);
    }
  }, [queryStr, performSearch]);

  const handleAddToWatchlist = async (show) => {
    if (!auth.currentUser) return;
    if (watchlist.includes(show.id)) return; // Already in watchlist
    
    try {
      const path = `users/${auth.currentUser.uid}/watchlist`;
      await addDoc(collection(db, path), {
        userId: auth.currentUser.uid,
        mediaId: show.id,
        title: show.name,
        image: show.image?.medium,
        timestamp: new Date().toISOString()
      });
      setWatchlist(prev => [...prev, show.id]);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${auth.currentUser.uid}/watchlist`);
    }
  };

  const handleAddToHistory = async (show) => {
    if (!auth.currentUser) return;
    try {
      const path = `users/${auth.currentUser.uid}/history`;
      await addDoc(collection(db, path), {
        userId: auth.currentUser.uid,
        mediaId: show.id,
        title: show.name,
        image: show.image?.medium,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${auth.currentUser.uid}/history`);
    }
  };

  return (
    <div className="pt-32 px-4 md:px-12 min-h-screen pb-20">
      <div className="max-w-4xl mx-auto mb-12">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={24} />
          <input
            type="text"
            value={queryStr}
            onChange={(e) => setQueryStr(e.target.value)}
            placeholder="Search by name, genre, or year..."
            className="w-full bg-gray-900/50 border border-gray-800 rounded-lg py-4 pl-14 pr-12 text-xl focus:outline-none focus:border-red-600 transition-colors"
            autoFocus
          />
          {queryStr && (
            <button
              onClick={() => setQueryStr('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
            >
              <X size={24} />
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : queryStr ? (
        results.length > 0 ? (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold">Top Results</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {results.map((show, index) => (
                <motion.div
                  key={show.id}
                  layoutId={`show-${show.id}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: (index % 20) * 0.03 }}
                  whileHover={{ 
                    scale: 1.15, 
                    zIndex: 50,
                    transition: { duration: 0.3, ease: "easeOut" }
                  }}
                  className="relative aspect-[2/3] rounded-md overflow-hidden group cursor-pointer"
                  onClick={() => setSelectedShow(show)}
                >
                  <img
                    src={show.image?.medium}
                    alt={show.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                    <h3 className="font-bold text-sm mb-2">{show.name}</h3>
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 bg-white text-black rounded-full">
                        <Play size={12} fill="currentColor" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!watchlist.includes(show.id)) handleAddToWatchlist(show);
                        }}
                        className="p-1.5 border border-gray-400 rounded-full"
                      >
                        {watchlist.includes(show.id) ? <Check size={12} /> : <Plus size={12} />}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-20 text-gray-500">
            <p className="text-xl">No results found for "{queryStr}"</p>
            <p className="mt-2">Try searching for something else.</p>
          </div>
        )
      ) : (
        <div className="space-y-8">
          <h2 className="text-2xl font-bold">Trending Searches</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trendingShows.map((show) => (
              <motion.div
                key={`trending-${show.id}`}
                whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                className="flex items-center gap-4 bg-gray-900/30 p-2 rounded-md cursor-pointer group"
                onClick={() => setSelectedShow(show)}
              >
                <img src={show.image?.medium} alt={show.name} className="w-20 h-12 object-cover rounded" referrerPolicy="no-referrer" />
                <span className="flex-grow font-medium">{show.name}</span>
                <Play size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Preview Modal */}
      <AnimatePresence>
        {selectedShow && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setSelectedShow(null)}
            />
            <motion.div
              layoutId={selectedShow ? `show-${selectedShow.id}` : undefined}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-[#181818] rounded-xl overflow-hidden shadow-2xl my-auto"
            >
              <button 
                onClick={() => setSelectedShow(null)}
                className="absolute top-4 right-4 z-10 p-2 bg-black/60 rounded-full hover:bg-black/80 transition-colors"
              >
                <X size={24} />
              </button>

              <div className="relative h-64 md:h-96">
                <img
                  src={selectedShow.image?.original || selectedShow.image?.medium}
                  alt={selectedShow.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#181818] to-transparent" />
                <div className="absolute bottom-8 left-8">
                  <h2 className="text-3xl md:text-5xl font-black mb-4 uppercase tracking-tighter">
                    {selectedShow.name}
                  </h2>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => handleAddToHistory(selectedShow)}
                      className="flex items-center gap-2 bg-white text-black px-8 py-2 rounded font-bold hover:bg-gray-200 transition-colors"
                    >
                      <Play fill="currentColor" size={20} /> Play
                    </button>
                    <button 
                      onClick={() => !watchlist.includes(selectedShow.id) && handleAddToWatchlist(selectedShow)}
                      className="p-2 border border-gray-500 rounded-full hover:border-white transition-colors"
                    >
                      {watchlist.includes(selectedShow.id) ? <Check size={24} /> : <Plus size={24} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-8">
                <div className="grid md:grid-cols-[2fr,1fr] gap-8 mb-12">
                  <div>
                    <div className="flex items-center gap-4 mb-4 text-sm font-medium">
                      <span className="text-green-500">{(selectedShow.rating?.average || 0) * 10}% Match</span>
                      <span className="text-gray-400">{selectedShow.premiered?.split('-')[0]}</span>
                      <span className="border border-gray-600 px-1 text-[10px] rounded">HD</span>
                    </div>
                    <div 
                      className="text-gray-300 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: selectedShow.summary }}
                    />
                  </div>
                  <div className="space-y-4 text-sm">
                    <div>
                      <span className="text-gray-500">Genres: </span>
                      <span className="text-gray-300">{selectedShow.genres.join(', ')}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Rating: </span>
                      <span className="text-gray-300 flex items-center gap-1">
                        <Star size={14} className="text-yellow-500 fill-yellow-500" />
                        {selectedShow.rating?.average || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* More Like This */}
                {recommendedShows.length > 0 && (
                  <div>
                    <h3 className="text-2xl font-bold mb-6">More Like This</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {recommendedShows.map((show) => (
                        <div 
                          key={show.id}
                          onClick={() => setSelectedShow(show)}
                          className="bg-[#2f2f2f] rounded-md overflow-hidden cursor-pointer hover:bg-[#3f3f3f] transition-colors"
                        >
                          <div className="aspect-video relative">
                            <img src={show.image?.medium} alt={show.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            <div className="absolute top-2 right-2 text-xs font-bold bg-black/40 px-2 py-1 rounded">
                              {show.premiered?.split('-')[0]}
                            </div>
                          </div>
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-green-500 text-sm font-bold">{(show.rating?.average || 0) * 10}% Match</span>
                              <button className="p-1 border border-gray-500 rounded-full">
                                <Plus size={14} />
                              </button>
                            </div>
                            <h4 className="font-bold text-sm line-clamp-1">{show.name}</h4>
                            <p className="text-xs text-gray-400 mt-2 line-clamp-3" dangerouslySetInnerHTML={{ __html: show.summary }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
