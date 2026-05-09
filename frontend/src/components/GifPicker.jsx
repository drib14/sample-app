import React, { useState } from 'react';
import { Grid } from '@giphy/react-components';
import { GiphyFetch } from '@giphy/js-fetch-api';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const gf = new GiphyFetch(import.meta.env.VITE_GIPHY_API_KEY || 'sXpGFDGZs0Dv1mmzI9cEMxM5M8TzjV1g'); // Fallback public key for sandbox if needed

const GifPicker = ({ onSelect, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const fetchGifs = (offset) => {
    if (searchTerm) {
      return gf.search(searchTerm, { offset, limit: 10 });
    }
    return gf.trending({ offset, limit: 10 });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="absolute bottom-full mb-2 right-0 w-72 bg-white rounded-xl shadow-xl border border-brown-200 overflow-hidden z-50 flex flex-col h-96"
    >
      <div className="p-3 border-b border-brown-100 flex items-center justify-between bg-brown-50">
        <input
          type="text"
          placeholder="Search GIFs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-brown-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-brown-500 text-brown-900"
        />
        <button onClick={onClose} className="ml-2 text-brown-400 hover:text-brown-600">
          <X size={18} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
        <Grid
          width={270}
          columns={2}
          gutter={6}
          fetchGifs={fetchGifs}
          key={searchTerm}
          onGifClick={(gif, e) => {
            e.preventDefault();
            onSelect(gif.images.fixed_height.url);
          }}
        />
      </div>
    </motion.div>
  );
};

export default GifPicker;
