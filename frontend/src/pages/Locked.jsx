import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const Locked = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-brown-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center"
      >
        <div className="flex justify-center mb-6">
          <lord-icon
            src="https://cdn.lordicon.com/rpgnzhfu.json"
            trigger="loop"
            colors="primary:#a18072,secondary:#43302b"
            style={{ width: '100px', height: '100px' }}
          ></lord-icon>
        </div>
        <h2 className="text-2xl font-bold text-brown-900 mb-4">Temporarily Locked</h2>
        <p className="text-brown-600 mb-8">
          You've made too many requests. Please wait 15 minutes before trying again.
        </p>
        <Link
          to="/"
          className="inline-block w-full py-3 px-4 bg-brown-500 hover:bg-brown-600 text-white rounded-lg font-medium transition-colors duration-200"
        >
          Return Home
        </Link>
      </motion.div>
    </div>
  );
};

export default Locked;
