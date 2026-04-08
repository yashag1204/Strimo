import React, { useEffect, useState, useMemo, useRef } from 'react';
import { getAllShows } from '../lib/db';
import { useInView } from 'react-intersection-observer';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Info, Plus, Check, X, Clock, Star } from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { cn } from '../lib/utils';

export default function Home({ category }) {
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedShow, setSelectedShow] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [visibleCount, setVisibleCount] = useState(20);
  const { ref, inView } = useInView();

  useEffect(() => {
    const loadData = async () => {
      const allShows = await getAllShows();
      setShows(allShows);
      setLoading(false);
    };
    loadData();
    fetchWatchlist();
  }, []);

  useEffect(() => {
    if (inView && visibleCount < filteredShows.length) {
      setVisibleCount((prev) => prev + 20);
    }
  }, [inView]);

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

  const filteredShows = useMemo(() => {
    if (!category || category === 'Home') return shows;
    
    if (category === 'TV Shows') {
      return shows.filter(s => s.type === 'Scripted' || s.type === 'Reality' || s.type === 'Talk Show');
    }
    
    if (category === 'Movies') {
      // TVMaze mostly has TV shows, but we can filter by 'Film' type or specific genres often associated with movies in this dataset
      return shows.filter(s => s.genres.includes('Drama') || s.genres.includes('Action') || s.genres.includes('Thriller'));
    }

    if (category === 'Video Games') {
      return shows.filter(s => s.genres.includes('Sci-Fi') || s.genres.includes('Adventure') || s.genres.includes('Fantasy'));
    }
    
    return shows.filter((show) => 
      show.genres.some(g => g.toLowerCase().includes(category.toLowerCase()))
    );
  }, [shows, category]);

  const recommendedShows = useMemo(() => {
    if (!selectedShow) return [];
    return shows
      .filter(s => s.id !== selectedShow.id && s.genres.some(g => selectedShow.genres.includes(g)))
      .slice(0, 6);
  }, [selectedShow, shows]);

  const homeRows = useMemo(() => {
    if (category && category !== 'Home') return [];
    
    const top10 = [...shows]
      .sort((a, b) => (b.rating?.average || 0) - (a.rating?.average || 0))
      .slice(0, 10);

    return [
      { title: 'Top 10 Shows Today', data: top10, isLarge: true },
      { title: 'Trending Now', data: shows.slice(10, 30) },
      { title: 'Blockbuster Movies', data: shows.filter(s => s.genres.includes('Drama') || s.genres.includes('Thriller')).slice(0, 20) },
      { title: 'Action & Adventure', data: shows.filter(s => s.genres.includes('Action') || s.genres.includes('Adventure')).slice(0, 20) },
      { title: 'Comedies', data: shows.filter(s => s.genres.includes('Comedy')).slice(0, 20) },
      { title: 'Sci-Fi & Fantasy', data: shows.filter(s => s.genres.includes('Sci-Fi') || s.genres.includes('Fantasy')).slice(0, 20) },
      { title: 'Horror & Suspense', data: shows.filter(s => s.genres.includes('Horror') || s.genres.includes('Supernatural')).slice(0, 20) },
    ];
  }, [shows, category]);

  const topShow = useMemo(() => {
    if (shows.length === 0) return null;
    const topRated = shows.filter(s => (s.rating?.average || 0) > 8.5);
    return topRated[Math.floor(Math.random() * topRated.length)] || shows[0];
  }, [shows]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* Hero Section */}
      {topShow && !category && (
        <div className="relative h-[80vh] w-full overflow-hidden">
          <motion.img
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            src={topShow.image?.original || topShow.image?.medium}
            alt={topShow.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
          
          <div className="absolute bottom-[20%] left-4 md:left-12 max-w-xl">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-4xl md:text-6xl font-black mb-4 uppercase tracking-tighter drop-shadow-2xl"
            >
              {topShow.name}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="text-lg text-gray-200 mb-6 line-clamp-3 drop-shadow-lg"
              dangerouslySetInnerHTML={{ __html: topShow.summary }}
            />
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.8 }}
              className="flex items-center gap-4"
            >
              <button 
                onClick={() => {
                  setSelectedShow(topShow);
                  handleAddToHistory(topShow);
                }}
                className="flex items-center gap-2 bg-white text-black px-8 py-3 rounded font-bold hover:bg-gray-200 transition-all hover:scale-105 active:scale-95"
              >
                <Play fill="currentColor" size={20} /> Play
              </button>
              <button 
                onClick={() => setSelectedShow(topShow)}
                className="flex items-center gap-2 bg-gray-500/50 text-white px-8 py-3 rounded font-bold hover:bg-gray-500/70 transition-all hover:scale-105 active:scale-95 backdrop-blur-md"
              >
                <Info size={20} /> More Info
              </button>
            </motion.div>
          </div>
        </div>
      )}

      {/* Content Grid */}
      <div className={cn("px-4 md:px-12 pb-12 relative z-10", !category ? "-mt-16 md:-mt-32" : "pt-32")}>
        {!category || category === 'Home' ? (
          <div className="space-y-12 md:space-y-16">
            {homeRows.map((row, rowIndex) => (
              <motion.div 
                key={row.title} 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, delay: rowIndex * 0.1 }}
                className="relative"
              >
                <h2 className="text-xl md:text-2xl font-bold mb-4 px-1">{row.title}</h2>
                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar scroll-smooth">
                  {row.data.map((show, index) => (
                    <motion.div
                      key={`${row.title}-${show.id}`}
                      layoutId={`show-${show.id}`}
                      whileHover={{ 
                        scale: 1.15, 
                        zIndex: 50,
                        transition: { duration: 0.3, ease: "easeOut" }
                      }}
                      className={cn(
                        "relative flex-shrink-0 rounded-md overflow-hidden cursor-pointer group",
                        row.isLarge ? "w-[200px] md:w-[300px] aspect-[2/3]" : "w-[160px] md:w-[240px] aspect-[16/9]"
                      )}
                      onClick={() => setSelectedShow(show)}
                    >
                      {row.isLarge && (
                        <div className="absolute left-0 bottom-0 z-10 pointer-events-none">
                          <span className="text-[120px] md:text-[180px] font-black leading-none text-black stroke-white stroke-2 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] opacity-80 select-none" style={{ WebkitTextStroke: '2px white' }}>
                            {index + 1}
                          </span>
                        </div>
                      )}
                      <img
                        src={show.image?.medium}
                        alt={show.name}
                        className={cn(
                          "w-full h-full object-cover transition-transform duration-300",
                          row.isLarge && "ml-[20%] w-[80%]"
                        )}
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                        <h3 className="font-bold text-xs md:text-sm line-clamp-1">{show.name}</h3>
                        <div className="flex items-center gap-2 mt-2">
                          <button className="p-1.5 bg-white text-black rounded-full">
                            <Play size={10} fill="currentColor" />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!watchlist.includes(show.id)) handleAddToWatchlist(show);
                            }}
                            className="p-1.5 border border-gray-400 rounded-full"
                          >
                            {watchlist.includes(show.id) ? <Check size={10} /> : <Plus size={10} />}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-6">{category}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredShows.slice(0, visibleCount).map((show, index) => (
                <motion.div
                  key={show.id}
                  whileHover={{ scale: 1.05, zIndex: 20 }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: (index % 20) * 0.05 }}
                  className="relative aspect-[2/3] rounded-md overflow-hidden cursor-pointer group"
                  onClick={() => setSelectedShow(show)}
                >
                  <img
                    src={show.image?.medium}
                    alt={show.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                    <h3 className="font-bold text-sm line-clamp-1">{show.name}</h3>
                    <div className="flex items-center gap-2 mt-2">
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
            
            <div ref={ref} className="h-20 flex items-center justify-center mt-8">
              {visibleCount < filteredShows.length && (
                <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
              )}
            </div>
          </>
        )}
      </div>

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
