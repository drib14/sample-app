import React from 'react';
import { Sparkles, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

const RightSidebar = ({ posts }) => {
  // Aggregate feelings from recent posts
  const aggregatedFeelings = React.useMemo(() => {
    const counts = {};
    const iconMap = {};

    posts.forEach(post => {
      // Handle the case where feeling might be stored as a stringified object
      // or just a label if it was improperly saved previously
      if (post.feeling) {
        let label = post.feeling;
        let iconSrc = null;

        // If feeling is a stringified object or has object properties
        try {
          if (typeof post.feeling === 'string' && post.feeling.startsWith('{')) {
            const parsed = JSON.parse(post.feeling);
            label = parsed.label;
            iconSrc = parsed.icon;
          } else if (typeof post.feeling === 'object' && post.feeling.label) {
            label = post.feeling.label;
            iconSrc = post.feeling.icon;
          } else {
             // It's a simple string, we map to some default icons or just use the label
             label = post.feeling;
             iconSrc = "https://cdn.lordicon.com/lupuorrc.json"; // default generic animated icon
          }
        } catch (e) {
          label = post.feeling;
          iconSrc = "https://cdn.lordicon.com/lupuorrc.json";
        }

        counts[label] = (counts[label] || 0) + 1;
        if (iconSrc && !iconMap[label]) {
           iconMap[label] = iconSrc;
        }
      }
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3) // Top 3 vibes
      .map(([label]) => {
        return { label, icon: iconMap[label] || "https://cdn.lordicon.com/lupuorrc.json" };
      });
  }, [posts]);

  // Aggregate trending hashtags from recent posts content
  const trendingTopics = React.useMemo(() => {
    const hashtagCounts = {};
    const hashtagRegex = /#[\w]+/g;

    posts.forEach(post => {
      if (post.content) {
        const tags = post.content.match(hashtagRegex);
        if (tags) {
          // unique tags per post so a spammer can't dominate easily
          const uniqueTags = [...new Set(tags)];
          uniqueTags.forEach(tag => {
            hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
          });
        }
      }
    });

    return Object.entries(hashtagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([tag, count]) => ({ tag, count }));
  }, [posts]);

  return (
    <div className="w-full space-y-6">
      {/* Network Vibe / Mood Board */}
      <div className="bg-gradient-to-br from-brown-50 to-white rounded-2xl shadow-sm border border-brown-100 p-5">
        <div className="flex items-center gap-2 mb-4 text-brown-900">
          <Sparkles size={20} className="text-yellow-500" />
          <h3 className="font-bold">Network Vibe</h3>
        </div>

        {aggregatedFeelings.length > 0 ? (
          <div>
            <p className="text-sm text-brown-600 mb-4">Your network is mostly feeling:</p>
            <div className="flex flex-col gap-3">
              {aggregatedFeelings.map((feeling, i) => (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={feeling.label}
                  className="flex items-center gap-3 bg-white p-2 rounded-xl border border-brown-50 shadow-sm"
                >
                  <div className="w-10 h-10 rounded-full bg-brown-50 flex items-center justify-center shrink-0">
                    <lord-icon
                      src={feeling.icon}
                      trigger="hover"
                      colors="primary:#a18072,secondary:#43302b"
                      style={{ width: '24px', height: '24px' }}
                    ></lord-icon>
                  </div>
                  <span className="font-medium text-brown-900 text-sm capitalize">{feeling.label}</span>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <lord-icon
              src="https://cdn.lordicon.com/wzwygmng.json"
              trigger="loop"
              delay="2000"
              colors="primary:#d4c4bc,secondary:#a18072"
              style={{ width: '50px', height: '50px' }}
            ></lord-icon>
            <p className="text-sm text-brown-400 mt-2">Quiet vibes today.</p>
          </div>
        )}
      </div>

      {/* Trending Topics */}
      <div className="bg-white rounded-2xl shadow-sm border border-brown-100 p-5">
        <div className="flex items-center gap-2 mb-4 text-brown-900">
          <TrendingUp size={20} className="text-green-500" />
          <h3 className="font-bold">Trending Topics</h3>
        </div>

        {trendingTopics.length > 0 ? (
          <div className="space-y-3">
            {trendingTopics.map(({ tag, count }, i) => (
              <div key={i} className="group cursor-pointer">
                <p className="text-sm font-semibold text-brown-800 group-hover:text-primary transition-colors">{tag}</p>
                <p className="text-xs text-brown-400">{count} {count === 1 ? 'post' : 'posts'}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-brown-400 text-center py-4">No trending topics yet.</p>
        )}
      </div>
    </div>
  );
};

export default RightSidebar;
