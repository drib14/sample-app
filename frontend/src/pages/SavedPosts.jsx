import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import Avatar from '../components/Avatar';
import { ArrowLeft, Bookmark } from 'lucide-react';

const SavedPosts = () => {
  const [user, setUser] = useState(null);
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('makiUser');
    const token = localStorage.getItem('makiToken');

    if (!storedUser || !token) {
      navigate('/login');
    } else {
      setUser(JSON.parse(storedUser));
      fetchSavedPosts();
    }
  }, [navigate]);

  const fetchSavedPosts = async () => {
    try {
      const res = await api.get('/users/saved', {
        headers: { Authorization: `Bearer ${localStorage.getItem('makiToken')}` }
      });
      // Limit to 9 items (3x3 grid)
      setSavedPosts(res.data.slice(0, 9));
    } catch (err) {
      console.error('Failed to fetch saved posts', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-brown-50 pb-20 md:pb-0">
      <Navbar user={user} />

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/dashboard" className="p-2 text-brown-500 hover:bg-white rounded-full transition-colors bg-brown-100/50">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-2">
             <Bookmark size={24} className="text-primary" />
             <h1 className="text-2xl font-bold text-brown-900">Saved Posts</h1>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <lord-icon src="https://cdn.lordicon.com/xjovhxra.json" trigger="loop" colors="primary:#a18072,secondary:#43302b" style={{ width: '50px', height: '50px' }}></lord-icon>
          </div>
        ) : savedPosts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {savedPosts.map(post => (
              <Link
                key={post._id}
                to={`/post/${post._id}`}
                className="bg-white rounded-2xl shadow-sm border border-brown-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col h-[280px]"
              >
                {post.media && post.media.length > 0 ? (
                  <div className="h-40 w-full bg-brown-100 relative">
                     {post.media[0].type === 'video' ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                           <div className="w-10 h-10 bg-white/80 rounded-full flex items-center justify-center">
                              <div className="w-0 h-0 border-t-8 border-b-8 border-l-12 border-transparent border-l-brown-900 ml-1"></div>
                           </div>
                        </div>
                     ) : (
                        <img src={post.media[0].url} alt="Media" className="w-full h-full object-cover" />
                     )}
                  </div>
                ) : (
                  <div className="h-40 w-full bg-brown-50 flex items-center justify-center p-4">
                     <p className="text-brown-700 text-sm line-clamp-4 italic text-center text-ellipsis overflow-hidden">
                       "{post.content}"
                     </p>
                  </div>
                )}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar user={post.author} size="xs" />
                      <span className="text-sm font-semibold text-brown-900 truncate">
                        {post.author?.firstName} {post.author?.lastName}
                      </span>
                    </div>
                    {post.media && post.media.length > 0 && post.content && (
                       <p className="text-xs text-brown-600 line-clamp-2">{post.content}</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-brown-100 shadow-sm">
            <lord-icon src="https://cdn.lordicon.com/wzwygmng.json" trigger="loop" delay="2000" colors="primary:#d4c4bc,secondary:#a18072" style={{ width: '80px', height: '80px' }}></lord-icon>
            <p className="text-brown-500 mt-4 font-medium">You haven't saved any posts yet.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default SavedPosts;
