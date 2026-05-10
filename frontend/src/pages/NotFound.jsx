import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { motion } from 'framer-motion';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-brown-50 flex flex-col items-center justify-center p-4">
      <div className="flex items-center text-brown-900 font-black text-9xl tracking-tighter mb-4" style={{ fontFamily: 'Georgia, serif' }}>
        <span>4</span>
        <motion.div
          animate={{
            y: [0, -20, 0],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="mx-2 relative inline-flex items-center justify-center text-primary"
        >
          0
          <div className="absolute inset-0 flex flex-col items-center justify-center text-brown-900 top-2">
            {/* Sad Face overlay on the 0 */}
            <div className="flex gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-brown-900 block" style={{ transform: 'rotate(15deg)' }}></span>
              <span className="w-2 h-2 rounded-full bg-brown-900 block" style={{ transform: 'rotate(-15deg)' }}></span>
            </div>
            <div className="w-4 h-2 border-t-2 border-brown-900 rounded-t-full mt-1"></div>
            {/* Tear drop */}
            <motion.div
               animate={{ y: [0, 15], opacity: [1, 0] }}
               transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
               className="w-1.5 h-2.5 bg-blue-400 rounded-b-full rounded-t-full absolute -right-1 top-10"
            />
          </div>
        </motion.div>
        <span>4</span>
      </div>

      <h1 className="text-2xl font-bold text-brown-900 mb-2">Page Not Found</h1>
      <p className="text-brown-500 mb-8 text-center max-w-md">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>

      <Link
        to="/dashboard"
        className="flex items-center gap-2 px-6 py-3 bg-brown-500 hover:bg-brown-600 text-white rounded-xl font-medium transition-colors shadow-sm"
      >
        <Home size={20} />
        Back to Dashboard
      </Link>
    </div>
  );
};

export default NotFound;
