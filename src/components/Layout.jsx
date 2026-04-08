import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, User, LogOut, Menu, X, Home as HomeIcon, Tv, Clapperboard, Gamepad2 } from 'lucide-react';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function Layout() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'New Version Available', message: 'Strimo v2.1 is here with improved streaming quality!', type: 'update', time: '2h ago' },
    { id: 2, title: 'Trending Now', message: 'The Witcher is trending in your region. Watch now!', type: 'movie', time: '5h ago' },
    { id: 3, title: 'Watchlist Reminder', message: 'Don\'t forget to finish "Stranger Things" from your watchlist.', type: 'watchlist', time: '1d ago' },
    { id: 4, title: 'New Release', message: 'A new documentary "Our Planet" has been added.', type: 'movie', time: '2d ago' },
  ]);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/', icon: HomeIcon },
    { name: 'TV Shows', path: '/tv-shows', icon: Tv },
    { name: 'Movies', path: '/movies', icon: Clapperboard },
    { name: 'Video Games', path: '/video-games', icon: Gamepad2 },
  ];

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/auth');
  };

  const markAllAsRead = () => {
    setNotifications([]);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-colors duration-300 px-4 md:px-12 py-4 flex items-center justify-between',
          isScrolled ? 'bg-black' : 'bg-gradient-to-b from-black/80 to-transparent'
        )}
      >
        <div className="flex items-center gap-8">
          <Link to="/" className="text-red-600 text-3xl font-black tracking-tighter">
            STRIMO
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-gray-300 flex items-center gap-2',
                  location.pathname === link.path ? 'text-white' : 'text-gray-400'
                )}
              >
                <link.icon size={16} />
                {link.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4 md:gap-6">
          <Link to="/search" className="hover:text-gray-300 transition-colors">
            <Search size={20} />
          </Link>
          <div className="relative">
            <button 
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="hover:text-gray-300 transition-colors relative"
            >
              <Bell size={20} />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-600 rounded-full"></span>
              )}
            </button>
            
            <AnimatePresence>
              {isNotificationsOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-[-1]" 
                    onClick={() => setIsNotificationsOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-4 w-80 bg-black/95 border border-gray-800 rounded-md shadow-2xl overflow-hidden"
                  >
                    <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                      <h3 className="font-bold">Notifications</h3>
                      <span className="text-xs text-gray-500">{notifications.length} New</span>
                    </div>
                    <div className="max-h-96 overflow-y-auto no-scrollbar">
                      {notifications.length > 0 ? (
                        notifications.map((notif) => (
                          <div key={notif.id} className="p-4 border-b border-gray-900 hover:bg-gray-900 transition-colors cursor-pointer">
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-xs font-bold text-red-600 uppercase tracking-wider">{notif.type}</span>
                              <span className="text-[10px] text-gray-500">{notif.time}</span>
                            </div>
                            <h4 className="text-sm font-bold mb-1">{notif.title}</h4>
                            <p className="text-xs text-gray-400 leading-relaxed">{notif.message}</p>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center text-gray-500 text-sm italic">
                          No new notifications
                        </div>
                      )}
                    </div>
                    <div className="p-3 text-center border-t border-gray-800">
                      <button 
                        onClick={markAllAsRead}
                        className="text-xs text-gray-500 hover:text-white transition-colors"
                      >
                        Mark all as read
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          <div className="relative group">
            <Link to="/profile" className="flex items-center gap-2 hover:text-gray-300 transition-colors">
              <div className="w-8 h-8 bg-gray-700 rounded overflow-hidden">
                {auth.currentUser?.photoURL ? (
                  <img src={auth.currentUser.photoURL} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-full h-full p-1" />
                )}
              </div>
            </Link>
            <div className="absolute right-0 top-full mt-2 w-48 bg-black/90 border border-gray-800 rounded-md shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-2">
              <Link to="/profile" className="flex items-center gap-3 px-4 py-2 hover:bg-gray-800 text-sm">
                <User size={16} /> Profile
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-800 text-sm text-left text-red-500"
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          </div>
          <button
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="fixed inset-0 z-40 bg-black pt-24 px-6 md:hidden"
          >
            <nav className="flex flex-col gap-6 text-xl">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'font-medium transition-colors flex items-center gap-4',
                    location.pathname === link.path ? 'text-white' : 'text-gray-400'
                  )}
                >
                  <link.icon size={24} />
                  {link.name}
                </Link>
              ))}
              <hr className="border-gray-800" />
              <button
                onClick={handleLogout}
                className="text-left text-red-500 font-medium"
              >
                Sign Out
              </button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-grow pt-0 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="bg-black py-12 px-4 md:px-12 border-t border-gray-900 text-gray-500 text-sm">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="flex flex-col gap-3">
            <Link to="#" className="hover:underline">Audio Description</Link>
            <Link to="#" className="hover:underline">Help Center</Link>
            <Link to="#" className="hover:underline">Gift Cards</Link>
          </div>
          <div className="flex flex-col gap-3">
            <Link to="#" className="hover:underline">Media Center</Link>
            <Link to="#" className="hover:underline">Investor Relations</Link>
            <Link to="#" className="hover:underline">Jobs</Link>
          </div>
          <div className="flex flex-col gap-3">
            <Link to="#" className="hover:underline">Terms of Use</Link>
            <Link to="#" className="hover:underline">Privacy</Link>
            <Link to="#" className="hover:underline">Legal Notices</Link>
          </div>
          <div className="flex flex-col gap-3">
            <Link to="#" className="hover:underline">Cookie Preferences</Link>
            <Link to="#" className="hover:underline">Corporate Information</Link>
            <Link to="#" className="hover:underline">Contact Us</Link>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-8">
          <p>© 2026 Strimo, Inc.</p>
        </div>
      </footer>
    </div>
  );
}
