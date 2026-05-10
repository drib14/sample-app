import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Register from './pages/Register';
import Login from './pages/Login';
import Locked from './pages/Locked';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import ProfileAbout from './pages/ProfileAbout';
import SavedPosts from './pages/SavedPosts';
import SinglePost from './pages/SinglePost';
import NotFound from './pages/NotFound';

function App() {
  // Let the connection logic be handled inside Dashboard and Profile
  // where we can watch user state changes upon successful login

  return (
    <>
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        toastStyle={{
          backgroundColor: '#fdf8f6',
          color: '#43302b',
          borderRadius: '12px',
          border: '1px solid #eaddd7',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}
      />
      <Router>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/locked" element={<Locked />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile/:username" element={<Profile />} />
          <Route path="/profile/:username/about" element={<ProfileAbout />} />
          <Route path="/saved" element={<SavedPosts />} />
          <Route path="/post/:id" element={<SinglePost />} />
          <Route path="/not-found" element={<NotFound />} />
          <Route path="/" element={<Login />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
